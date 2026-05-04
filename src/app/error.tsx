"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong!</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. We&apos;ve been notified and are working on it.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="w-full sm:w-auto"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
