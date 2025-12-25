"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { generateCorporateReport, exportToExcel, exportToCSV } from "@/lib/report-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportGeneratorProps {
  transactions: Transaction[];
}

export function ReportGenerator({ transactions }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (transactions.length === 0) {
    return null;
  }

  const handleGenerateExcel = async () => {
    setIsGenerating(true);

    try {
      // Calculate period from transactions
      const dates = transactions.map((t) => new Date(t.date));
      const periodStart = new Date(
        Math.min(...dates.map((d) => d.getTime()))
      ).toISOString().split("T")[0];
      const periodEnd = new Date(
        Math.max(...dates.map((d) => d.getTime()))
      ).toISOString().split("T")[0];

      const report = generateCorporateReport(
        transactions,
        periodStart,
        periodEnd
      );

      await exportToExcel(report);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    setIsGenerating(true);

    try {
      exportToCSV(transactions);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate summary statistics
  const totalRevenue = transactions
    .filter((t) => t.type === "credit" || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit" || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netIncome = totalRevenue - totalExpenses;

  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;

  const categorizedPercentage = Math.round(
    (categorized / transactions.length) * 100
  );

  return (
    <Card className="border-0 shadow-[4px_4px_0px_rgba(6,41,66,0.1)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-foreground">Generate Report</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Export your categorized transactions to Excel or CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200/50 shadow-[2px_2px_0px_rgba(55,167,3,0.1)]">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1.5">
              Total Revenue
            </p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-green-700 break-words">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border-2 border-red-200/50 shadow-[2px_2px_0px_rgba(220,38,38,0.1)]">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5">
              Total Expenses
            </p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-red-700 break-words">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className={`bg-gradient-to-br rounded-lg p-4 border-2 shadow-[2px_2px_0px_rgba(6,41,66,0.1)] ${
            netIncome >= 0
              ? 'from-blue-50 to-cyan-50 border-blue-200/50'
              : 'from-orange-50 to-amber-50 border-orange-200/50'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${
              netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
              Net Income
            </p>
            <p
              className={`text-base sm:text-lg md:text-xl font-bold break-words ${
                netIncome >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border-2 border-indigo-200/50 shadow-[2px_2px_0px_rgba(99,102,241,0.1)]">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm font-bold text-indigo-900">Categorization Progress</span>
            <span className="text-2xl font-bold text-indigo-600">{categorizedPercentage}%</span>
          </div>
          <div className="h-3 bg-white/60 rounded-full overflow-hidden mb-2 border border-indigo-200/30">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500 transition-all duration-500 rounded-full shadow-sm"
              style={{ width: `${categorizedPercentage}%` }}
            />
          </div>
          <p className="text-xs font-semibold text-indigo-700">
            {categorized} of {transactions.length} transactions categorized
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleGenerateExcel}
            disabled={isGenerating || categorized === 0}
            className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[4px_4px_0px_rgba(0,117,221,0.2)] hover:shadow-[2px_2px_0px_rgba(0,117,221,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg"
            size="lg"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            {isGenerating
              ? "Generating..."
              : "Generate Corporate Report (Excel)"}
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={isGenerating}
            className="w-full h-12 text-sm font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-[4px_4px_0px_rgba(0,117,221,0.1)] hover:shadow-[2px_2px_0px_rgba(0,117,221,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg"
            size="lg"
          >
            <FileDown className="h-5 w-5 mr-2" />
            Export Transactions (CSV)
          </Button>
        </div>

        {categorized === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 text-center font-medium">
              ⚠️ Please categorize at least one transaction before generating a report
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
