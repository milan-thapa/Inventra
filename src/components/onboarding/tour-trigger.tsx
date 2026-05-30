// src/components/onboarding/tour-trigger.tsx
"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { InteractiveTour, DASHBOARD_TOUR_STEPS } from "./interactive-tour";

export function TourTrigger() {
  const [showTour, setShowTour] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const handleStartTour = () => {
    setShowBanner(false);
    setShowTour(true);
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <>
      {/* Tour Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-3 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">New to Inventra? Take a quick tour to get started!</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-emerald-600 hover:bg-white/90"
                onClick={handleStartTour}
              >
                Start Tour
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleCloseBanner}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Tour */}
      <InteractiveTour
        steps={DASHBOARD_TOUR_STEPS}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => {
          setShowTour(false);
          // Mark tour as completed in localStorage
          localStorage.setItem("inventra-tour-completed", "true");
        }}
      />
    </>
  );
}
