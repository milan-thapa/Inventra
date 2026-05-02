// src/app/(dashboard)/settings/feature-settings/transactions/manage-income-categories/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getIncomeCategories } from "@/lib/actions/expense";
import { CategoryManager } from "@/components/settings/category-manager";

export const metadata = { title: "Manage Income Categories" };

export default async function ManageIncomeCategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const categoriesRes = await getIncomeCategories(profileId);

  return (
    <CategoryManager
      title="Manage Income Categories"
      initialCategories={(categoriesRes.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        totalAmount: 0,
      }))}
      profileId={profileId}
      type="income"
    />
  );
}
