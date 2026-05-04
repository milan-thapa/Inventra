// src/app/(dashboard)/income/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getIncomes, getIncomeCategories } from "@/lib/actions/expense";
import { IncomeTable } from "@/components/income/income-table";

export const metadata = { title: "Income" };

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;

  const [incomesRes, categoriesRes] = await Promise.all([
    getIncomes(profileId),
    getIncomeCategories(profileId),
  ]);

  return (
    <IncomeTable
      initialIncomes={(incomesRes.data as any) ?? []}
      initialTotal={incomesRes.total ?? 0}
      categories={(categoriesRes.data as any) ?? []}
      profileId={profileId}
    />
  );
}
