import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, MerchantRule, UploadStatus } from "./types";

interface AppState {
  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;

  // Merchant Rules (persisted)
  merchantRules: MerchantRule[];
  addMerchantRule: (rule: MerchantRule) => void;
  getMerchantRules: () => MerchantRule[];

  // Upload Status
  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;

  // File Info
  fileName: string | null;
  setFileName: (name: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      clearTransactions: () => set({ transactions: [] }),

      // Merchant Rules
      merchantRules: [],
      addMerchantRule: (rule) =>
        set((state) => {
          // Check if rule already exists for this merchant
          const exists = state.merchantRules.some(
            (r) => r.merchantName.toLowerCase() === rule.merchantName.toLowerCase()
          );

          if (exists) {
            // Update existing rule
            return {
              merchantRules: state.merchantRules.map((r) =>
                r.merchantName.toLowerCase() === rule.merchantName.toLowerCase()
                  ? rule
                  : r
              ),
            };
          }

          // Add new rule
          return {
            merchantRules: [...state.merchantRules, rule],
          };
        }),
      getMerchantRules: () => get().merchantRules,

      // Upload Status
      uploadStatus: "idle",
      setUploadStatus: (status) => set({ uploadStatus: status }),
      uploadProgress: 0,
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      errorMessage: null,
      setErrorMessage: (message) => set({ errorMessage: message }),

      // File Info
      fileName: null,
      setFileName: (name) => set({ fileName: name }),
    }),
    {
      name: "smbowner-storage",
      partialize: (state) => ({
        merchantRules: state.merchantRules,
      }),
    }
  )
);
