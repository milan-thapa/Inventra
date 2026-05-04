// src/app/(dashboard)/reports/transactions/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getRecentTransactions } from "@/lib/actions/dashboard";
import { TransactionReportView } from "@/components/reports/transaction-report";

export const metadata = { title: "Transaction Report" };

export default async function TransactionReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const txRes = await getRecentTransactions(profileId, 100);

  const transactions = txRes.data?.map(tx => ({
    ...tx,
    amount: Number(tx.amount),
  })) ?? [];

  return (
    <TransactionReportView
      transactions={transactions}
      profileId={profileId}
    />
  );
}
