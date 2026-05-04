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
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 px-1">
            <span>Step {step} of 2</span>
            <span>{step === 1 ? "Profile Type" : "Business Info"}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: step === 1 ? "50%" : "100%" }}
              className="h-full bg-brand-600 shadow-[0_0_10px_rgba(22,163,74,0.4)]"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center justify-center gap-4 mb-10">
          <div className="w-14 h-14 bg-brand-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-brand-600/20 rotate-3">
            <BarChart3 className="w-8 h-8 text-white -rotate-3" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">Let&apos;s personalize your experience</h1>
            <p className="text-sm text-white/40">Tell us a bit about how you&apos;ll use {APP_NAME}</p>
          </div>
        </div>

        <div className="bg-[#1e293b]/50 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Choose profile type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Business Management */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileType("BUSINESS")}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                      profileType === "BUSINESS"
                        ? "border-brand-600 bg-brand-600/10 shadow-lg shadow-brand-600/10"
                        : "border-white/5 bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                      profileType === "BUSINESS" ? "bg-brand-600 text-white" : "bg-white/10 text-white/40 group-hover:text-white/60"
                    )}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-white text-base">Business Management</p>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">
                        Manage your business accounting, inventory, and sales in one place.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all flex items-center justify-center ${
                      profileType === "BUSINESS" ? "border-brand-600" : "border-white/20"
                    }`}>
                      {profileType === "BUSINESS" && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full" />}
                    </div>
                  </motion.button>

                  {/* Personal Finance */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfileType("PERSONAL")}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                      profileType === "PERSONAL"
                        ? "border-blue-600 bg-blue-600/10 shadow-lg shadow-blue-600/10"
                        : "border-white/5 bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                      profileType === "PERSONAL" ? "bg-blue-600 text-white" : "bg-white/10 text-white/40 group-hover:text-white/60"
                    )}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-white text-base">Personal Finance</p>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">
                        Track your daily expenses, maintain credits, and manage your budget.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-all flex items-center justify-center ${
                      profileType === "PERSONAL" ? "border-blue-600" : "border-white/20"
                    }`}>
                      {profileType === "PERSONAL" && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                    </div>
                  </motion.button>
                </div>

                <Button
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all gap-2"
                  onClick={handleContinue}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{profileType === "PERSONAL" ? "Create Personal Profile" : "Continue"}</span>
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <div className="space-y-5">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                      Business Name <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                      <Input
                        placeholder="e.g. Acme Corporation"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="h-12 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-brand-500 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Business Category */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">Business Category</Label>
                    <div className="relative group">
                      <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-500 transition-colors pointer-events-none z-10" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm appearance-none focus:border-brand-500 focus:ring-brand-500/20 outline-none transition-all"
                      >
                        <option value="" className="bg-[#1e293b]">Select Category</option>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value} className="bg-[#1e293b]">
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-xl font-bold"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-2 sm:flex-[2] h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all"
                    onClick={handleCreate}
                    disabled={loading || !businessName}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirm & Start
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
