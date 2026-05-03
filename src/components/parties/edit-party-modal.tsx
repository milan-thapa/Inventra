// src/components/parties/edit-party-modal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateParty } from "@/lib/actions/party";

interface Party {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    openingBalance: number | string;
    balanceType: string;
    partyTransactions: Array<{
        id: string;
        type: string;
        amount: number | string;
        date: Date | string;
        remarks: string | null;
        receiptNumber: number;
        paymentMethod: string;
    }>;
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
    onSuccess: (updated: {
        id: string;
        name: string;
        phone: string | null;
        address: string | null;
        openingBalance: number | string;
        balanceType: string;
        partyTransactions: Array<{
            id: string;
            type: string;
            amount: number | string;
            date: Date | string;
            remarks: string | null;
            receiptNumber: number;
            paymentMethod: string;
        }>;
    }) => void;
}) {
    const [name, setName] = useState(party.name);
    const [phone, setPhone] = useState(party.phone ?? "");
    const [address, setAddress] = useState(party.address ?? "");
    const [loading, setLoading] = useState(false);
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
        });

        setLoading(false);

        if (res.error) {
            setError(res.error);
        } else {
            onSuccess({
                ...party,
                name: name.trim(),
                phone: phone.trim() || null,
                address: address.trim() || null,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-popover border border-border rounded-xl shadow-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-foreground">Edit Party</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Party name"
                            className="h-9 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone number"
                            className="h-9 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Address"
                            className="h-9 text-sm"
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-xs text-rose-500 mt-3">{error}</p>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}