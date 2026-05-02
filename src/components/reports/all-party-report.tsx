// src/components/reports/all-party-report.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";

interface Party {
  id: string;
  name: string;
  phone: string | null;
  openingBalance: number | string;
  balanceType: string;
}

export function AllPartyReportView({
  parties,
  totalReceivable,
  totalPayable,
  profileId: _,
}: {
  parties: Party[];
  totalReceivable: number;
  totalPayable: number;
  profileId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = parties.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone ?? "").includes(search);
    const matchFilter = filter === "ALL" || p.balanceType === filter;
    return matchSearch && matchFilter;
  });

  const handlePrint = () => window.print();

  const handleDownloadExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const data = filtered.map((p) => ({
      "Party Name": p.name,
      "Contact": p.phone ?? "—",
      "Receivable": p.balanceType === "TO_RECEIVE" ? Number(p.openingBalance) : 0,
      "Payable": p.balanceType === "TO_GIVE" ? Number(p.openingBalance) : 0,
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "All Party Report");
    writeFile(wb, "all-party-report.xlsx");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">All Party Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/50"
            onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDownloadExcel}>
            <Download className="w-3.5 h-3.5" /> Download Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
        <div className="relative flex-1 min-w-40 max-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/30 border-border/50" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
          <option value="ALL">All Party</option>
          <option value="TO_RECEIVE">To Receive</option>
          <option value="TO_GIVE">To Give</option>
          <option value="SETTLED">Settled</option>
        </select>
        <select className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
          <option>All Due Types</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Receivables</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalReceivable)}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Payables</p>
          <p className="text-xl font-bold text-rose-400">{formatCurrency(totalPayable)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left">Party Name</th>
                <th className="text-left">Contact</th>
                <th className="text-right">Receivable</th>
                <th className="text-right">Payable</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                    No parties found
                  </td>
                </tr>
              ) : (
                filtered.map((party) => (
                  <tr key={party.id}>
                    <td className="font-medium text-foreground">{party.name}</td>
                    <td className="text-muted-foreground">{party.phone ?? "—"}</td>
                    <td className="text-right">
                      {party.balanceType === "TO_RECEIVE"
                        ? <span className="text-emerald-400 font-semibold">{formatCurrency(Number(party.openingBalance))}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="text-right">
                      {party.balanceType === "TO_GIVE"
                        ? <span className="text-rose-400 font-semibold">{formatCurrency(Number(party.openingBalance))}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
