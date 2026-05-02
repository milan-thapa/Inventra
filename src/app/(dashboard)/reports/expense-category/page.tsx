// src/app/(dashboard)/reports/expense-category/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getExpenseCategoryReport } from "@/lib/actions/reports";
import { CategoryReportView } from "@/components/reports/category-report";

export const metadata = { title: "Expense Category Report" };

export default async function ExpenseCategoryReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const reportRes = await getExpenseCategoryReport(profileId);

  return (
    <CategoryReportView
      title="Expense Category Report"
      data={reportRes.data ?? []}
      grandTotal={reportRes.grandTotal ?? 0}
      type="expense"
      profileId={profileId}
    />
  );
}
