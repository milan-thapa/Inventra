"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const variants = {
      primary: "bg-brand-600 text-white shadow-md shadow-brand-500/20",
      secondary: "bg-white text-gray-900 border border-gray-200 shadow-sm",
      outline: "bg-transparent text-gray-700 border border-gray-200",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-50",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg font-bold",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Shine effect for primary */}
        {variant === "primary" && (
          <motion.div
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";
