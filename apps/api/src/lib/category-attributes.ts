import {
  type CategoryAttributeInputType,
  ContentLocale,
  Prisma,
} from "@prisma/client";
import type { Locale } from "@ys/intl";
import { HTTPException } from "hono/http-exception";

import { prisma } from "./db";

export type AttributeInput = {
  key: string;
  allowedValueKey?: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
};

export async function getCategoryDefinitionsForApi(categoryId: string) {
  return prisma.categoryAttributeDefinition.findMany({
    where: { categoryId },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: true,
      allowedValues: {
        orderBy: { sortOrder: "asc" },
        include: { translations: true },
      },
    },
  });
}

export function pickLocaleLabel(
  translations: { locale: ContentLocale; label: string }[],
  locale: Locale,
): string {
  if (locale === "en") {
    return translations.find((t) => t.locale === ContentLocale.en)?.label ?? "";
  }
  return (
    translations.find((t) => t.locale === ContentLocale.am)?.label ??
    translations.find((t) => t.locale === ContentLocale.en)?.label ??
    ""
  );
}

export function mapDefinitionsToJson(
  defs: Awaited<ReturnType<typeof getCategoryDefinitionsForApi>>,
  locale: Locale,
) {
  return defs.map((d) => ({
    key: d.key,
    inputType: d.inputType as CategoryAttributeInputType,
    sortOrder: d.sortOrder,
    isRequired: d.isRequired,
    label: pickLocaleLabel(d.translations, locale),
    options:
      d.inputType === "select"
        ? d.allowedValues.map((o) => ({
            key: o.key,
            label: pickLocaleLabel(o.translations, locale),
          }))
        : undefined,
  }));
}

export type ValidatedValueRow = {
  definitionId: string;
  allowedValueId: string | null;
  textValue: string | null;
  numberValue: Prisma.Decimal | null;
  booleanValue: boolean | null;
};

export async function validateProductAttributeInputs(
  categoryId: string,
  inputs: AttributeInput[] | undefined,
): Promise<ValidatedValueRow[] | null> {
  if (inputs === undefined) {
    return null;
  }

  const defs = await getCategoryDefinitionsForApi(categoryId);
  const defByKey = new Map(defs.map((d) => [d.key, d]));

  const byKey = new Map<string, AttributeInput>();
  for (const row of inputs) {
    if (byKey.has(row.key)) {
      throw new HTTPException(400, { message: `Duplicate attribute key: ${row.key}` });
    }
    byKey.set(row.key, row);
  }

  const out: ValidatedValueRow[] = [];

  for (const def of defs) {
    const row = byKey.get(def.key);
    if (!def.isRequired && !row) {
      continue;
    }
    if (def.isRequired && !row) {
      throw new HTTPException(400, { message: `Missing required attribute: ${def.key}` });
    }
    if (!row) continue;

    if (def.inputType === "select") {
      const k = row.allowedValueKey;
      if (!k) {
        if (def.isRequired) {
          throw new HTTPException(400, { message: `Attribute ${def.key} requires allowedValueKey` });
        }
        continue;
      }
      const opt = def.allowedValues.find((o) => o.key === k);
      if (!opt) {
        throw new HTTPException(400, { message: `Invalid option for ${def.key}` });
      }
      out.push({
        definitionId: def.id,
        allowedValueId: opt.id,
        textValue: null,
        numberValue: null,
        booleanValue: null,
      });
      continue;
    }
    if (def.inputType === "text") {
      const t = row.textValue?.trim();
      if (!t) {
        if (def.isRequired) {
          throw new HTTPException(400, { message: `Attribute ${def.key} requires textValue` });
        }
        continue;
      }
      out.push({
        definitionId: def.id,
        allowedValueId: null,
        textValue: t,
        numberValue: null,
        booleanValue: null,
      });
      continue;
    }
    if (def.inputType === "number") {
      if (row.numberValue === undefined || Number.isNaN(row.numberValue)) {
        if (def.isRequired) {
          throw new HTTPException(400, { message: `Attribute ${def.key} requires numberValue` });
        }
        continue;
      }
      out.push({
        definitionId: def.id,
        allowedValueId: null,
        textValue: null,
        numberValue: new Prisma.Decimal(String(row.numberValue)),
        booleanValue: null,
      });
      continue;
    }
    if (def.inputType === "boolean") {
      if (row.booleanValue === undefined) {
        if (def.isRequired) {
          throw new HTTPException(400, { message: `Attribute ${def.key} requires booleanValue` });
        }
        continue;
      }
      out.push({
        definitionId: def.id,
        allowedValueId: null,
        textValue: null,
        numberValue: null,
        booleanValue: row.booleanValue,
      });
    }
  }

  for (const k of byKey.keys()) {
    if (!defByKey.has(k)) {
      throw new HTTPException(400, { message: `Unknown attribute key: ${k}` });
    }
  }

  return out;
}

export function serializeProductAttributeValuesForSeller(
  rows: Array<{
    definition: { key: string; inputType: CategoryAttributeInputType };
    allowedValue: { key: string } | null;
    textValue: string | null;
    numberValue: Prisma.Decimal | null;
    booleanValue: boolean | null;
  }>,
): AttributeInput[] {
  return rows.map((r) => {
    const base: AttributeInput = { key: r.definition.key };
    if (r.definition.inputType === "select" && r.allowedValue) {
      return { ...base, allowedValueKey: r.allowedValue.key };
    }
    if (r.definition.inputType === "text" && r.textValue != null) {
      return { ...base, textValue: r.textValue };
    }
    if (r.definition.inputType === "number" && r.numberValue != null) {
      return { ...base, numberValue: Number(r.numberValue) };
    }
    if (r.definition.inputType === "boolean" && r.booleanValue != null) {
      return { ...base, booleanValue: r.booleanValue };
    }
    return base;
  });
}

export function mapProductAttributeValuesForDetail(
  locale: Locale,
  rows: Array<{
    definition: {
      key: string;
      inputType: CategoryAttributeInputType;
      translations: { locale: ContentLocale; label: string }[];
    };
    allowedValue: null | {
      translations: { locale: ContentLocale; label: string }[];
    };
    textValue: string | null;
    numberValue: Prisma.Decimal | null;
    booleanValue: boolean | null;
  }>,
): { key: string; label: string; displayValue: string }[] {
  return rows.map((r) => {
    const label = pickLocaleLabel(r.definition.translations, locale);
    let displayValue = "";
    if (r.definition.inputType === "select" && r.allowedValue) {
      displayValue = pickLocaleLabel(r.allowedValue.translations, locale);
    } else if (r.definition.inputType === "text" && r.textValue) {
      displayValue = r.textValue;
    } else if (r.definition.inputType === "number" && r.numberValue != null) {
      displayValue = r.numberValue.toString();
    } else if (r.definition.inputType === "boolean" && r.booleanValue != null) {
      displayValue = r.booleanValue ? "Yes" : "No";
    }
    return { key: r.definition.key, label, displayValue };
  });
}
