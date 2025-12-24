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
import { FileDown, FileSpreadsheet, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportGeneratorProps {
  transactions: Transaction[];
}

export function ReportGenerator({ transactions }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (transactions.length === 0) {
    return null;
  }

  const handleGenerateExcel = () => {
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

      exportToExcel(report);
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
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
        <CardDescription>
          Export your categorized transactions to Excel or CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Income</p>
            <p
              className={`text-2xl font-bold ${
                netIncome >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Categorization Progress</span>
            <span className="font-medium">{categorizedPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${categorizedPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {categorized} of {transactions.length} transactions categorized
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGenerateExcel}
            disabled={isGenerating || categorized === 0}
            className="w-full"
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
            className="w-full"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Transactions (CSV)
          </Button>
        </div>

        {categorized === 0 && (
          <p className="text-sm text-amber-600 text-center">
            Please categorize at least one transaction before generating a
            report
          </p>
        )}
      </CardContent>
    </Card>
  );
}
