import { randomUUID } from "node:crypto";
import type { User } from "@prisma/client";

import { prisma } from "../../lib/db";

export type GuestUserInput = {
  name: string;
  email: string;
  phone?: string | null;
};

/**
 * Find a user by email or create a guest user record (no credentials).
 *
 * Guest users:
 * - Have a normal `User` row so `Order.userId` and `/orders` continue to work.
 * - Have `emailVerified: false` and no `Account` row (no password set).
 * - Can later "claim" the account via the standard forgot-password / reset flow,
 *   which creates a credentials `Account` row and flips `emailVerified` to true.
 *
 * If an account with the submitted email already exists, we reuse it and update
 * name/phone (mirroring the signed-in buyer's user update on checkout). We do
 * NOT auto-create a session for them — they must sign in deliberately.
 */
export async function findOrCreateGuestUser(
  input: GuestUserInput,
): Promise<{ user: User; wasCreated: boolean }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone?.trim() ? input.phone.trim() : null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        phone: phone ?? existing.phone,
      },
    });
    return { user: updated, wasCreated: false };
  }

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: name || email,
      email,
      emailVerified: false,
      phone,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    },
  });

  return { user, wasCreated: true };
}

/**
 * A user is considered a "guest" account (unclaimed) when they have no
 * credentials `Account` row. This is used by order emails to decide whether
 * to include a "claim your account" call-to-action.
 */
export async function isUnclaimedGuestUser(userId: string): Promise<boolean> {
  const count = await prisma.account.count({
    where: { userId, providerId: "credential" },
  });
  return count === 0;
}
