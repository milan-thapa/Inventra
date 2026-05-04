// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";

export default async function RootPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
