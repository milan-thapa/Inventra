// src/components/parties/parties-view.tsx
"use client";

import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartyCard } from "@/components/parties/party-card";
import { PartyDetail } from "@/components/parties/party-detail";
import { AddPartyModal } from "@/components/parties/add-party-modal";
import { AddPaymentInModal } from "@/components/parties/add-payment-in-modal";
import { AddPaymentOutModal } from "@/components/parties/add-payment-out-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { PARTIES_TOUR_STEPS } from "@/components/onboarding/interactive-tour";

type BalanceFilter = "ALL" | "TO_RECEIVE" | "TO_GIVE" | "SETTLED";

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

const FILTERS: { value: BalanceFilter; label: string }[] = [
  { value: "ALL", label: "All Payment" },
  { value: "TO_RECEIVE", label: "To Receive" },
  { value: "TO_GIVE", label: "To Give" },
  { value: "SETTLED", label: "Settled" },
];

export function PartiesView({
  initialParties,
  profileId,
}: {
  initialParties: Party[];
  profileId: string;
}) {
  const [parties, setParties] = useState(initialParties);
  const [selectedPartyId, setSelected] = useState<string | null>(
    initialParties[0]?.id ?? null
  );
  const [filter, setFilter] = useState<BalanceFilter>("ALL");
  const [search, setSearch] = useState("");
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [payInOpen, setPayInOpen] = useState(false);
  const [payOutOpen, setPayOutOpen] = useState(false);

  const filtered = parties.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? "").includes(search) ||
      (p.address ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || p.balanceType === filter;
    return matchSearch && matchFilter;
  });

  const selectedParty = parties.find((p) => p.id === selectedPartyId) ?? null;

  const handlePartyCreated = (newParty: Party) => {
    setParties((prev) => [newParty, ...prev]);
    setSelected(newParty.id);
    setAddPartyOpen(false);
  };

  const handlePartyDeleted = (partyId: string) => {
    setParties((prev) => prev.filter((p) => p.id !== partyId));
    setSelected((prev) => {
      if (prev !== partyId) return prev;
      const remaining = parties.filter((p) => p.id !== partyId);
      return remaining[0]?.id ?? null;
    });
  };

  const handlePartyUpdated = (updated: Party) => {
    setParties((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  };

  const handlePaymentAdded = () => {
    window.location.reload();
  };

  return (
    <>
      <TourTrigger 
        tourKey="inventra-parties-tour-completed" 
        steps={PARTIES_TOUR_STEPS} 
        title="Learn how to manage your Parties (Customers & Suppliers)!" 
      />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4">
        {/* ── LEFT: Parties List ─────────────────────────────── */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border/50 overflow-hidden lg:h-full h-auto max-h-[50vh] lg:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h2 className="font-semibold text-sm text-foreground">
            Parties ({filtered.length})
          </h2>
          <Button
            size="sm"
            onClick={() => setAddPartyOpen(true)}
            variant="income"
            className="h-7 px-2 text-xs gap-1"
            data-tour="add-party"
          >
            <Plus className="w-3 h-3" /> Add Party
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search parties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-7 text-xs bg-muted/30 border-border/50"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="px-3 py-2 border-b border-border/50" data-tour="party-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BalanceFilter)}
            className="h-7 w-full px-2.5 bg-muted/30 border border-border/50 rounded-md text-xs text-foreground appearance-none focus:border-emerald-500 outline-none"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Party list */}
        <div className="flex-1 overflow-y-auto" data-tour="party-list">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Users className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                {parties.length === 0 ? "Let's add your First Party" : "No parties found"}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {parties.length === 0
                  ? "Click on the add new party button and manage receivables & payables with them."
                  : "Try adjusting your search or filter"}
              </p>
              {parties.length === 0 && (
                <Button
                  size="sm"
                  onClick={() => setAddPartyOpen(true)}
                  variant="income"
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add New Party
                </Button>
              )}
            </div>
          ) : (
            filtered.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                isSelected={selectedPartyId === party.id}
                onClick={() => setSelected(party.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Party Detail ───────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {selectedParty ? (
          <PartyDetail
            party={selectedParty}
            profileId={profileId}
            onPaymentIn={() => setPayInOpen(true)}
            onPaymentOut={() => setPayOutOpen(true)}
            onPartyDeleted={handlePartyDeleted}
            onPartyUpdated={handlePartyUpdated}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-card rounded-xl border border-border/50">
            <EmptyState
              icon={Users}
              title="Select a party"
              description="Click on a party from the list to view their transactions"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPartyModal
        open={addPartyOpen}
        onClose={() => setAddPartyOpen(false)}
        profileId={profileId}
        onSuccess={handlePartyCreated}
      />

      {selectedParty && (
        <>
          <AddPaymentInModal
            open={payInOpen}
            onClose={() => setPayInOpen(false)}
            profileId={profileId}
            defaultPartyId={selectedParty.id}
            defaultPartyName={selectedParty.name}
            defaultBalance={Number(selectedParty.openingBalance)}
            onSuccess={handlePaymentAdded}
          />
          <AddPaymentOutModal
            open={payOutOpen}
            onClose={() => setPayOutOpen(false)}
            profileId={profileId}
            defaultPartyId={selectedParty.id}
            defaultPartyName={selectedParty.name}
            onSuccess={handlePaymentAdded}
          />
        </>
      )}
    </div>
    </>
  );
}