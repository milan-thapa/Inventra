// src/app/(dashboard)/parties/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getParties } from "@/lib/actions/party";
import { PartiesView } from "@/components/parties/parties-view";

export const metadata = { title: "Parties" };

export default async function PartiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const partiesRes = await getParties(profileId);

  const parties = partiesRes.data?.map(party => ({
    ...party,
    openingBalance: party.openingBalance.toNumber(),
    partyTransactions: party.partyTransactions.map(tx => ({
      ...tx,
      amount: tx.amount.toNumber(),
    })),
  })) ?? [];

  return (
    <PartiesView
      initialParties={parties}
      profileId={profileId}
    />
  );
}
