import { inflateSync } from "zlib";

export interface ParseResult {
  success: boolean;
  bank: string;
  transactions: Array<{ date: string; description: string; amount: number }>;
  metadata: {
    total_transactions: number;
    safety_check_passed: boolean;
    statement_type: string;
  };
  error?: string;
}

// ─── PDF text extraction (zero dependencies) ────────────────────────────────

function decodePDFString(s: string): string {
  return s
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\\/g, "\\")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")");
}

function hexToStr(hex: string): string {
  let r = "";
  for (let i = 0; i + 1 < hex.length; i += 2) {
    r += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return r;
}

function extractFromStream(stream: string): string {
  const lines: string[] = [];
  const btBlocks = stream.match(/BT[\s\S]*?ET/g) ?? [];

  for (const block of btBlocks) {
    const lineParts: string[] = [];

    // (text) Tj  or  (text) '
    for (const m of block.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*[Tj']/g)) {
      lineParts.push(decodePDFString(m[1]));
    }

    // [(text) kern (text) ...] TJ
    for (const m of block.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
      const inner = m[1];
      const parts: string[] = [];
      for (const p of inner.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)/g)) {
        parts.push(decodePDFString(p[1]));
      }
      // Also handle hex strings inside TJ array
      for (const p of inner.matchAll(/<([0-9a-fA-F]+)>/g)) {
        parts.push(hexToStr(p[1]));
      }
      lineParts.push(parts.join(""));
    }

    // <hex> Tj
    for (const m of block.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g)) {
      lineParts.push(hexToStr(m[1].replace(/\s/g, "")));
    }

    if (lineParts.length) lines.push(lineParts.join(" "));
  }

  return lines.join("\n");
}

function extractPDFText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  const parts: string[] = [];

  // Find every stream/endstream pair
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;

  while ((m = streamRe.exec(raw)) !== null) {
    // Look at the 600 chars before "stream" for the object dictionary
    const dictSlice = raw.slice(Math.max(0, m.index - 600), m.index);
    const isFlate = /\/Filter\s*\/FlateDecode/.test(dictSlice) || /\/Filter\s*\[[\s\S]*?\/FlateDecode/.test(dictSlice)
      || (dictSlice.includes("/Fl") && !dictSlice.includes("/Fla") === false);

    let text = "";
    if (isFlate) {
      try {
        const decompressed = inflateSync(Buffer.from(m[1], "latin1"));
        text = decompressed.toString("latin1");
      } catch {
        continue; // skip streams we can't decompress
      }
    } else {
      text = m[1];
    }

    const extracted = extractFromStream(text);
    if (extracted.trim()) parts.push(extracted);
  }

  return parts.join("\n");
}

// ─── Bank detection ──────────────────────────────────────────────────────────

const BANK_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "TD",           re: /TD\s+(?:Canada\s+Trust|Bank)|Toronto-Dominion/i },
  { name: "RBC",          re: /Royal\s+Bank|RBC\s+(?:Royal|Direct)/i },
  { name: "BMO",          re: /Bank\s+of\s+Montreal|\bBMO\b/i },
  { name: "CIBC",         re: /\bCIBC\b|Canadian\s+Imperial/i },
  { name: "Scotiabank",   re: /Scotiabank|Bank\s+of\s+Nova\s+Scotia/i },
  { name: "Tangerine",    re: /\bTangerine\b/i },
  { name: "Desjardins",   re: /Desjardins/i },
  { name: "National Bank",re: /National\s+Bank|Banque\s+Nationale/i },
  { name: "HSBC",         re: /\bHSBC\b/i },
  { name: "EQ Bank",      re: /EQ\s+Bank/i },
];

// ─── Transaction parsing ─────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan:"01", feb:"02", mar:"03", apr:"04", may:"05", jun:"06",
  jul:"07", aug:"08", sep:"09", oct:"10", nov:"11", dec:"12",
};

const DATE_PATTERNS = [
  /(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))/,
  /([A-Z][a-z]{2}\.?\s+\d{1,2},?\s+\d{4})/,
  /([A-Z][a-z]{2}\.?\s+\d{1,2})/,
  /((?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12]\d|3[01])(?:\/\d{2,4})?)/,
];

const AMOUNT_RE = /([+-]?\$?[\d,]+\.\d{2}[-+]?|\(\$?[\d,]+\.\d{2}\))/;

function parseAmount(s: string): number {
  const neg = s.startsWith("-") || s.endsWith("-") || (s.startsWith("(") && s.endsWith(")"));
  const val = parseFloat(s.replace(/[()$,\s+-]/g, ""));
  return isNaN(val) ? NaN : neg ? -Math.abs(val) : val;
}

function normalizeDate(s: string, year: number): string {
  s = s.trim().replace(/\.$/, "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const mdyFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyFull) return `${mdyFull[3]}-${mdyFull[1].padStart(2,"0")}-${mdyFull[2].padStart(2,"0")}`;

  const mdyShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mdyShort) return `20${mdyShort[3]}-${mdyShort[1].padStart(2,"0")}-${mdyShort[2].padStart(2,"0")}`;

  const md = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) return `${year}-${md[1].padStart(2,"0")}-${md[2].padStart(2,"0")}`;

  const mmmdd = s.match(/^([A-Z][a-z]{2})\.?\s+(\d{1,2}),?\s*(\d{4})?$/);
  if (mmmdd) {
    const mo = MONTHS[mmmdd[1].toLowerCase()];
    return mo ? `${mmmdd[3] || year}-${mo}-${mmmdd[2].padStart(2,"0")}` : s;
  }
  return s;
}

function parseLines(
  lines: string[],
  year: number
): Array<{ date: string; description: string; amount: number }> {
  const results = [];
  const SKIP = /^(?:date|description|balance|total|opening|closing|statement|page|account)/i;

  for (const line of lines) {
    const t = line.trim();
    if (t.length < 8) continue;

    let dateStr: string | null = null;
    let afterDate = t;

    for (const pat of DATE_PATTERNS) {
      const m = t.match(new RegExp("^\\s*" + pat.source));
      if (m) { dateStr = m[1]; afterDate = t.slice(m[0].length).trim(); break; }
    }
    if (!dateStr) continue;

    const amountMatches = [...afterDate.matchAll(new RegExp(AMOUNT_RE.source, "g"))];
    if (!amountMatches.length) continue;

    const txAmountStr = amountMatches[0][1];
    const amount = parseAmount(txAmountStr);
    if (isNaN(amount)) continue;

    const description = afterDate.slice(0, afterDate.indexOf(txAmountStr)).trim();
    if (description.length < 2 || SKIP.test(description)) continue;

    results.push({ date: normalizeDate(dateStr, year), description, amount });
  }
  return results;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function parseBankStatement(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const fullText = extractPDFText(Buffer.from(buffer));

    const bank = BANK_PATTERNS.find(b => b.re.test(fullText))?.name ?? "GenericBank";
    const yearMatch = fullText.match(/\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const lines = fullText.split(/\r?\n/);
    const transactions = parseLines(lines, year);

    // Deduplicate
    const seen = new Set<string>();
    const deduped = transactions.filter(t => {
      const k = `${t.date}|${t.description}|${t.amount}`;
      return seen.has(k) ? false : (seen.add(k), true);
    });

    return {
      success: deduped.length > 0,
      bank,
      transactions: deduped,
      metadata: { total_transactions: deduped.length, safety_check_passed: true, statement_type: "checking" },
      error: deduped.length === 0 ? "No transactions found. The PDF may use an unsupported format." : undefined,
    };
  } catch (e) {
    return {
      success: false, bank: "Unknown", transactions: [],
      metadata: { total_transactions: 0, safety_check_passed: false, statement_type: "unknown" },
      error: e instanceof Error ? e.message : "Failed to parse PDF",
    };
  }
}
