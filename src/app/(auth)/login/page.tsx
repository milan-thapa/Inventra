// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Github,
  Mail,
  ChevronLeft,
  BarChart3,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { Suspense } from "react";

// ── Language options ──────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
];

// ── Google Icon ───────────────────────────────────────────
function GoogleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Noise texture SVG (inline, like Resend's grain background) ───
function NoiseBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 90%, rgba(255,255,255,0.03) 0%, transparent 60%)
        `,
      }}
    />
  );
}

function LoginContent() {
  const [lang, setLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description:
          error === "OAuthAccountNotLinked"
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
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Please try again.",
      });
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
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: "Please check your email and try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0a0a0a", color: "#ffffff" }}
    >
      <NoiseBackground />

      {/* Back to Home — top left */}
      <motion.a
        href="/"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-5 left-5 flex items-center gap-1.5 text-sm z-10"
        style={{ color: "rgba(255,255,255,0.45)" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")
        }
      >
        <ChevronLeft className="w-4 h-4" />
        Home
      </motion.a>

      {/* Language switcher — top right */}
      <div className="absolute top-5 right-5 z-10">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              color: "rgba(255,255,255,0.45)",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
          </button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50 w-36"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all"
                    style={{
                      color:
                        lang === l.code
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.5)",
                      backgroundColor:
                        lang === l.code
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (lang !== l.code)
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (lang !== l.code)
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                    }}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && (
                      <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {/* ── Email Sent State ── */}
          {emailSent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <CheckCircle2 className="w-6 h-6" style={{ color: "rgba(255,255,255,0.8)" }} />
              </motion.div>

              <h2 className="text-2xl font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>
                Check your email
              </h2>
              <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                We sent a magic link to
              </p>
              <p className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.85)" }}>
                {email}
              </p>
              <p className="text-xs mb-8" style={{ color: "rgba(255,255,255,0.3)" }}>
                Link expires in 15 minutes
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="text-sm transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")
                }
              >
                Try a different email
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl font-semibold mb-2"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {lang === "en"
                    ? `Log in to ${APP_NAME}`
                    : `${APP_NAME} मा लगइन गर्नुहोस्`}
                </h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {lang === "en" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <a
                        href="/register"
                        className="font-semibold transition-colors"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = "#fff")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color =
                            "rgba(255,255,255,0.85)")
                        }
                      >
                        Sign up
                      </a>
                      .
                    </>
                  ) : (
                    <>
                      खाता छैन?{" "}
                      <a
                        href="/register"
                        className="font-semibold"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        साइन अप
                      </a>
                      ।
                    </>
                  )}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {/* ── Email Mode ── */}
                {isEmailMode ? (
                  <motion.div
                    key="email-form"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    <form onSubmit={handleEmailSignIn} className="space-y-3">
                      <div>
                        <Label
                          htmlFor="email"
                          className="block text-sm mb-2 font-normal"
                          style={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {lang === "en" ? "Email" : "इमेल"}
                        </Label>
                        <input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full h-11 rounded-xl px-4 text-sm outline-none transition-all"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.9)",
                            caretColor: "#fff",
                          }}
                          onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "rgba(255,255,255,0.3)";
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              "rgba(255,255,255,0.07)";
                          }}
                          onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "rgba(255,255,255,0.1)";
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              "rgba(255,255,255,0.05)";
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!!loading || !email}
                        className="w-full h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                        style={{
                          backgroundColor:
                            !email || loading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
                          color: !email || loading ? "rgba(255,255,255,0.3)" : "#0a0a0a",
                          cursor: !email || loading ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (email && !loading)
                            (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          if (email && !loading)
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              "rgba(255,255,255,0.9)";
                        }}
                      >
                        {loading === "email" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {lang === "en" ? "Sending..." : "पठाउँदै..."}
                          </>
                        ) : (
                          <>
                            {lang === "en" ? "Log In" : "लगइन"}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        or
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                    </div>

                    {/* Back to OAuth */}
                    <button
                      type="button"
                      onClick={() => setIsEmailMode(false)}
                      className="w-full flex items-center justify-center gap-2 text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)")
                      }
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      {lang === "en" ? "Other sign in options" : "अन्य विकल्पहरू"}
                    </button>
                  </motion.div>
                ) : (
                  /* ── OAuth Mode ── */
                  <motion.div
                    key="oauth"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    {/* Google */}
                    <OAuthButton
                      onClick={() => handleOAuth("google")}
                      disabled={!!loading}
                      loading={loading === "google"}
                    >
                      {loading === "google" ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(255,255,255,0.6)" }} />
                      ) : (
                        <GoogleIcon className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
                      )}
                      <span>
                        {lang === "en" ? "Log in with Google" : "Google मार्फत लगइन"}
                      </span>
                    </OAuthButton>

                    {/* GitHub */}
                    <OAuthButton
                      onClick={() => handleOAuth("github")}
                      disabled={!!loading}
                      loading={loading === "github"}
                    >
                      {loading === "github" ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(255,255,255,0.6)" }} />
                      ) : (
                        <Github className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
                      )}
                      <span>
                        {lang === "en" ? "Log in with GitHub" : "GitHub मार्फत लगइन"}
                      </span>
                    </OAuthButton>

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        or
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                    </div>

                    {/* Email field (shown inline, like Resend) */}
                    <div>
                      <Label
                        htmlFor="email-inline"
                        className="block text-sm mb-2 font-normal"
                        style={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {lang === "en" ? "Email" : "इमेल"}
                      </Label>
                      <input
                        id="email-inline"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && email) {
                            setIsEmailMode(true);
                            // slight delay to let animation play, then submit
                            setTimeout(() => {
                              const form = document.getElementById("email-submit-btn");
                              form?.click();
                            }, 100);
                          }
                        }}
                        className="w-full h-11 rounded-xl px-4 text-sm outline-none transition-all"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.9)",
                          caretColor: "#fff",
                        }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,255,255,0.3)";
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "rgba(255,255,255,0.07)";
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,255,255,0.1)";
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "rgba(255,255,255,0.05)";
                        }}
                      />
                    </div>

                    <button
                      id="email-submit-btn"
                      onClick={() => {
                        if (email) setIsEmailMode(true);
                      }}
                      disabled={!email}
                      className="w-full h-11 rounded-xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: email
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.06)",
                        color: email ? "#0a0a0a" : "rgba(255,255,255,0.2)",
                        cursor: email ? "pointer" : "not-allowed",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onMouseEnter={(e) => {
                        if (email)
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        if (email)
                          (e.currentTarget as HTMLElement).style.backgroundColor =
                            "rgba(255,255,255,0.9)";
                      }}
                    >
                      {lang === "en" ? "Log In" : "लगइन"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <p
                className="text-center text-xs mt-8 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {lang === "en" ? "By signing in, you agree to our " : "साइन इन गरेर तपाईं हाम्रो "}
                <a
                  href="/terms"
                  className="transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  {lang === "en" ? "Terms" : "सर्तहरू"}
                </a>{" "}
                {lang === "en" ? "and " : "र "}
                <a
                  href="/privacy"
                  className="transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  {lang === "en" ? "Privacy Policy" : "गोपनीयता नीति"}
                </a>
                {lang === "en" ? "." : "मा सहमत हुनुहुन्छ।"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Reusable OAuth button ─────────────────────────────────
function OAuthButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all"
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.75)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.09)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.95)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
      }}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}