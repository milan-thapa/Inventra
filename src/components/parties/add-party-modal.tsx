// src/components/parties/add-party-modal.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createParty } from "@/lib/actions/party";
import { createPartySchema, type CreatePartyInput } from "@/lib/validations/party";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";
import { OurFileRouter } from "@/app/api/uploadthing/core";

type Tab = "credit" | "additional";

export function AddPartyModal({
  open,
  onClose,
  profileId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  profileId: string;
  onSuccess?: (party: unknown) => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("additional");
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CreatePartyInput>({
      resolver: zodResolver(createPartySchema),
      defaultValues: {
        balanceType: "TO_RECEIVE",
        openingBalance: 0,
        openingDate: new Date(),
      },
    });

  const balanceType = watch("balanceType");

  const onSubmit = async (data: CreatePartyInput) => {
    setLoading(true);
    const res = await createParty(profileId, data);
    setLoading(false);

    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Party saved successfully" });
      onSuccess?.(res.data);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground">Add New Party</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-5">
                {/* Photo + Name + Phone row */}
                <div className="flex items-start gap-4 mb-5">
                  {/* Photo upload */}
                  <div className="w-16 h-16 rounded-full bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-emerald-500 transition-colors flex-shrink-0 relative">
                    {photoUrl ? (
                                        <Image
                    src={photoUrl}
                    alt="Party photo"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                    ) : (
                      <UploadButton
                        endpoint="partyPhoto"
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            const url = res[0].url;
                            setPhotoUrl(url);
                            setValue("photo", url);
                            toast({ title: "Photo uploaded" });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast({ variant: "destructive", title: "Upload Error", description: error.message });
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    )}
                    {!photoUrl && (
                      <>
                        <User className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-0.5">Upload</span>
                      </>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        Full Name <span className="text-rose-400">*</span>
                      </Label>
                      <Input placeholder="Enter the name of party"
                        {...register("name")}
                        className="h-9 text-sm bg-muted/50 border-border/50" />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</Label>
                      <Input placeholder="Enter party phone no"
                        {...register("phone")}
                        className="h-9 text-sm bg-muted/50 border-border/50" />
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border mb-4">
                  {(["credit", "additional"] as Tab[]).map((t) => (
                    <button key={t} type="button"
                      onClick={() => setTab(t)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                        tab === t
                          ? "border-emerald-500 text-emerald-500"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}>
                      {t === "credit" ? "Credit Info" : "Additional Info"}
                    </button>
                  ))}
                </div>

                {/* Credit Info Tab */}
                {tab === "credit" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Opening Balance</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs.</span>
                          <Input type="number" placeholder="eg. 0"
                            {...register("openingBalance", { valueAsNumber: true })}
                            className="h-9 text-sm bg-muted/50 border-border/50 pl-10" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">As of Date</Label>
                        <Input type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                          {...register("openingDate", { valueAsDate: true })}
                          className="h-9 text-sm bg-muted/50 border-border/50" />
                      </div>
                    </div>
                    {/* Balance type toggle */}
                    <div className="flex gap-2">
                      <button type="button"
                        onClick={() => setValue("balanceType", "TO_RECEIVE")}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
                          balanceType === "TO_RECEIVE"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                            : "border-border/50 text-muted-foreground hover:border-emerald-500/50")}>
                        To Receive
                      </button>
                      <button type="button"
                        onClick={() => setValue("balanceType", "TO_GIVE")}
                        className={cn("px-4 py-1.5 rounded-lg text-sm font-medium border-2 transition-all",
                          balanceType === "TO_GIVE"
                            ? "border-rose-500 bg-rose-500/10 text-rose-500"
                            : "border-border/50 text-muted-foreground hover:border-rose-500/50")}>
                        To Give
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Info Tab */}
                {tab === "additional" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                        <Input placeholder="Enter party's address"
                          {...register("address")}
                          className="h-9 text-sm bg-muted/50 border-border/50" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                        <Input type="email" placeholder="Enter party's email"
                          {...register("email")}
                          className="h-9 text-sm bg-muted/50 border-border/50" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">PAN Number</Label>
                      <Input placeholder="Enter number"
                        {...register("panNumber")}
                        className="h-9 text-sm bg-muted/50 border-border/50" />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end mt-5">
                  <Button type="submit" disabled={loading}
                    className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Save Party
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
