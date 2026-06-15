// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
}

export interface ParseResult {
  success: boolean;
  bank: string;
  transactions: ParsedTransaction[];
  metadata: {
    total_transactions: number;
    safety_check_passed: boolean;
    statement_type: string;
  };
  error?: string;
}

const BANK_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "TD", patterns: [/TD\s+(?:Canada\s+Trust|Bank)/i, /Toronto-Dominion/i] },
  { name: "RBC", patterns: [/Royal\s+Bank/i, /RBC\s+(?:Royal|Direct)/i] },
  { name: "BMO", patterns: [/Bank\s+of\s+Montreal/i, /\bBMO\b/i] },
  { name: "CIBC", patterns: [/\bCIBC\b/i, /Canadian\s+Imperial/i] },
  { name: "Scotiabank", patterns: [/Scotiabank/i, /Bank\s+of\s+Nova\s+Scotia/i] },
  { name: "Tangerine", patterns: [/\bTangerine\b/i] },
  { name: "Desjardins", patterns: [/Desjardins/i] },
  { name: "National Bank", patterns: [/National\s+Bank/i, /Banque\s+Nationale/i] },
  { name: "HSBC", patterns: [/\bHSBC\b/i] },
  { name: "EQ Bank", patterns: [/EQ\s+Bank/i] },
];

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// Matches: $1,234.56  -25.99  (1,234.56)  1,234.56-
const AMOUNT_RE = /([+-]?\$?[\d,]+\.\d{2}[-+]?|\(\$?[\d,]+\.\d{2}\))/;

// Date patterns — ordered from most specific to least
const DATE_PATTERNS = [
  /(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))/,
  /([A-Z][a-z]{2}\.?\s+\d{1,2},?\s+\d{4})/,
  /([A-Z][a-z]{2}\.?\s+\d{1,2})/,
  /((?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d{2,4})?)/,
];

function parseAmount(s: string): number {
  const neg = s.startsWith("-") || s.endsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  const val = parseFloat(s.replace(/[()$,\s+-]/g, ""));
  if (isNaN(val)) return NaN;
  return neg ? -Math.abs(val) : val;
}

function normalizeDate(dateStr: string, year: number): string {
  const s = dateStr.trim().replace(/\.$/, "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY
  const mdyFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyFull) return `${mdyFull[3]}-${mdyFull[1].padStart(2, "0")}-${mdyFull[2].padStart(2, "0")}`;

  // MM/DD/YY
  const mdyShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdyShort) return `20${mdyShort[3]}-${mdyShort[1].padStart(2, "0")}-${mdyShort[2].padStart(2, "0")}`;

  // MM/DD
  const md = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) return `${year}-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`;

  // Jan 15, 2024 or Jan 15
  const mmmdd = s.match(/^([A-Z][a-z]{2})\.?\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (mmmdd) {
    const m = MONTHS[mmmdd[1].toLowerCase()];
    if (!m) return s;
    return `${mmmdd[3] || year}-${m}-${mmmdd[2].padStart(2, "0")}`;
  }

  return s;
}

function tryParseLines(lines: string[], year: number): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;

    // Find date at start of line
    let dateStr: string | null = null;
    let afterDate = trimmed;

    for (const pattern of DATE_PATTERNS) {
      const m = trimmed.match(new RegExp("^\\s*" + pattern.source));
      if (m) {
        dateStr = m[1];
        afterDate = trimmed.slice(m[0].length).trim();
        break;
      }
    }
    if (!dateStr) continue;

    // Find amounts at end of line (may have 1 or 2 — second would be running balance)
    const amountMatches = [...afterDate.matchAll(new RegExp(AMOUNT_RE.source, "g"))];
    if (amountMatches.length === 0) continue;

    // Take first amount as transaction amount, last as possible balance
    // If only 1 amount: that's the transaction
    // If 2 amounts: first is transaction, second is running balance
    const txAmountStr = amountMatches[0][1];
    const amount = parseAmount(txAmountStr);
    if (isNaN(amount)) continue;

    // Description is text after date, before the first amount
    const firstAmountIdx = afterDate.indexOf(txAmountStr);
    const description = afterDate.slice(0, firstAmountIdx).trim();
    if (description.length < 2) continue;

    // Skip lines that are likely headers or balance lines
    if (/^(?:date|description|balance|total|opening|closing|statement)/i.test(description)) continue;
    if (/balance\s+forward|opening\s+balance|closing\s+balance/i.test(description)) continue;

    results.push({
      date: normalizeDate(dateStr, year),
      description,
      amount,
    });
  }

  return results;
}

function tryParseMultiLine(lines: string[], year: number): ParsedTransaction[] {
  // For statements where date, description, and amount may be on separate lines
  const results: ParsedTransaction[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for a line that is JUST a date
    let dateStr: string | null = null;
    for (const pattern of DATE_PATTERNS) {
      const m = line.match(new RegExp("^" + pattern.source + "\\s*$"));
      if (m) { dateStr = m[1]; break; }
    }

    if (dateStr && i + 1 < lines.length) {
      const description = lines[i + 1].trim();
      const amountLine = lines[i + 2]?.trim() || "";
      const amountMatch = amountLine.match(new RegExp("^" + AMOUNT_RE.source + "\\s*$"));

      if (description.length > 1 && amountMatch) {
        const amount = parseAmount(amountMatch[1]);
        if (!isNaN(amount)) {
          results.push({ date: normalizeDate(dateStr, year), description, amount });
          i += 3;
          continue;
        }
      }
    }
    i++;
  }

  return results;
}

export async function parseBankStatement(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const data = await pdfParse(Buffer.from(buffer));
    const fullText = data.text;

    // Detect bank
    let bank = "GenericBank";
    for (const b of BANK_PATTERNS) {
      if (b.patterns.some((p) => p.test(fullText))) {
        bank = b.name;
        break;
      }
    }

    // Extract statement year
    const yearMatch = fullText.match(/\b(20\d{2})\b/);
    const statementYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const lines = fullText.split(/\r?\n/);

    // Strategy 1: parse each line as date + description + amount
    let transactions = tryParseLines(lines, statementYear);

    // Strategy 2: if strategy 1 found very few, try multi-line format
    if (transactions.length < 3) {
      const multiLine = tryParseMultiLine(lines, statementYear);
      if (multiLine.length > transactions.length) {
        transactions = multiLine;
      }
    }

    // Deduplicate exact matches
    const seen = new Set<string>();
    const deduped = transactions.filter((t) => {
      const key = `${t.date}|${t.description}|${t.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      success: deduped.length > 0,
      bank,
      transactions: deduped,
      metadata: {
        total_transactions: deduped.length,
        safety_check_passed: true,
        statement_type: "checking",
      },
      error: deduped.length === 0 ? "No transactions found. The PDF may be scanned or use an unsupported format." : undefined,
    };
  } catch (e) {
    return {
      success: false,
      bank: "Unknown",
      transactions: [],
      metadata: { total_transactions: 0, safety_check_passed: false, statement_type: "unknown" },
      error: e instanceof Error ? e.message : "Failed to parse PDF",
    };
  }
}
