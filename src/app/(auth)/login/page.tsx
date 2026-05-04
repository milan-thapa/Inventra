// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github, Mail, ChevronRight, BarChart3,
  Monitor, TrendingUp, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";

// ── Carousel slides data ──────────────────────────────────
const CAROUSEL_SLIDES = [
  {
    icon: BarChart3,
    title: "Insightful Business Reports",
    description: "Make better business decisions with your business performance report.",
    color: "from-brand-600/20 to-brand-900/40",
  },
  {
    icon: Monitor,
    title: "Multi-Device Management",
    description: "Manage your business accounting & inventory easily from your laptop & mobile.",
    color: "from-blue-600/20 to-blue-900/40",
  },
  {
    icon: TrendingUp,
    title: "Track Income & Expenses",
    description: "Keep a complete record of all money in and money out for your business.",
    color: "from-purple-600/20 to-purple-900/40",
  },
];

// ── Language options ──────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
];

import { Suspense } from "react";

function LoginContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lang, setLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error === "OAuthAccountNotLinked"
          ? "This email is already linked to another provider."
          : "Something went wrong. Please try again.",
      });
    }
  }, [error, toast]);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      toast({ variant: "destructive", title: "Sign in failed", description: "Please try again." });
      setLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.ok) {
        setEmailSent(true);
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to send email", description: "Please check your email and try again." });
    } finally {
      setLoading(null);
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;
  const slide = CAROUSEL_SLIDES[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a] relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-600 rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="w-full max-w-5xl bg-[#1e293b]/50 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex min-h-[620px] relative z-10">

        {/* ── LEFT: Login Form ─────────────────────────────── */}
        <div className="w-full md:w-5/12 p-8 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-xl tracking-tight">{APP_NAME}</span>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all border border-white/5"
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.code}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${showLangMenu ? "rotate-[-90deg]" : "rotate-90"}`} />
              </button>

              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 bg-[#252c3e] border border-[#353d52] rounded-lg overflow-hidden z-50 w-36"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#2e3650] hover:text-white transition-colors"
                    >
                      {lang === l.code && <span className="text-emerald-500">✓</span>}
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {emailSent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
                  <p className="text-gray-400 text-sm">
                    We sent a magic link to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-gray-500 text-xs mt-2">Link expires in 15 minutes</p>
                  <Button
                    variant="ghost"
                    className="mt-6 text-emerald-500 hover:text-emerald-400"
                    onClick={() => { setEmailSent(false); setEmail(""); }}
                  >
                    Try a different email
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
                  <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                    {lang === "en" 
                      ? "Log in to your Inventra account to manage your business." 
                      : "तपाईंको व्यवसाय व्यवस्थापन गर्न इन्भेन्ट्रा खातामा लगइन गर्नुहोस्।"}
                  </p>

                  {/* OAuth Buttons */}
                  {!isEmailMode && (
                    <div className="space-y-4">
                      <Button
                        onClick={() => handleOAuth("google")}
                        disabled={!!loading}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold h-12 gap-3 rounded-xl transition-all shadow-lg hover:shadow-white/5 active:scale-[0.98]"
                      >
                        {loading === "google" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        )}
                        Continue with Google
                      </Button>

                      <Button
                        onClick={() => handleOAuth("github")}
                        disabled={!!loading}
                        variant="outline"
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 gap-3 rounded-xl transition-all active:scale-[0.98]"
                      >
                        {loading === "github" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Github className="w-5 h-5" />
                        )}
                        Continue with GitHub
                      </Button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">or use email</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setIsEmailMode(true)}
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-bold h-12 gap-3 rounded-xl transition-all active:scale-[0.98]"
                      >
                        <Mail className="w-4 h-4 text-brand-500" />
                        Sign in with magic link
                      </Button>
                    </div>
                  )}

                  {/* Email Form */}
                  {isEmailMode && (
                    <motion.form
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={handleEmailSignIn}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="email" className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12 rounded-xl focus:border-brand-500 focus:ring-brand-500/20 transition-all"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={!!loading || !email}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white h-12 font-bold rounded-xl shadow-lg shadow-brand-600/20 active:scale-[0.98] transition-all"
                      >
                        {loading === "email" ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                        ) : (
                          "Send Magic Link"
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setIsEmailMode(false)}
                        className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors pt-2"
                      >
                        ← Back to other options
                      </button>
                    </motion.form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 text-center mt-6">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-brand-500 hover:text-brand-400">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-brand-500 hover:text-brand-400">Privacy Policy</a>
          </p>
        </div>

        {/* ── RIGHT: Carousel ───────────────────────────────── */}
        <div className={`hidden md:flex md:w-7/12 bg-gradient-to-br ${slide.color} flex-col items-center justify-center p-12 relative overflow-hidden`}>
          
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-3xl -ml-48 -mb-48" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="text-center relative z-10 w-full max-w-sm"
            >
              {/* Icon */}
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-2xl">
                <SlideIcon className="w-10 h-10 text-white" />
              </div>

              {/* Enhanced Dashboard mockup */}
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-4 mb-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform -rotate-2">
                <div className="flex gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-400/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400/50" />
                  <div className="w-2 h-2 rounded-full bg-green-400/50" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="h-10 rounded-lg bg-white/5" />
                  <div className="h-10 rounded-lg bg-white/5" />
                </div>
                <div className="h-20 rounded-lg bg-brand-500/10 border border-brand-500/10 mb-2 flex items-center justify-center">
                   <div className="w-1/2 h-2 bg-brand-500/20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 rounded-lg bg-white/5" />
                  ))}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{slide.title}</h3>
              <p className="text-white/60 text-base leading-relaxed">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="flex gap-2 mt-8 relative z-10">
            {CAROUSEL_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all ${
                  i === currentSlide
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
