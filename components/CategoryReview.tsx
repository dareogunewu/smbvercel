"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getAllCategoryNames } from "@/lib/categories";
import { extractMerchantName, categorizeMerchantWithAI } from "@/lib/categorization";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Search, Sparkles } from "lucide-react";

interface CategoryReviewProps {
  transactions: Transaction[];
  onComplete?: () => void;
}

export function CategoryReview({
  transactions,
  onComplete,
}: CategoryReviewProps) {
  const { updateTransaction, addMerchantRule } = useStore();
  const reviewTransactions = transactions.filter((t) => t.needsReview);

  // Store selected categories for each transaction
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
  const [rememberMerchants, setRememberMerchants] = useState<Record<string, boolean>>({});
  const [rememberAll, setRememberAll] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});

  const categories = getAllCategoryNames();

  const handleCategoryChange = (transactionId: string, category: string) => {
    setSelectedCategories(prev => ({ ...prev, [transactionId]: category }));
  };

  const handleRememberChange = (transactionId: string, remember: boolean) => {
    setRememberMerchants(prev => ({ ...prev, [transactionId]: remember }));
  };

  const handleAICategorize = async (transaction: Transaction) => {
    const merchantName = extractMerchantName(transaction.description);

    // Set loading state
    setLoadingAI(prev => ({ ...prev, [transaction.id]: true }));

    try {
      const result = await categorizeMerchantWithAI(merchantName);

      if (result && result.category) {
        // Update the selected category
        handleCategoryChange(transaction.id, result.category);

        console.log(`AI categorized "${merchantName}" as "${result.category}" (source: ${result.source}, confidence: ${result.confidence})`);
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    } finally {
      setLoadingAI(prev => ({ ...prev, [transaction.id]: false }));
    }
  };

  const handleApproveAll = () => {
    console.log('Remember All enabled:', rememberAll);
    console.log('Individual remember states:', rememberMerchants);

    reviewTransactions.forEach((transaction) => {
      const category = selectedCategories[transaction.id] || transaction.category;

      if (category) {
        // Update the transaction
        updateTransaction(transaction.id, {
          category,
          needsReview: false,
          confidence: 1.0,
        });

        // Save merchant rule if user wants to remember (individual or "Remember All")
        const shouldRemember = rememberAll || rememberMerchants[transaction.id];
        if (shouldRemember) {
          const merchantName = extractMerchantName(transaction.description);
          console.log(`Saving merchant rule: ${merchantName} → ${category}`);
          addMerchantRule({
            merchantName,
            category,
            timestamp: Date.now(),
          });
        }
      }
    });

    onComplete?.();
  };

  const allCategorized = reviewTransactions.every(
    (t) => selectedCategories[t.id] || t.category
  );

  if (reviewTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle>Review Transactions</CardTitle>
          </div>
          <Badge variant="warning">
            {reviewTransactions.length} need review
          </Badge>
        </div>
        <CardDescription>
          Select categories for all transactions and click &quot;Approve All&quot; when done
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-2 text-sm font-semibold">Date</th>
                <th className="text-left p-2 text-sm font-semibold">Description</th>
                <th className="text-right p-2 text-sm font-semibold">Amount</th>
                <th className="text-left p-2 text-sm font-semibold">Category</th>
                <th className="text-center p-2 text-sm font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="checkbox"
                      checked={rememberAll}
                      onChange={(e) => setRememberAll(e.target.checked)}
                      className="rounded border-gray-300 cursor-pointer"
                      title="Remember all merchants"
                    />
                    <span>Remember</span>
                  </div>
                </th>
                <th className="text-center p-2 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-sm max-w-xs" title={transaction.description}>
                    <div className="truncate">{transaction.description}</div>
                  </td>
                  <td className="p-2 text-sm text-right font-medium">
                    {formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td className="p-2">
                    <Select
                      value={selectedCategories[transaction.id] || transaction.category || ""}
                      onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={rememberAll || rememberMerchants[transaction.id] || false}
                      onChange={(e) => handleRememberChange(transaction.id, e.target.checked)}
                      disabled={rememberAll}
                      className="rounded border-gray-300 cursor-pointer disabled:opacity-50"
                      title={rememberAll ? "Remember All is enabled" : "Remember this merchant for future transactions"}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleAICategorize(transaction)}
                        disabled={loadingAI[transaction.id]}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-purple-100 text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="AI Categorize with Gemini"
                      >
                        {loadingAI[transaction.id] ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </button>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(transaction.description)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-primary/10 text-primary transition-colors"
                        title="Search Google for this merchant"
                      >
                        <Search className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remember All Status */}
        {rememberAll && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-medium">
              ✓ Remember All enabled - {reviewTransactions.length} merchant{reviewTransactions.length !== 1 ? 's' : ''} will be saved for future categorization
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApproveAll}
            disabled={!allCategorized}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve All ({reviewTransactions.length} items)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
