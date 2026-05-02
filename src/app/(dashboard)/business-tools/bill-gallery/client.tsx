// src/app/(dashboard)/business-tools/bill-gallery/client.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { EmptyState } from "@/components/shared/empty-state";
import { Loader2, Upload, ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createBillImage } from "@/lib/actions/gallery";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import type { BillImage } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OurFileRouter } from "@/app/api/uploadthing/core";

export function BillGalleryClient({
  images,
  profileId,
}: {
  images: {
    id: string;
    name: string;
    url: string;
    createdAt: Date;
  }[];
  profileId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { startUpload } = useUploadThing("billImage", {
    onClientUploadComplete: async (res) => {
      if (!res) return;
      await createBillImage(profileId, res[0].name, res[0].url);
      setUploading(false);
      toast({ title: "Success", description: "Bill image uploaded" });
      router.refresh();
    },
    onUploadError: (err) => {
      setUploading(false);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
    onUploadBegin: () => {
      setUploading(true);
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Bill Gallery</h1>
        <Button asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Upload Bill
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) {
                  startUpload(Array.from(e.target.files));
                }
              }}
            />
          </label>
        </Button>
      </div>

      {uploading && (
        <div className="flex items-center justify-center w-full h-64 border-2 border-dashed rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      )}

      {!uploading && images.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="No bill images found"
          description="Upload your first bill image to get started."
        />
      )}

      {!uploading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-w-1 aspect-h-1">
                <Image
                  src={image.url}
                  alt={image.name}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    // await deleteBillImage(image.id);
                    toast({ title: "Success", description: "Bill image deleted" });
                    router.refresh();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-xs font-medium text-white truncate">{image.name}</p>
                <p className="text-xs text-white/70">
                  {format(new Date(image.createdAt), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
