"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProfileStore } from "@/stores/profile-store";
import { findItemByBarcode } from "@/lib/actions/inventory";
import { toast } from "sonner";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (item: any) => void;
}

export function BarcodeScanner({ open, onClose, onScanSuccess }: BarcodeScannerProps) {
  const { activeProfileId } = useProfileStore();
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [searching, setSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [open]);

  const startScanner = async () => {
    try {
      setScanning(true);
      // Initialize camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast.error("Failed to access camera. Please check permissions.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualSearch = async () => {
    if (!manualBarcode.trim() || !activeProfileId) return;
    setSearching(true);
    const res = await findItemByBarcode(activeProfileId, manualBarcode.trim());
    setSearching(false);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      onScanSuccess(res.data);
      setManualBarcode("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl p-0 overflow-hidden border border-border">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-base font-bold text-foreground">
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Camera className="w-12 h-12 text-white/50" />
              </div>
            )}
            {/* Scan Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500 animate-pulse" />
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Or enter barcode manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder="Enter barcode number"
                className="flex-1 h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                onClick={handleManualSearch}
                disabled={!manualBarcode.trim() || searching}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Point camera at barcode or enter barcode number manually
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
