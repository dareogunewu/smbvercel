/**
 * Transaction from bank statement
 */
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
  confidence?: number;
  needsReview?: boolean;
  merchantInfo?: MerchantInfo;
}

/**
 * Merchant information from web search
 */
export interface MerchantInfo {
  name: string;
  businessType?: string;
  description?: string;
  suggestedCategory?: string;
}

/**
 * Transaction category
 */
export interface Category {
  id: string;
  name: string;
  keywords: string[];
  mccCodes?: number[];
  subcategories?: string[];
  icon?: string;
}

/**
 * Categorization result
 */
export interface CategorizationResult {
  category: string;
  confidence: number;
  source: "keyword" | "mcc" | "web_search" | "user_history" | "uncategorized";
  needsReview: boolean;
  merchantInfo?: MerchantInfo;
}

/**
 * User's custom merchant categorization rule
 */
export interface MerchantRule {
  merchantName: string;
  category: string;
  timestamp: number;
}

/**
 * Corporate business report data
 */
export interface CorporateReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  categories: {
    [category: string]: {
      amount: number;
      count: number;
      transactions: Transaction[];
    };
  };
}

/**
 * Upload status
 */
export type UploadStatus = "idle" | "uploading" | "converting" | "processing" | "complete" | "error";
