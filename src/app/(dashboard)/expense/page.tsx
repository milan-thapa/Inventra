// src/app/(dashboard)/expense/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getExpenses, getExpenseCategories } from "@/lib/actions/expense";
import { ExpenseTable } from "@/components/expense/expense-table";

export const metadata = { title: "Expense" };

export default async function ExpensePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;

  const [expensesRes, categoriesRes] = await Promise.all([
    getExpenses(profileId),
    getExpenseCategories(profileId),
  ]);

  return (
    <ExpenseTable
      initialExpenses={(expensesRes.data as any) ?? []}
      initialTotal={expensesRes.total ?? 0}
      categories={(categoriesRes.data as any) ?? []}
      profileId={profileId}
    />
  );
}
