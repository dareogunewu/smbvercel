import * as XLSX from "xlsx";
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
 * Export report to Excel file
 */
export function exportToExcel(report: CorporateReport, fileName?: string) {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["CORPORATE BUSINESS REPORT"],
    [],
    ["Period:", `${report.period.start} to ${report.period.end}`],
    [],
    ["FINANCIAL SUMMARY"],
    ["Total Revenue", report.summary.totalRevenue.toFixed(2)],
    ["Total Expenses", report.summary.totalExpenses.toFixed(2)],
    ["Net Income", report.summary.netIncome.toFixed(2)],
    [],
    ["CATEGORY BREAKDOWN"],
    ["Category", "Amount", "Count", "Average"],
  ];

  // Add category rows
  Object.entries(report.categories)
    .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
    .forEach(([category, data]) => {
      summaryData.push([
        category,
        data.amount.toFixed(2),
        data.count.toString(),
        (data.amount / data.count).toFixed(2),
      ]);
    });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet["!cols"] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Transactions Sheet
  const transactionsData = [
    ["Date", "Description", "Category", "Amount", "Type"],
  ];

  report.categories &&
    Object.entries(report.categories).forEach(([, data]) => {
      data.transactions.forEach((transaction) => {
        transactionsData.push([
          transaction.date,
          transaction.description,
          transaction.category || "Uncategorized",
          transaction.amount.toFixed(2),
          transaction.type,
        ]);
      });
    });

  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);

  transactionsSheet["!cols"] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");

  // Category Details Sheets
  Object.entries(report.categories)
    .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 10) // Limit to top 10 categories
    .forEach(([category, data]) => {
      const categoryData = [
        [category.toUpperCase()],
        [],
        ["Total:", data.amount.toFixed(2)],
        ["Count:", data.count.toString()],
        ["Average:", (data.amount / data.count).toFixed(2)],
        [],
        ["Date", "Description", "Amount"],
      ];

      data.transactions.forEach((transaction) => {
        categoryData.push([
          transaction.date,
          transaction.description,
          transaction.amount.toFixed(2),
        ]);
      });

      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      categorySheet["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 12 }];

      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = category
        .replace(/[:\\/?*\[\]]/g, "")
        .substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, categorySheet, sheetName);
    });

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
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
