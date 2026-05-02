// src/app/(dashboard)/reports/cash-in-hand-statement/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getCashInHandStatement } from "@/lib/actions/reports";
import { CashStatementView } from "@/components/reports/cash-statement";

export const metadata = { title: "Cash In Hand Statement" };

export default async function CashStatementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const reportRes = await getCashInHandStatement(profileId);

  return (
    <CashStatementView
      rows={reportRes.data ?? []}
      closingBalance={reportRes.closingBalance ?? 0}
      from={reportRes.from ?? new Date()}
      to={reportRes.to ?? new Date()}
      profileName={reportRes.profileName ?? ""}
    />
  );
}
