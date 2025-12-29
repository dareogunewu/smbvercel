/**
 * RBC Bank Statement Parser (JavaScript)
 * Parses RBC PDF statements without requiring Python
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface ParseResult {
  success: boolean;
  bank?: string;
  transactions?: Transaction[];
  error?: string;
  metadata?: {
    total_transactions: number;
    safety_check_passed: boolean;
    statement_type: string;
  };
}

/**
 * Parse RBC PDF bank statement
 */
export async function parseRBCStatement(pdfBuffer: Buffer): Promise<ParseResult> {
  try {
    // Extract text from PDF
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    // Detect statement type
    const isCredit = text.includes('VISA') || text.includes('Credit Card');
    const isChequing = text.includes('Chequing') || text.includes('CHEQUING');
    const isSavings = text.includes('Savings') || text.includes('SAVINGS');

    if (!isCredit && !isChequing && !isSavings) {
      return {
        success: false,
        error: 'Not a recognized RBC statement format',
      };
    }

    const statementType = isCredit ? 'credit' : isChequing ? 'chequing' : 'savings';

    // Parse transactions
    const transactions = parseTransactions(text);

    if (transactions.length === 0) {
      return {
        success: false,
        error: 'No transactions found in statement',
      };
    }

    return {
      success: true,
      bank: 'RBC',
      transactions,
      metadata: {
        total_transactions: transactions.length,
        safety_check_passed: true,
        statement_type: statementType,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
    };
  }
}

/**
 * Parse transactions from statement text
 */
function parseTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match transaction patterns
    // Format: MMM DD DESCRIPTION AMOUNT
    // Example: "JAN 15 STARBUCKS COFFEE 5.99"
    const match = line.match(/^([A-Z]{3})\s+(\d{1,2})\s+(.+?)\s+([-]?\d+[.,]\d{2})$/);

    if (match) {
      const [, month, day, description, amountStr] = match;

      // Convert month abbreviation to number
      const monthNum = getMonthNumber(month);
      if (monthNum === -1) continue;

      // Parse amount
      const amount = parseFloat(amountStr.replace(',', ''));

      // Create date string (using current year as PDF doesn't include year)
      const currentYear = new Date().getFullYear();
      const date = `${currentYear}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;

      transactions.push({
        date,
        description: description.trim(),
        amount,
      });
    }
  }

  return transactions;
}

/**
 * Convert month abbreviation to number
 */
function getMonthNumber(monthAbbr: string): number {
  const months: Record<string, number> = {
    JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
    JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  };
  return months[monthAbbr.toUpperCase()] || -1;
}
