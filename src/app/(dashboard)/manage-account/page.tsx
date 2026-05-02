// src/app/(dashboard)/manage-account/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getAccounts } from "@/lib/actions/dashboard";
import { AccountsView } from "@/components/accounts/accounts-view";

export const metadata = { title: "Manage Accounts" };

export default async function ManageAccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const accountsRes = await getAccounts(profileId);

  return (
    <AccountsView
      initialAccounts={accountsRes.data?.map(a => ({...a, currentBalance: a.currentBalance.toNumber()})) ?? []}
      initialTotal={accountsRes.totalBalance ?? 0}
      profileId={profileId}
    />
  );
}
