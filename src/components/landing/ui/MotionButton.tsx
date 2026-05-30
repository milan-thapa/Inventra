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
      primary: "bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30",
      secondary: "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md",
      outline: "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
          y: -2,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:outline-none",
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
