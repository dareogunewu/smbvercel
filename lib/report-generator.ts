import ExcelJS from "exceljs";
import { Transaction, CorporateReport } from "./types";
import { downloadFile } from "./utils";

/**
 * Generate corporate business report from transactions
 */
export function generateCorporateReport(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string
): CorporateReport {
  const categories: CorporateReport["categories"] = {};

  // Group transactions by category
  transactions.forEach((transaction) => {
    const category = transaction.category || "Uncategorized";

    if (!categories[category]) {
      categories[category] = {
        amount: 0,
        count: 0,
        transactions: [],
      };
    }

    categories[category].amount += transaction.amount;
    categories[category].count += 1;
    categories[category].transactions.push(transaction);
  });

  // Calculate totals
  const totalRevenue = transactions
    .filter((t) => t.type === "credit" || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit" || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    period: {
      start: periodStart,
      end: periodEnd,
    },
    summary: {
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    },
    categories,
  };
}

/**
 * Export report to Excel file using ExcelJS
 */
export async function exportToExcel(report: CorporateReport, fileName?: string) {
  const workbook = new ExcelJS.Workbook();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet("Summary");

  // Set column widths
  summarySheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 10 },
    { width: 15 },
  ];

  // Title
  summarySheet.addRow(["CORPORATE BUSINESS REPORT"]);
  summarySheet.getRow(1).font = { bold: true, size: 16 };
  summarySheet.addRow([]);

  // Period
  summarySheet.addRow(["Period:", `${report.period.start} to ${report.period.end}`]);
  summarySheet.addRow([]);

  // Financial Summary
  summarySheet.addRow(["FINANCIAL SUMMARY"]);
  summarySheet.getRow(5).font = { bold: true };
  summarySheet.addRow(["Total Revenue", report.summary.totalRevenue.toFixed(2)]);
  summarySheet.addRow(["Total Expenses", report.summary.totalExpenses.toFixed(2)]);
  summarySheet.addRow(["Net Income", report.summary.netIncome.toFixed(2)]);
  summarySheet.addRow([]);

  // Category Breakdown
  summarySheet.addRow(["CATEGORY BREAKDOWN"]);
  summarySheet.getRow(10).font = { bold: true };
  const headerRow = summarySheet.addRow(["Category", "Amount", "Count", "Average"]);
  headerRow.font = { bold: true };

  // Add category rows
  Object.entries(report.categories)
    .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
    .forEach(([category, data]) => {
      summarySheet.addRow([
        category,
        data.amount.toFixed(2),
        data.count.toString(),
        (data.amount / data.count).toFixed(2),
      ]);
    });

  // Transactions Sheet
  const transactionsSheet = workbook.addWorksheet("Transactions");

  transactionsSheet.columns = [
    { header: "Date", width: 12 },
    { header: "Description", width: 40 },
    { header: "Category", width: 20 },
    { header: "Amount", width: 12 },
    { header: "Type", width: 10 },
  ];

  transactionsSheet.getRow(1).font = { bold: true };

  if (report.categories) {
    Object.entries(report.categories).forEach(([, data]) => {
      data.transactions.forEach((transaction) => {
        transactionsSheet.addRow([
          transaction.date,
          transaction.description,
          transaction.category || "Uncategorized",
          transaction.amount.toFixed(2),
          transaction.type,
        ]);
      });
    });
  }

  // Category Details Sheets
  Object.entries(report.categories)
    .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 10) // Limit to top 10 categories
    .forEach(([category, data]) => {
      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = category
        .replace(/[:\\/?*\[\]]/g, "")
        .substring(0, 31);

      const categorySheet = workbook.addWorksheet(sheetName);

      categorySheet.columns = [
        { width: 12 },
        { width: 40 },
        { width: 12 },
      ];

      categorySheet.addRow([category.toUpperCase()]);
      categorySheet.getRow(1).font = { bold: true, size: 14 };
      categorySheet.addRow([]);
      categorySheet.addRow(["Total:", data.amount.toFixed(2)]);
      categorySheet.addRow(["Count:", data.count.toString()]);
      categorySheet.addRow(["Average:", (data.amount / data.count).toFixed(2)]);
      categorySheet.addRow([]);

      const headerRow = categorySheet.addRow(["Date", "Description", "Amount"]);
      headerRow.font = { bold: true };

      data.transactions.forEach((transaction) => {
        categorySheet.addRow([
          transaction.date,
          transaction.description,
          transaction.amount.toFixed(2),
        ]);
      });
    });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const defaultFileName = `corporate-report-${new Date().toISOString().split("T")[0]}.xlsx`;
  downloadFile(blob, fileName || defaultFileName, blob.type);
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(transactions: Transaction[], fileName?: string) {
  const csvData = [
    ["Date", "Description", "Category", "Amount", "Type", "Confidence"],
  ];

  transactions.forEach((transaction) => {
    csvData.push([
      transaction.date,
      transaction.description,
      transaction.category || "Uncategorized",
      transaction.amount.toFixed(2),
      transaction.type,
      (transaction.confidence || 0).toFixed(2),
    ]);
  });

  const csv = csvData.map((row) => row.join(",")).join("\n");

  const defaultFileName = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, fileName || defaultFileName, "text/csv");
}
