import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db";
import {
  getEnv,
  getTelegramMiniAppLauncherUrl,
  isValidShopSubdomainSlug,
} from "../../lib/env";
import { logger } from "../../lib/logger";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
};

export const telegramRouter = new Hono();

function parseShopCommand(text: string | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^\/(?:start|shop)(?:@\w+)?(?:\s+(.+))?$/i);
  const arg = match?.[1]?.trim().toLowerCase();
  if (!arg) return null;

  const slug = arg.replace(/^shop_/, "");
  return isValidShopSubdomainSlug(slug) ? slug : null;
}

async function sendTelegramMessage(args: {
  chatId: number | string;
  text: string;
  miniAppUrl?: string;
}) {
  const token = getEnv().TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    logger.warn("telegram.webhook.missing_bot_token");
    return;
  }

  const body: Record<string, unknown> = {
    chat_id: args.chatId,
    text: args.text,
  };

  if (args.miniAppUrl) {
    body.reply_markup = {
      inline_keyboard: [
        [
          {
            text: "Open shop",
            web_app: { url: args.miniAppUrl },
          },
        ],
      ],
    };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    logger.warn("telegram.webhook.send_failed", { status: res.status, errorText });
  }
}

telegramRouter.post("/telegram/webhook", async (c) => {
  const webhookSecret = getEnv().TELEGRAM_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const got = c.req.header("x-telegram-bot-api-secret-token");
    if (got !== webhookSecret) {
      throw new HTTPException(401, { message: "Invalid Telegram webhook secret" });
    }
  }

  const update = (await c.req.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  if (!chatId) return c.json({ ok: true });

  const slug = parseShopCommand(update?.message?.text);
  if (!slug) {
    const miniAppUrl = getTelegramMiniAppLauncherUrl();
    await sendTelegramMessage({
      chatId,
      text: "Send /shop followed by a shop slug, or open YEJSIRA from the button below.",
      miniAppUrl: miniAppUrl ?? undefined,
    });
    return c.json({ ok: true });
  }

  const shop = await prisma.shop.findFirst({
    where: { slug, status: "active" },
    select: { name: true, slug: true },
  });
  if (!shop) {
    await sendTelegramMessage({
      chatId,
      text: "That shop is not available right now.",
    });
    return c.json({ ok: true });
  }

  const miniAppUrl = getTelegramMiniAppLauncherUrl(shop.slug);
  await sendTelegramMessage({
    chatId,
    text: `Open ${shop.name} on YEJSIRA.`,
    miniAppUrl: miniAppUrl ?? undefined,
  });

  return c.json({ ok: true });
});
