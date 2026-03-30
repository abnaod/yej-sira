import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";

/**
 * User-domain permissions (example: tighten/extend rules here).
 */
export function createUserAbility(userId: string) {
  const { can, build } = new AbilityBuilder(createPrismaAbility);
  can("read", "User", { id: userId });
  can("update", "User", { id: userId });
  return build();
}
