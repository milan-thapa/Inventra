// src/app/(dashboard)/settings/feature-settings/transactions/manage-expense-categories/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getExpenseCategories } from "@/lib/actions/expense";
import { CategoryManager } from "@/components/settings/category-manager";

export const metadata = { title: "Manage Expense Categories" };

export default async function ManageExpenseCategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const categoriesRes = await getExpenseCategories(profileId);

  return (
    <CategoryManager
      title="Manage Expense Categories"
      initialCategories={categoriesRes.data?.map((c) => ({
        id: c.id,
        name: c.name,
        totalAmount: c.expenses?.reduce((sum, e) => sum + Number(e.totalAmount), 0) ?? 0,
      })) ?? []}
      profileId={profileId}
      type="expense"
    />
  );
}
