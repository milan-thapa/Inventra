// src/app/(dashboard)/business-tools/reminders/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getReminders } from "@/lib/actions/dashboard";
import { RemindersView } from "@/components/tools/reminders-view";

export const metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;

  const [upcomingRes, completedRes] = await Promise.all([
    getReminders(profileId, false),
    getReminders(profileId, true),
  ]);

  return (
    <RemindersView
      upcomingReminders={upcomingRes.data ?? []}
      completedReminders={completedRes.data ?? []}
      profileId={profileId}
    />
  );
}
