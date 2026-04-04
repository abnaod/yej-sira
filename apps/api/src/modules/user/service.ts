import { prisma } from "../../lib/db";

export async function getUserById(id: string) {
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      ownedShop: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
        },
      },
    },
  });
  if (!row) return null;
  const { ownedShop, ...user } = row;
  return {
    ...user,
    shop: ownedShop,
  };
}
