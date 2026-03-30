import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";

/**
 * Base ability factory for a signed-in user. Domain modules can extend rules.
 */
export function defineAbilityForUser(userId: string) {
  const { can, build } = new AbilityBuilder(createPrismaAbility);
  can("read", "User", { id: userId });
  can("update", "User", { id: userId });
  return build();
}
