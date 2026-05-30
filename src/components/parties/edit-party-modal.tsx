// src/components/parties/edit-party-modal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateParty } from "@/lib/actions/party";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

type Tab = "credit" | "additional";

interface Transaction {
    id: string;
    type: string;
    amount: number | string;
    date: Date | string;
    remarks: string | null;
    receiptNumber: number;
    paymentMethod: string;
}

interface Party {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    openingBalance: number | string;
    balanceType: string;
    partyTransactions: Transaction[];
}

export function EditPartyModal({
    open,
    onClose,
    party,
    profileId,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    party: Party;
    profileId: string;
    onSuccess: (updated: Party) => void;
}) {
    const { toast } = useToast();
    const [tab, setTab] = useState<Tab>("additional");
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(party.name);
    const [phone, setPhone] = useState(party.phone ?? "");
    const [address, setAddress] = useState(party.address ?? "");
    const [email, setEmail] = useState("");
    const [panNumber, setPanNumber] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [balanceType, setBalanceType] = useState<"TO_RECEIVE" | "TO_GIVE">(
        party.balanceType === "TO_GIVE" ? "TO_GIVE" : "TO_RECEIVE"
    );
    const [error, setError] = useState("");

    if (!open) return null;

    const handleSubmit = async () => {
        if (!name.trim()) { setError("Name is required"); return; }
        setLoading(true);
        setError("");

        const res = await updateParty(profileId, party.id, {
            name: name.trim(),
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            email: email.trim() || undefined,
            panNumber: panNumber.trim() || undefined,
            photo: photoUrl || undefined,
        });

        setLoading(false);

        if (res.error) {
            setError(res.error);
            toast({ variant: "destructive", title: "Error", description: res.error });
        } else {
            toast({ title: "Party updated successfully" });
            onSuccess({
                ...party,
                name: name.trim(),
                phone: phone.trim() || null,
                address: address.trim() || null,
                balanceType,
            });
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

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
                                <h2 className="font-bold text-foreground">Edit Party</h2>
                                <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="p-5">
                                {/* Photo + Name + Phone row */}
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center hover:border-emerald-500 transition-colors flex-shrink-0 relative overflow-hidden">
                                        {photoUrl ? (
                                            <Image
                                                src={photoUrl}
                                                alt="Party photo"
                                                width={80}
                                                height={80}
                                                className="rounded-full object-cover w-full h-full"
                                            />
                                        ) : (
                                            <>
                                                <User className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground mt-0.5">Upload</span>
                                                <UploadButton
                                                    endpoint="partyPhoto"
                                                    onClientUploadComplete={(res) => {
                                                        if (res && res.length > 0) {
                                                            setPhotoUrl(res[0].url);
                                                            toast({ title: "Photo uploaded" });
                                                        }
                                                    }}
                                                    onUploadError={(error: Error) => {
                                                        toast({ variant: "destructive", title: "Upload Error", description: error.message });
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1.5 block">
                                                Full Name <span className="text-rose-400">*</span>
                                            </Label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter the name of party"
                                                className="h-9 text-sm bg-muted/50 border-border/50"
                                            />
                                            {error && !name.trim() && (
                                                <p className="text-xs text-destructive mt-1">Name is required</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</Label>
                                            <Input
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Enter party phone no"
                                                className="h-9 text-sm bg-muted/50 border-border/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-border mb-4">
                                    {(["credit", "additional"] as Tab[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTab(t)}
                                            className={cn(
                                                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                                                tab === t
                                                    ? "border-muted-foreground text-foreground"
                                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
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
                                                    <Input
                                                        type="number"
                                                        defaultValue={Number(party.openingBalance)}
                                                        className="h-9 text-sm bg-muted/30 border-border/30 pl-10 opacity-60 cursor-not-allowed"
                                                        disabled
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Opening balance is locked after creation
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1.5 block">Balance Type</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBalanceType("TO_RECEIVE")}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all",
                                                            balanceType === "TO_RECEIVE"
                                                                ? "border-muted-foreground bg-muted text-foreground"
                                                                : "border-border/50 text-muted-foreground hover:border-muted-foreground"
                                                        )}
                                                    >
                                                        To Receive
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBalanceType("TO_GIVE")}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all",
                                                            balanceType === "TO_GIVE"
                                                                ? "border-rose-500 bg-rose-500/10 text-rose-500"
                                                                : "border-border/50 text-muted-foreground hover:border-rose-500/50"
                                                        )}
                                                    >
                                                        To Give
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional Info Tab */}
                                {tab === "additional" && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                                                <Input
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Enter party's address"
                                                    className="h-9 text-sm bg-muted/50 border-border/50"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="Enter party's email"
                                                    className="h-9 text-sm bg-muted/50 border-border/50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1.5 block">PAN Number</Label>
                                            <Input
                                                value={panNumber}
                                                onChange={(e) => setPanNumber(e.target.value)}
                                                placeholder="Enter number"
                                                className="h-9 text-sm bg-muted/50 border-border/50"
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-xs text-rose-500 mt-3">{error}</p>
                                )}

                                {/* Footer */}
                                <div className="flex justify-end mt-5">
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                    >
                                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}