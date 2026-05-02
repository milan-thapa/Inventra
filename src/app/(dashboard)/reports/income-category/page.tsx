// src/app/(dashboard)/reports/income-category/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getIncomeCategoryReport } from "@/lib/actions/reports";
import { CategoryReportView } from "@/components/reports/category-report";

export const metadata = { title: "Income Category Report" };

export default async function IncomeCategoryReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const reportRes = await getIncomeCategoryReport(profileId);

  return (
    <CategoryReportView
      title="Income Category Report"
      data={reportRes.data ?? []}
      grandTotal={reportRes.grandTotal ?? 0}
      type="income"
      profileId={profileId}
    />
  );
}
