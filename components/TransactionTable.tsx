"use client";

import { useState, useMemo } from "react";
import { Transaction } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getAllCategoryNames, getCategoryByName } from "@/lib/categories";
import { extractMerchantName } from "@/lib/categorization";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X, Filter, CheckSquare } from "lucide-react";

type SortField = "date" | "description" | "category" | "amount";
type SortDir = "asc" | "desc";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const { updateTransaction, addMerchantRule, merchantRules } = useStore();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const allCategories = getAllCategoryNames();

  const sorted = useMemo(() => {
    let filtered = transactions;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) =>
        categoryFilter === "uncategorized"
          ? !t.category || t.category === "Uncategorized"
          : t.category === categoryFilter
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => t.date <= dateTo);
    }
    if (amountMin !== "") {
      const min = parseFloat(amountMin);
      if (!isNaN(min)) filtered = filtered.filter((t) => Math.abs(t.amount) >= min);
    }
    if (amountMax !== "") {
      const max = parseFloat(amountMax);
      if (!isNaN(max)) filtered = filtered.filter((t) => Math.abs(t.amount) <= max);
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "description":
          cmp = a.description.localeCompare(b.description);
          break;
        case "category":
          cmp = (a.category || "").localeCompare(b.category || "");
          break;
        case "amount":
          cmp = Math.abs(a.amount) - Math.abs(b.amount);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, search, categoryFilter, sortField, sortDir, dateFrom, dateTo, amountMin, amountMax]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleCategoryChange = (transaction: Transaction, category: string) => {
    updateTransaction(transaction.id, { category, needsReview: false, confidence: 1.0 });
    const merchantName = extractMerchantName(transaction.description);
    const alreadyKnown = merchantRules.some(
      (r) => r.merchantName.toLowerCase() === merchantName.toLowerCase()
    );
    if (!alreadyKnown) {
      addMerchantRule({ merchantName, category, timestamp: Date.now() });
    }
    setEditingId(null);
  };

  const handleBulkApply = () => {
    if (!bulkCategory || selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const txn = transactions.find((t) => t.id === id);
      if (!txn) return;
      updateTransaction(id, { category: bulkCategory, needsReview: false, confidence: 1.0 });
      const merchantName = extractMerchantName(txn.description);
      const alreadyKnown = merchantRules.some(
        (r) => r.merchantName.toLowerCase() === merchantName.toLowerCase()
      );
      if (!alreadyKnown) {
        addMerchantRule({ merchantName, category: bulkCategory, timestamp: Date.now() });
      }
    });
    setSelectedIds(new Set());
    setBulkCategory("");
  };

  const startEditAmount = (t: Transaction) => {
    setEditingAmountId(t.id);
    setAmountDraft(Math.abs(t.amount).toString());
  };

  const commitAmount = (t: Transaction) => {
    const parsed = parseFloat(amountDraft);
    if (!isNaN(parsed)) {
      const signed = t.amount < 0 ? -Math.abs(parsed) : Math.abs(parsed);
      updateTransaction(t.id, { amount: signed, type: signed >= 0 ? "credit" : "debit" });
    }
    setEditingAmountId(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((t) => t.id)));
    }
  };

  const hasActiveFilters = dateFrom || dateTo || amountMin || amountMax;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon field={field} />
      </span>
    </th>
  );

  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;
  const needsReview = transactions.filter((t) => t.needsReview).length;

  if (transactions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {categorized} of {transactions.length} categorized
              {needsReview > 0 && ` • ${needsReview} need review`}
              {sorted.length !== transactions.length && ` • showing ${sorted.length}`}
            </CardDescription>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2 flex-wrap pt-1">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {allCategories.map((cat) => {
                const icon = getCategoryByName(cat)?.icon ?? "";
                return (
                  <SelectItem key={cat} value={cat}>
                    {icon} {cat}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-0.5 text-xs px-1 py-0 bg-white/20">
                {[dateFrom, dateTo, amountMin, amountMax].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex gap-3 flex-wrap pt-1 pb-1 border-t mt-1">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground whitespace-nowrap">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground whitespace-nowrap">to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-muted-foreground whitespace-nowrap">Amount $</label>
              <input
                type="number"
                placeholder="min"
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                className="h-8 w-20 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-muted-foreground">–</span>
              <input
                type="number"
                placeholder="max"
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                className="h-8 w-20 px-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => { setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax(""); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t mt-1 flex-wrap">
            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Select value={bulkCategory} onValueChange={setBulkCategory}>
              <SelectTrigger className="h-8 text-sm w-[180px]">
                <SelectValue placeholder="Assign category..." />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryByName(cat)?.icon ?? ""} {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!bulkCategory} onClick={handleBulkApply}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Mobile card view */}
        <div className="sm:hidden divide-y">
          {sorted.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground text-sm">
              No transactions match your filters
            </p>
          ) : sorted.map((t) => {
            const icon = getCategoryByName(t.category || "")?.icon ?? "";
            return (
              <div
                key={t.id}
                className={`px-4 py-3 ${t.needsReview ? "bg-yellow-50/60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      t.amount > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {editingId === t.id ? (
                    <Select
                      value={t.category || ""}
                      onValueChange={(v) => handleCategoryChange(t, v)}
                      open
                      onOpenChange={(open) => !open && setEditingId(null)}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {getCategoryByName(cat)?.icon ?? ""} {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <button
                      className="text-xs text-left flex items-center gap-1 hover:underline"
                      onClick={() => setEditingId(t.id)}
                    >
                      <span>{icon}</span>
                      <span className={!t.category || t.category === "Uncategorized" ? "text-muted-foreground italic" : ""}>
                        {t.category || "Uncategorized"}
                      </span>
                    </button>
                  )}
                  {t.needsReview && (
                    <Badge variant="warning" className="text-xs ml-auto">Review</Badge>
                  )}
                </div>
              </div>
            );
          })}
          {sorted.length > 0 && (
            <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
              <span className="text-sm font-semibold">{sorted.length} transactions</span>
              {(() => {
                const net = sorted.reduce((s, t) => s + t.amount, 0);
                return (
                  <span className={`text-sm font-semibold tabular-nums ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {net >= 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(net)}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block rounded-b-lg border-t overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={sorted.length > 0 && selectedIds.size === sorted.length}
                      ref={(el) => {
                        if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < sorted.length;
                      }}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <SortHeader field="date" label="Date" />
                  <SortHeader field="description" label="Description" />
                  <SortHeader field="category" label="Category" />
                  <th
                    className="px-4 py-3 text-right text-sm font-medium cursor-pointer select-none hover:text-foreground"
                    onClick={() => handleSort("amount")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      Amount <SortIcon field="amount" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">AI</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No transactions match your filters
                    </td>
                  </tr>
                ) : sorted.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`border-b transition-colors hover:bg-muted/30 ${
                      selectedIds.has(transaction.id) ? "bg-primary/5" : ""
                    } ${transaction.needsReview && !selectedIds.has(transaction.id) ? "bg-yellow-50/60" : ""}`}
                  >
                    <td className="px-4 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(transaction.id)}
                        onChange={() => toggleSelect(transaction.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-sm whitespace-nowrap text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-2.5 text-sm max-w-xs">
                      <span className="block truncate" title={transaction.description}>
                        {transaction.description}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm min-w-[160px]">
                      {editingId === transaction.id ? (
                        <Select
                          value={transaction.category || ""}
                          onValueChange={(v) => handleCategoryChange(transaction, v)}
                          open
                          onOpenChange={(open) => !open && setEditingId(null)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map((cat) => {
                              const icon = getCategoryByName(cat)?.icon ?? "";
                              return (
                                <SelectItem key={cat} value={cat}>
                                  {icon} {cat}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          className="flex items-center gap-1 text-left hover:underline focus:outline-none"
                          onClick={() => setEditingId(transaction.id)}
                          title={transaction.categoryReason ? `AI: ${transaction.categoryReason}` : "Click to change category"}
                        >
                          <span>{getCategoryByName(transaction.category || "")?.icon ?? ""}</span>
                          <span className={!transaction.category || transaction.category === "Uncategorized" ? "text-muted-foreground italic" : ""}>
                            {transaction.category || "Uncategorized"}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium tabular-nums">
                      {editingAmountId === transaction.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={amountDraft}
                          autoFocus
                          onChange={(e) => setAmountDraft(e.target.value)}
                          onBlur={() => commitAmount(transaction)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitAmount(transaction);
                            if (e.key === "Escape") setEditingAmountId(null);
                          }}
                          className="w-24 text-right px-1 py-0.5 border rounded text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <button
                          className={`hover:underline focus:outline-none ${transaction.amount > 0 ? "text-emerald-600" : "text-red-600"}`}
                          onClick={() => startEditAmount(transaction)}
                          title="Click to correct amount"
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {formatCurrency(transaction.amount)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {transaction.needsReview ? (
                        <Badge variant="warning" className="text-xs">Review</Badge>
                      ) : transaction.confidence !== undefined && transaction.confidence >= 0.8 ? (
                        <Badge variant="success" className="text-xs">
                          {Math.round(transaction.confidence * 100)}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round((transaction.confidence || 0) * 100)}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {sorted.length > 0 && (
                <tfoot className="bg-muted/50 border-t-2 sticky bottom-0">
                  <tr>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 text-sm font-semibold" colSpan={2}>
                      {sorted.length} transaction{sorted.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground" />
                    <td className="px-4 py-2.5 text-sm text-right font-semibold tabular-nums">
                      {(() => {
                        const net = sorted.reduce((s, t) => s + t.amount, 0);
                        return (
                          <span className={net >= 0 ? "text-emerald-600" : "text-red-600"}>
                            {net >= 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(net)}
                          </span>
                        );
                      })()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
