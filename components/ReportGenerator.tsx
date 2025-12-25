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
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-xl">Generate Report</CardTitle>
        <CardDescription className="text-sm">
          Export your categorized transactions to Excel or CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Revenue
            </p>
            <p className="text-lg font-bold text-green-600 truncate">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-red-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Expenses
            </p>
            <p className="text-lg font-bold text-red-600 truncate">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className={`bg-white rounded-lg p-3 shadow-sm border ${netIncome >= 0 ? 'border-green-100' : 'border-red-100'}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Net Income
            </p>
            <p
              className={`text-lg font-bold truncate ${
                netIncome >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Categorization Progress</span>
            <span className="text-xl font-bold text-blue-600">{categorizedPercentage}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${categorizedPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {categorized} of {transactions.length} transactions categorized
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGenerateExcel}
            disabled={isGenerating || categorized === 0}
            className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isGenerating
              ? "Generating..."
              : "Generate Corporate Business Report (Excel)"}
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            disabled={isGenerating}
            className="w-full h-11 text-sm font-semibold border-2 border-blue-200 hover:bg-blue-50 shadow-sm hover:shadow transition-all"
            size="lg"
          >
            <FileDown className="h-4 w-4 mr-2" />
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
