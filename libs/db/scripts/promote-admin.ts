import { config } from "dotenv";

config({ path: "../../.env" });

async function main() {
  const [, , ...args] = process.argv;
  const positional = args.filter((a) => !a.startsWith("--"));
  const demote = args.includes("--demote");
  const email = positional[0];

  if (!email) {
    console.error(
      "usage: pnpm admin:promote <email> [--demote]\n" +
        "  promotes the user with the given email to role=admin\n" +
        "  pass --demote to downgrade back to customer",
    );
    process.exit(2);
  }

  const { prisma } = await import("../src/index.js");
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, name: true },
    });
    if (!user) {
      console.error(`no user with email "${email}"`);
      process.exit(1);
    }
    const nextRole = demote ? "customer" : "admin";
    if (user.role === nextRole) {
      console.log(`${user.email} is already ${nextRole}. nothing to do.`);
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { role: nextRole },
    });
    console.log(
      `updated ${user.email} (${user.name || "unnamed"}): ${user.role} → ${nextRole}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
