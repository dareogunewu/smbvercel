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
 * Export report to Excel file using ExcelJS - Corporate Template Format
 */
export async function exportToExcel(report: CorporateReport, fileName?: string) {
  const workbook = new ExcelJS.Workbook();

  // Corporate Revenue & Expense Report Sheet
  const sheet = workbook.addWorksheet("Corporate Report");

  // Set column widths - Month/Expense column + 12 months + Total + extra columns
  sheet.columns = [
    { width: 25 }, // Month/expense
    { width: 12 }, // April
    { width: 12 }, // May
    { width: 12 }, // June
    { width: 12 }, // July
    { width: 12 }, // Aug
    { width: 12 }, // Sept
    { width: 12 }, // Oct
    { width: 12 }, // Nov
    { width: 12 }, // Dec
    { width: 12 }, // Jan
    { width: 12 }, // Feb
    { width: 12 }, // March
    { width: 15 }, // Total
    { width: 10 }, // Empty
    { width: 10 }, // Empty
    { width: 15 }, // House
    { width: 12 }, // Extra
    { width: 12 }, // Extra
  ];

  // Determine fiscal year end based on latest transaction date
  const latestDate = new Date(report.period.end);
  const fiscalYearEnd = latestDate.getFullYear();

  // Header Section
  sheet.addRow(["COMPANY NAME:", "YOUR COMPANY NAME"]);
  sheet.getRow(1).font = { bold: true };

  sheet.addRow(["CORPORATION REVENUE AND EXPENSE REPORT"]);
  sheet.getRow(2).font = { bold: true };

  sheet.addRow([`PERIOD: ${report.period.start} to ${report.period.end} (Fiscal Year ${fiscalYearEnd})`]);
  sheet.getRow(3).font = { bold: true };

  // Revenue Header Row
  const revenueHeaderRow = sheet.addRow([
    "Revenue (Monthly)",
    "April", "May", "June", "July", "Aug.", "Sept.",
    "Oct.", "Nov.", "Dec.", "Jan.", "Feb.", "March", "Total"
  ]);
  revenueHeaderRow.font = { bold: true };

  sheet.addRow(["Revenue (GST/HST included)"]);
  sheet.addRow([]); // Empty revenue rows
  sheet.addRow([]);
  sheet.addRow([]);

  // Total revenue row
  sheet.addRow(["Total"]);
  sheet.addRow(["HST"]);
  sheet.addRow([]); // Empty row

  // Expense Header Row
  const expenseHeaderRow = sheet.addRow([
    "Month/expense",
    "April", "May", "June", "July", "Aug.", "Sept.",
    "Oct.", "Nov.", "Dec.", "Jan.", "Feb.", "March", "Total",
    "", "", "House"
  ]);
  expenseHeaderRow.font = { bold: true };

  // Group transactions by category and month
  const monthlyData: Record<string, Record<number, number>> = {};
  const categoryTotals: Record<string, number> = {};

  // Month mapping (0 = Jan, 3 = Apr for fiscal year starting April)
  const fiscalMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr-Mar

  // Process transactions
  Object.entries(report.categories).forEach(([category, data]) => {
    if (!monthlyData[category]) {
      monthlyData[category] = {};
      categoryTotals[category] = 0;
    }

    data.transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const month = date.getMonth();
      const amount = Math.abs(transaction.amount);

      if (!monthlyData[category][month]) {
        monthlyData[category][month] = 0;
      }

      monthlyData[category][month] += amount;
      categoryTotals[category] += amount;
    });
  });

  // Add expense category rows
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category);

  sortedCategories.forEach((category) => {
    const row = [category];

    // Add monthly values in fiscal year order (Apr-Mar)
    fiscalMonthOrder.forEach((month) => {
      const value = monthlyData[category][month] || 0;
      row.push(value > 0 ? value.toFixed(2) : "");
    });

    // Add total
    row.push(categoryTotals[category].toFixed(2));

    sheet.addRow(row);
  });

  // Add total row
  const totalRow = ["Total"];
  let grandTotal = 0;

  fiscalMonthOrder.forEach((month) => {
    let monthTotal = 0;
    sortedCategories.forEach((category) => {
      monthTotal += monthlyData[category][month] || 0;
    });
    totalRow.push(monthTotal > 0 ? monthTotal.toFixed(2) : "");
    grandTotal += monthTotal;
  });

  totalRow.push(grandTotal.toFixed(2));
  const totalRowObj = sheet.addRow(totalRow);
  totalRowObj.font = { bold: true };

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


  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const defaultFileName = `corporate-report-${new Date().toISOString().split("T")[0]}.xlsx`;
  downloadFile(blob, fileName || defaultFileName, blob.type);
}

/**
 * Export transactions to CSV in corporate format (matches Excel template)
 */
export function exportToCSV(transactions: Transaction[], fileName?: string) {
  const fiscalMonthNames = ["April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.", "Jan.", "Feb.", "March"];
  const fiscalMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr-Mar

  // Determine fiscal year from transactions
  const dates = transactions.map(t => new Date(t.date));
  const periodStart = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
  const periodEnd = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
  const fiscalYear = new Date(periodEnd).getFullYear();

  const csvLines: string[] = [];

  // Header
  csvLines.push("COMPANY NAME:,YOUR COMPANY NAME");
  csvLines.push("CORPORATION REVENUE AND EXPENSE REPORT");
  csvLines.push(`PERIOD: ${periodStart} to ${periodEnd} (Fiscal Year ${fiscalYear})`);
  csvLines.push(""); // Empty line

  // Revenue section
  const revenueHeader = ["Revenue (Monthly)", ...fiscalMonthNames, "Total"];
  csvLines.push(revenueHeader.join(","));
  csvLines.push("Revenue (GST/HST included)");
  csvLines.push(""); // Empty revenue rows
  csvLines.push("");
  csvLines.push("");
  csvLines.push("Total");
  csvLines.push("HST");
  csvLines.push(""); // Empty line

  // Expense header
  const expenseHeader = ["Month/expense", ...fiscalMonthNames, "Total", "", "", "House"];
  csvLines.push(expenseHeader.join(","));

  // Group transactions by category and month
  const monthlyData: Record<string, Record<number, number>> = {};
  const categoryTotals: Record<string, number> = {};

  transactions.forEach((transaction) => {
    const category = transaction.category || "Uncategorized";
    const date = new Date(transaction.date);
    const month = date.getMonth();
    const amount = Math.abs(transaction.amount);

    if (!monthlyData[category]) {
      monthlyData[category] = {};
      categoryTotals[category] = 0;
    }

    if (!monthlyData[category][month]) {
      monthlyData[category][month] = 0;
    }

    monthlyData[category][month] += amount;
    categoryTotals[category] += amount;
  });

  // Add expense category rows
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category]) => category);

  sortedCategories.forEach((category) => {
    const row = [category];

    // Add monthly values in fiscal year order (Apr-Mar)
    fiscalMonthOrder.forEach((month) => {
      const value = monthlyData[category][month] || 0;
      row.push(value > 0 ? value.toFixed(2) : "");
    });

    // Add total
    row.push(categoryTotals[category].toFixed(2));

    csvLines.push(row.join(","));
  });

  // Add total row
  const totalRow = ["Total"];
  let grandTotal = 0;

  fiscalMonthOrder.forEach((month) => {
    let monthTotal = 0;
    sortedCategories.forEach((category) => {
      monthTotal += monthlyData[category][month] || 0;
    });
    totalRow.push(monthTotal > 0 ? monthTotal.toFixed(2) : "");
    grandTotal += monthTotal;
  });

  totalRow.push(grandTotal.toFixed(2));
  csvLines.push(totalRow.join(","));

  const csv = csvLines.join("\n");
  const defaultFileName = `corporate-report-${new Date().toISOString().split("T")[0]}.csv`;
  downloadFile(csv, fileName || defaultFileName, "text/csv");
}
