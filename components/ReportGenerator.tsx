"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { generateCorporateReport, exportToExcel, exportToCSV } from "@/lib/report-generator";
import { useStore } from "@/lib/store";
import { getCategoryByName } from "@/lib/categories";
import { extractMerchantName } from "@/lib/categorization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileSpreadsheet, FileDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportGeneratorProps {
  transactions: Transaction[];
}

export function ReportGenerator({ transactions }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { isMultiMonthMode } = useStore();

  if (transactions.length === 0) return null;

  const debits = transactions.filter((t) => t.amount < 0);
  const credits = transactions.filter((t) => t.amount > 0);

  const totalRevenue = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = totalRevenue - totalExpenses;

  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;
  const categorizedPct = Math.round((categorized / transactions.length) * 100);

  // Category breakdown (expenses only)
  const expenseByCategory: Record<string, number> = {};
  debits.forEach((t) => {
    const cat = t.category || "Uncategorized";
    expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Math.abs(t.amount);
  });
  const sortedCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);
  const maxCategoryAmount = sortedCategories[0]?.[1] ?? 1;

  // Top merchants by spend
  const merchantTotals: Record<string, number> = {};
  debits.forEach((t) => {
    const merchant = extractMerchantName(t.description);
    merchantTotals[merchant] = (merchantTotals[merchant] ?? 0) + Math.abs(t.amount);
  });
  const topMerchants = Object.entries(merchantTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      const dates = transactions.map((t) => new Date(t.date).getTime());
      const report = generateCorporateReport(
        transactions,
        new Date(Math.min(...dates)).toISOString().split("T")[0],
        new Date(Math.max(...dates)).toISOString().split("T")[0]
      );
      await exportToExcel(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    setIsGenerating(true);
    try {
      const uniqueMonths = new Set(
        transactions.map((t) => {
          const d = new Date(t.date);
          return `${d.getFullYear()}-${d.getMonth()}`;
        })
      );
      const isSingleMonth = uniqueMonths.size === 1;
      exportToCSV(transactions, undefined, !isSingleMonth);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Financial Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Financial Summary</CardTitle>
          {isMultiMonthMode && (
            <CardDescription className="text-xs">Combined across all uploaded statements</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Revenue</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Net Income</span>
            <span className={`text-lg font-bold ${netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(netIncome)}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Categorized</span>
              <span>{categorizedPct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${categorizedPct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spending by Category */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Spending by Category</CardTitle>
            <CardDescription className="text-xs">Top {sortedCategories.length} expense categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sortedCategories.map(([cat, amount]) => {
              const icon = getCategoryByName(cat)?.icon ?? "📦";
              const pct = Math.round((amount / totalExpenses) * 100);
              const barWidth = Math.round((amount / maxCategoryAmount) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center text-xs mb-0.5">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <span>{icon}</span>
                      <span>{cat}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {formatCurrency(amount)}{" "}
                      <span className="opacity-60">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Top Merchants */}
      {topMerchants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Merchants</CardTitle>
            <CardDescription className="text-xs">By total spend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topMerchants.map(([merchant, amount], i) => (
              <div key={merchant} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm truncate">{merchant}</span>
                </div>
                <span className="text-sm font-medium shrink-0 text-red-600">
                  {formatCurrency(amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export Report</CardTitle>
          <CardDescription className="text-xs">
            {isMultiMonthMode ? "Fiscal year corporate format" : "Download your financial data"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={handleGenerateExcel}
            disabled={isGenerating || categorized === 0}
            className="w-full"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Corporate Report (Excel)"}
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={isGenerating}
            className="w-full"
            size="sm"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isMultiMonthMode ? "Fiscal Year CSV" : "Export Transactions (CSV)"}
          </Button>
          {categorized === 0 && (
            <p className="text-xs text-amber-600 text-center pt-1">
              Categorize at least one transaction first
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
