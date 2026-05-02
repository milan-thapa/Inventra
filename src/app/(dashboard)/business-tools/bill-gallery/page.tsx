// src/app/(dashboard)/business-tools/bill-gallery/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getBillImages } from "@/lib/actions/gallery";
import { BillGalleryClient } from "./client";

export const metadata = { title: "Bill Gallery" };

export default async function BillGalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const imagesRes = await getBillImages(profileId);

  const images = (imagesRes.data ?? []).map((image) => ({
    ...image,
    name: image.fileName ?? "Untitled",
  }));

  return (
    <BillGalleryClient
      profileId={profileId}
      images={images}
    />
  );
}

