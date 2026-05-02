// src/app/(onboarding)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, ChevronRight, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProfile } from "@/lib/actions/profile";
import { BUSINESS_CATEGORIES, APP_NAME } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

type ProfileType = "BUSINESS" | "PERSONAL";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [profileType, setProfileType] = useState<ProfileType>("BUSINESS");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (profileType === "PERSONAL") {
      handleCreate();
    } else {
      setStep(2);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const name = profileType === "PERSONAL" ? "Personal Finance" : businessName;
      if (!name) {
        toast({ variant: "destructive", title: "Please enter a business name" });
        setLoading(false);
        return;
      }

      const res = await createProfile({
        type: profileType,
        name,
        category: category || undefined,
      });

      if (res.error) {
        toast({ variant: "destructive", title: res.error });
      } else {
        toast({ title: "Profile created!", description: `Welcome to ${APP_NAME}` });
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">{APP_NAME}</span>
        </div>

        <div className="bg-[#1a1f2e] rounded-2xl border border-[#2a3142] p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose profile type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-lg font-bold text-white mb-1">Create New Profile</h2>
                <p className="text-sm text-gray-400 mb-5">Select profile which you want to create</p>

                <div className="space-y-3">
                  {/* Business Management */}
                  <button
                    onClick={() => setProfileType("BUSINESS")}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                      profileType === "BUSINESS"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[#2a3142] hover:border-[#3a4152]"
                    }`}
                  >
                    <div className="w-10 h-10 bg-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">Business Management</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Manage your business accounting and inventory easily
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                      profileType === "BUSINESS"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-gray-600"
                    }`} />
                  </button>

                  {/* Personal Finance */}
                  <button
                    onClick={() => setProfileType("PERSONAL")}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                      profileType === "PERSONAL"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-[#2a3142] hover:border-[#3a4152]"
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">Personal Finance</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Track your expenses and maintain your credits with friends
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                      profileType === "PERSONAL"
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-gray-600"
                    }`} />
                  </button>
                </div>

                <Button
                  className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-semibold"
                  onClick={handleContinue}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {profileType === "PERSONAL" ? "Create Personal Profile" : "Continue"}
                  {profileType === "BUSINESS" && !loading && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-lg font-bold text-white mb-1">Add Your Business Details</h2>
                <p className="text-sm text-gray-400 mb-5">Let&apos;s fill up your business information</p>

                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <Label className="text-gray-300 text-sm mb-1.5 block">
                      Business Name <span className="text-rose-400">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-9 bg-[#252c3e] border-[#353d52] text-white placeholder:text-gray-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Business Category */}
                  <div>
                    <Label className="text-gray-300 text-sm mb-1.5 block">Business Category</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#252c3e] border border-[#353d52] text-white rounded-md text-sm appearance-none focus:border-emerald-500 outline-none"
                      >
                        <option value="">Select Category</option>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#353d52] text-gray-300 hover:bg-[#252c3e] h-11"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-semibold"
                    onClick={handleCreate}
                    disabled={loading || !businessName}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add New Business
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
