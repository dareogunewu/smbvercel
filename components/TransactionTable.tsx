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
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";

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
  }, [transactions, search, categoryFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleCategoryChange = (transaction: Transaction, category: string) => {
    updateTransaction(transaction.id, {
      category,
      needsReview: false,
      confidence: 1.0,
    });
    const merchantName = extractMerchantName(transaction.description);
    const alreadyKnown = merchantRules.some(
      (r) => r.merchantName.toLowerCase() === merchantName.toLowerCase()
    );
    if (!alreadyKnown) {
      addMerchantRule({ merchantName, category, timestamp: Date.now() });
    }
    setEditingId(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const SortHeader = ({ field, label, align = "left" }: { field: SortField; label: string; align?: string }) => (
    <th
      className={`px-4 py-3 text-${align} text-sm font-medium cursor-pointer select-none hover:text-foreground`}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1 justify-start">
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

        {/* Controls */}
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
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-b-lg border-t overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b">
                  <SortHeader field="date" label="Date" />
                  <SortHeader field="description" label="Description" />
                  <SortHeader field="category" label="Category" />
                  <th className="px-4 py-3 text-right text-sm font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("amount")}>
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
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No transactions match your filters
                    </td>
                  </tr>
                ) : (
                  sorted.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`border-b transition-colors hover:bg-muted/30 ${
                        transaction.needsReview ? "bg-yellow-50/60" : ""
                      }`}
                    >
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
                            title="Click to change category"
                          >
                            <span>{getCategoryByName(transaction.category || "")?.icon ?? ""}</span>
                            <span className={!transaction.category || transaction.category === "Uncategorized" ? "text-muted-foreground italic" : ""}>
                              {transaction.category || "Uncategorized"}
                            </span>
                          </button>
                        )}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-sm text-right font-medium tabular-nums ${
                          transaction.amount > 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
