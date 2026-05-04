// src/components/parties/party-detail.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Printer, Bell, ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate, getInitials, getAvatarColor } from "@/lib/utils";
import { deleteParty } from "@/lib/actions/party";
import { useRouter } from "next/navigation";
import { EditPartyModal } from "@/components/parties/edit-party-modal";

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

export function PartyDetail({
  party,
  profileId,
  onPaymentIn = () => { },
  onPaymentOut = () => { },
  onPartyDeleted,
  onPartyUpdated,
}: {
  party: Party;
  profileId: string;
  onPaymentIn?: () => void;
  onPaymentOut?: () => void;
  onPartyDeleted?: (partyId: string) => void;
  onPartyUpdated?: (party: Party) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const balance = Number(party.openingBalance);
  const isReceivable = party.balanceType === "TO_RECEIVE";

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!confirm(`Delete ${party.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setMenuOpen(false);
    const res = await deleteParty(profileId, party.id);
    if (res.error) {
      alert(res.error);
      setDeleting(false);
    } else {
      onPartyDeleted?.(party.id);
    }
  };

  const handlePrintStatement = () => {
    const url = `/reports/party-statement?partyId=${party.id}&partyName=${encodeURIComponent(party.name)}&partyAddress=${encodeURIComponent(party.address ?? "")}&partyPhone=${encodeURIComponent(party.phone ?? "")}`;
    window.open(url, "_blank");
  };

  const getTxTypeLabel = (type: string, no: number) => {
    switch (type) {
      case "OPENING_BALANCE": return "Opening Balance";
      case "PAYMENT_IN": return `Payment In #${no}`;
      case "PAYMENT_OUT": return `Payment Out #${no}`;
      default: return type;
    }
  };

  return (
    <>
      <div className="h-full bg-card rounded-xl border border-border/50 flex flex-col overflow-hidden">
        {/* Party header */}
        <div className="flex items-start justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white border border-border/10 shadow-sm"
              style={{ backgroundColor: getAvatarColor(party.name) }}
            >
              {getInitials(party.name)}
            </div>
            <div>
              <h2 className="font-bold text-foreground">{party.name}</h2>
              {party.address && (
                <p className="text-xs text-muted-foreground">{party.address}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {/* Manage Party dropdown */}
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs border-border/50"
                    onClick={() => setMenuOpen((o) => !o)}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Manage Party"}
                  </Button>

                  {menuOpen && (
                    <div className="absolute left-0 top-7 z-50 w-44 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
                      <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-medium uppercase tracking-wide">
                        Manage Party
                      </p>
                      <button
                        onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-foreground"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Party
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-rose-500/10 transition-colors text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Party
                      </button>
                    </div>
                  )}
                </div>

                {/* Print statement */}
                <button
                  onClick={handlePrintStatement}
                  className="p-1 rounded hover:bg-accent transition-colors"
                  title="Print Statement"
                >
                  <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">
              {isReceivable ? "Receivable" : "Payable"}
            </p>
            <p className={cn(
              "text-xl font-bold",
              isReceivable ? "text-emerald-400" : "text-rose-400"
            )}>
              {formatCurrency(balance)}
            </p>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 ml-auto transition-colors">
              <Bell className="w-3 h-3" />
              Send Reminder
            </button>
          </div>
        </div>

        {/* Transactions section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">
              Transactions ({party.partyTransactions.length})
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <Button
                size="sm"
                onClick={onPaymentIn}
                className="h-7 px-2.5 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ArrowDownLeft className="w-3 h-3" /> Payment In
              </Button>
              <Button
                size="sm"
                onClick={onPaymentOut}
                className="h-7 px-2.5 text-xs gap-1 bg-rose-500 hover:bg-rose-600 text-white"
              >
                <ArrowUpRight className="w-3 h-3" /> Payment Out
              </Button>
            </div>
          </div>

          {/* Transactions table */}
          <div className="flex-1 overflow-y-auto">
            {party.partyTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No transactions yet
              </div>
            ) : (
              <table className="data-table w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border/50">
                    <th className="text-left">Type</th>
                    <th className="text-left">Date</th>
                    <th className="text-right">Total</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Balance</th>
                    <th className="text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {party.partyTransactions.map((tx) => {
                    const amount = Number(tx.amount);
                    const isIn = tx.type === "PAYMENT_IN" || tx.type === "OPENING_BALANCE";
                    return (
                      <tr key={tx.id}>
                        <td className="text-xs">
                          <span className={cn(
                            "font-medium",
                            isIn ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {getTxTypeLabel(tx.type, tx.receiptNumber)}
                          </span>
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {formatDate(new Date(tx.date))}
                        </td>
                        <td className={cn("text-right text-xs font-medium", isIn ? "text-emerald-400" : "text-rose-400")}>
                          {formatCurrency(amount)}
                        </td>
                        <td className="text-center text-xs text-muted-foreground">—</td>
                        <td className={cn("text-right text-xs font-semibold", isReceivable ? "text-emerald-400" : "text-rose-400")}>
                          {formatCurrency(balance)}
                        </td>
                        <td className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {tx.remarks ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <EditPartyModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          party={party}
          profileId={profileId}
          onSuccess={(updated) => {
            setEditOpen(false);
            onPartyUpdated?.(updated);
          }}
        />
      )}
    </>
  );
}