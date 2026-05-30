// src/app/(dashboard)/get-started/page.tsx
"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, X, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const STEPS = [
  {
    id: 1,
    title: "Welcome to Inventra",
    description: "Your complete business management solution. Let's get you started with the basics.",
    image: "/assets/all/get_started_1.jpg",
  },
  {
    id: 2,
    title: "Create Your Profile",
    description: "Set up your business or personal profile to start tracking your finances.",
    image: "/assets/all/get_started_2.jpg",
  },
  {
    id: 3,
    title: "Add Parties",
    description: "Manage your customers and suppliers. Track who owes you and who you owe.",
    image: "/assets/all/get_started_3.jpg",
  },
  {
    id: 4,
    title: "Record Transactions",
    description: "Easily add sales, purchases, expenses, and income entries.",
    image: "/assets/all/get_started_4.jpg",
  },
  {
    id: 5,
    title: "Manage Inventory",
    description: "Keep track of your products, stock levels, and item details.",
    image: "/assets/all/get_started_5.jpg",
  },
  {
    id: 6,
    title: "View Reports",
    description: "Generate detailed reports to understand your business performance.",
    image: "/assets/all/get_started_6.jpg",
  },
  {
    id: 7,
    title: "Set Reminders",
    description: "Never miss a payment or important task with smart reminders.",
    image: "/assets/all/get_started_7.jpg",
  },
  {
    id: 8,
    title: "Use Business Tools",
    description: "Access handy tools like business cards, greeting cards, and notebook.",
    image: "/assets/all/get_started_8.jpg",
  },
];



export default function GetStartedPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCompleted([...completed, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Get Started Guide</h1>
          <Button variant="ghost" size="icon" asChild>
            <a href="/dashboard">
              <X className="w-5 h-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goToStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                index === currentStep
                  ? "bg-emerald-600 text-white"
                  : completed.includes(index)
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {completed.includes(index) && index !== currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative aspect-video md:aspect-auto bg-muted/50 flex items-center justify-center p-8">
              <div className="relative w-full max-w-lg">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-background border border-border/50 shadow-lg">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-medium mb-4">
                  <span>Step {currentStep + 1} of {STEPS.length}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">{step.title}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-auto">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={nextStep} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <a href="/dashboard">
                      <Play className="w-4 h-4 mr-2" />
                      Start Using Inventra
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-3">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Watch Tutorials</h3>
            <p className="text-sm text-muted-foreground">
              Check out our video tutorials for detailed walkthroughs of each feature.
            </p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Complete Setup</h3>
            <p className="text-sm text-muted-foreground">
              Finish your profile setup to unlock all features and personalize your experience.
            </p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-3">
              <ChevronRight className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Explore Features</h3>
            <p className="text-sm text-muted-foreground">
              Take time to explore all the features available in the sidebar menu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
