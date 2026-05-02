// src/app/(dashboard)/parties/[partyId]/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getParty } from "@/lib/actions/party";
import { PartyDetail } from "@/components/parties/party-detail";

export const metadata = { title: "Party Details" };

export default async function PartyDetailPage({ params }: { params: { partyId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const partyRes = await getParty(profileId, params.partyId);

  if (!partyRes.data) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Party not found</h1>
      </div>
    );
  }

  return (
    <PartyDetail
      party={{
        ...partyRes.data,
        openingBalance: partyRes.data.openingBalance.toNumber(),
        partyTransactions: partyRes.data.partyTransactions.map(tx => ({...tx, amount: tx.amount.toNumber()}))
      }}
      profileId={profileId}
    />
  );
}
