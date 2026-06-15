import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Transaction, MerchantRule, UploadStatus } from "./types";

interface AppState {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;

  isMultiMonthMode: boolean;
  setMultiMonthMode: (enabled: boolean) => void;

  merchantRules: MerchantRule[];
  addMerchantRule: (rule: MerchantRule) => void;
  deleteMerchantRule: (merchantName: string) => void;
  clearMerchantRules: () => void;
  getMerchantRules: () => MerchantRule[];

  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  uploadProgress: number;
  setUploadProgress: (progress: number) => void;
  uploadStep: string;
  setUploadStep: (step: string) => void;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;

  fileName: string | null;
  setFileName: (name: string | null) => void;
  lastLoadedAt: number | null;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      transactions: [],
      setTransactions: (transactions) =>
        set({ transactions, lastLoadedAt: Date.now() }),
      addTransactions: (newTransactions) =>
        set((state) => {
          if (!state.isMultiMonthMode) {
            return { transactions: newTransactions, lastLoadedAt: Date.now() };
          }
          return {
            transactions: [
              ...state.transactions,
              ...newTransactions.filter(
                (newTx) =>
                  !state.transactions.some(
                    (existingTx) =>
                      existingTx.date === newTx.date &&
                      existingTx.description === newTx.description &&
                      existingTx.amount === newTx.amount
                  )
              ),
            ],
            lastLoadedAt: Date.now(),
          };
        }),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      clearTransactions: () =>
        set({ transactions: [], fileName: null, uploadStatus: "idle", lastLoadedAt: null }),

      isMultiMonthMode: false,
      setMultiMonthMode: (enabled) => set({ isMultiMonthMode: enabled }),

      merchantRules: [],
      addMerchantRule: (rule) =>
        set((state) => {
          const exists = state.merchantRules.some(
            (r) => r.merchantName.toLowerCase() === rule.merchantName.toLowerCase()
          );
          if (exists) {
            return {
              merchantRules: state.merchantRules.map((r) =>
                r.merchantName.toLowerCase() === rule.merchantName.toLowerCase()
                  ? rule
                  : r
              ),
            };
          }
          return { merchantRules: [...state.merchantRules, rule] };
        }),
      deleteMerchantRule: (merchantName) =>
        set((state) => ({
          merchantRules: state.merchantRules.filter(
            (r) => r.merchantName.toLowerCase() !== merchantName.toLowerCase()
          ),
        })),
      clearMerchantRules: () => set({ merchantRules: [] }),
      getMerchantRules: () => get().merchantRules,

      uploadStatus: "idle",
      setUploadStatus: (status) => set({ uploadStatus: status }),
      uploadProgress: 0,
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      uploadStep: "",
      setUploadStep: (step) => set({ uploadStep: step }),
      errorMessage: null,
      setErrorMessage: (message) => set({ errorMessage: message }),

      fileName: null,
      setFileName: (name) => set({ fileName: name }),
      lastLoadedAt: null,
    }),
    {
      name: "smbowner-storage",
      partialize: (state) => ({
        merchantRules: state.merchantRules,
      }),
    }
  )
);
