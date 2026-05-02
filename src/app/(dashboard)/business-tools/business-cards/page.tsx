// src/app/(dashboard)/business-tools/business-cards/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { BusinessCardGenerator } from "@/components/tools/business-card-generator";

export const metadata = { title: "Business Cards" };

export default async function BusinessCardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  return (
    <BusinessCardGenerator
      defaultName={session.user.name ?? ""}
      defaultBusinessName={profileRes.data.name}
      defaultPhone=""
    />
  );
}
