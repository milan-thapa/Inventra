// prisma/seed.ts
import { PrismaClient, ProfileType, CalendarType, BalanceType, PaymentMethod, ReminderType } from "@prisma/client";

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  "General", "Entertainment", "Health", "Fuel", "Food",
  "Recharge", "Shopping", "Travel", "Education", "Clothing",
  "Utilities", "Rent", "Maintenance", "Transportation", "Other",
];

const INCOME_CATEGORIES = [
  "Investment", "Salary", "Business Revenue", "Freelance",
  "Rental Income", "Interest", "Dividend", "Gift", "Other",
];

async function main() {
  console.log("🌱 Seeding Inventra database...");

  // ── Demo User ────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "demo@inventra.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@inventra.com",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Demo user:", user.email);

  // ── Demo Business Profile ────────────────────────────────
  const profile = await prisma.profile.upsert({
    where: { id: "demo-profile-id" },
    update: {},
    create: {
      id: "demo-profile-id",
      userId: user.id,
      type: ProfileType.BUSINESS,
      name: "My Shop",
      category: "Kirana Pasal",
      language: "en",
      calendarType: CalendarType.AD,
      theme: "dark",
      isDefault: true,
    },
  });
  console.log("✅ Demo profile:", profile.name);

  // ── Expense Categories ───────────────────────────────────
  for (const name of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: { profileId_name: { profileId: profile.id, name } },
      update: {},
      create: {
        profileId: profile.id,
        name,
        isDefault: true,
      },
    });
  }
  console.log(`✅ ${EXPENSE_CATEGORIES.length} expense categories seeded`);

  // ── Income Categories ────────────────────────────────────
  for (const name of INCOME_CATEGORIES) {
    await prisma.incomeCategory.upsert({
      where: { profileId_name: { profileId: profile.id, name } },
      update: {},
      create: {
        profileId: profile.id,
        name,
        isDefault: true,
      },
    });
  }
  console.log(`✅ ${INCOME_CATEGORIES.length} income categories seeded`);

  // ── Demo Parties ─────────────────────────────────────────
  const party1 = await prisma.party.upsert({
    where: { id: "demo-party-1" },
    update: {},
    create: {
      id: "demo-party-1",
      profileId: profile.id,
      name: "Aswin Thapa",
      phone: "9876543210",
      email: "aswinthapa@gmail.com",
      address: "Damti, Pyuthan",
      openingBalance: 1000,
      openingDate: new Date(),
      balanceType: BalanceType.TO_RECEIVE,
    },
  });

  const party2 = await prisma.party.upsert({
    where: { id: "demo-party-2" },
    update: {},
    create: {
      id: "demo-party-2",
      profileId: profile.id,
      name: "Rabin Thapa",
      phone: "9876543211",
      address: "Rampur, Chitwon",
      openingBalance: 500,
      openingDate: new Date(),
      balanceType: BalanceType.TO_GIVE,
    },
  });
  console.log("✅ Demo parties seeded");

  // ── Demo Party Transactions ──────────────────────────────
  await prisma.partyTransaction.upsert({
    where: { id: "demo-ptx-1" },
    update: {},
    create: {
      id: "demo-ptx-1",
      partyId: party1.id,
      profileId: profile.id,
      receiptNumber: 1,
      type: "OPENING_BALANCE",
      amount: 1000,
      paymentMethod: PaymentMethod.CASH,
      date: new Date(),
    },
  });

  await prisma.partyTransaction.upsert({
    where: { id: "demo-ptx-2" },
    update: {},
    create: {
      id: "demo-ptx-2",
      partyId: party2.id,
      profileId: profile.id,
      receiptNumber: 1,
      type: "OPENING_BALANCE",
      amount: 500,
      paymentMethod: PaymentMethod.CASH,
      date: new Date(),
    },
  });
  console.log("✅ Demo party transactions seeded");

  // ── Demo Expense ─────────────────────────────────────────
  const expCat = await prisma.expenseCategory.findFirst({
    where: { profileId: profile.id, name: "Recharge" },
  });

  if (expCat) {
    await prisma.expense.upsert({
      where: { id: "demo-expense-1" },
      update: {},
      create: {
        id: "demo-expense-1",
        profileId: profile.id,
        expenseNo: 1,
        categoryId: expCat.id,
        totalAmount: 100,
        paymentMethod: PaymentMethod.CASH,
        remarks: "Namaste Recharge Card",
        date: new Date(),
      },
    });
    console.log("✅ Demo expense seeded");
  }

  // ── Demo Income ──────────────────────────────────────────
  const incCat = await prisma.incomeCategory.findFirst({
    where: { profileId: profile.id, name: "Investment" },
  });

  if (incCat) {
    await prisma.income.upsert({
      where: { id: "demo-income-1" },
      update: {},
      create: {
        id: "demo-income-1",
        profileId: profile.id,
        incomeNo: 1,
        categoryId: incCat.id,
        totalAmount: 1000,
        paymentMethod: PaymentMethod.CASH,
        remarks: "IPO applied",
        date: new Date(),
      },
    });
    console.log("✅ Demo income seeded");
  }

  // ── Demo Reminders ───────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.reminder.upsert({
    where: { id: "demo-reminder-1" },
    update: {},
    create: {
      id: "demo-reminder-1",
      profileId: profile.id,
      title: "Collect payment from Aswin",
      type: ReminderType.PAYMENT,
      dueDate: tomorrow,
      isCompleted: false,
    },
  });
  console.log("✅ Demo reminder seeded");

  console.log("\n🎉 Inventra database seeded successfully!");
  console.log("   Demo login: demo@inventra.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
