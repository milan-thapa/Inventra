// src/app/(dashboard)/reports/all-party/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getAllPartyReport } from "@/lib/actions/reports";
import { AllPartyReportView } from "@/components/reports/all-party-report";

export const metadata = { title: "All Party Report" };

export default async function AllPartyReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const reportRes = await getAllPartyReport(profileId);

  const parties = reportRes.data?.map(p => ({
    ...p,
    openingBalance: p.openingBalance.toNumber(),
  })) ?? [];

  return (
    <AllPartyReportView
      parties={parties}
      totalReceivable={reportRes.totalReceivable ?? 0}
      totalPayable={reportRes.totalPayable ?? 0}
      profileId={profileId}
    />
  );
}
