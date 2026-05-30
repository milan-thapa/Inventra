"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventorySettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/feature-settings/inventory");
  }, [router]);

  return null;
}
