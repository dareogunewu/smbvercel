"use client";

import { useState, useEffect } from "react";
import { Transaction, MerchantInfo } from "@/lib/types";
import { useStore } from "@/lib/store";
import { getAllCategoryNames } from "@/lib/categories";
import { extractMerchantName } from "@/lib/categorization";
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
import { AlertCircle, Check, Search } from "lucide-react";

interface CategoryReviewProps {
  transactions: Transaction[];
  onComplete?: () => void;
}

export function CategoryReview({
  transactions,
  onComplete,
}: CategoryReviewProps) {
  const { updateTransaction, addMerchantRule } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [rememberMerchant, setRememberMerchant] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const reviewTransactions = transactions.filter((t) => t.needsReview);
  const currentTransaction = reviewTransactions[currentIndex];

  const categories = getAllCategoryNames();

  useEffect(() => {
    if (currentTransaction) {
      // Auto-search for merchant info if available
      searchMerchantInfo(currentTransaction.description);

      // Pre-select suggested category if available
      if (currentTransaction.category) {
        setSelectedCategory(currentTransaction.category);
      }
    }
  }, [currentIndex, currentTransaction]);

  const searchMerchantInfo = async (description: string) => {
    setIsSearching(true);
    try {
      const merchantName = extractMerchantName(description);
      const response = await fetch("/api/search-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantName }),
      });

      if (response.ok) {
        const data = await response.json();
        setMerchantInfo(data.merchantInfo);

        // Auto-suggest category if found
        if (data.merchantInfo?.suggestedCategory) {
          setSelectedCategory(data.merchantInfo.suggestedCategory);
        }
      }
    } catch (error) {
      console.error("Error searching merchant info:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAccept = () => {
    if (!currentTransaction || !selectedCategory) return;

    // Update the transaction
    updateTransaction(currentTransaction.id, {
      category: selectedCategory,
      needsReview: false,
      confidence: 1.0,
      merchantInfo: merchantInfo || undefined,
    });

    // Save merchant rule if user wants to remember
    if (rememberMerchant) {
      const merchantName = extractMerchantName(currentTransaction.description);
      addMerchantRule({
        merchantName,
        category: selectedCategory,
        timestamp: Date.now(),
      });
    }

    // Move to next transaction
    if (currentIndex < reviewTransactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedCategory("");
      setRememberMerchant(false);
      setMerchantInfo(null);
    } else {
      // All done
      onComplete?.();
    }
  };

  const handleSkip = () => {
    if (currentIndex < reviewTransactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedCategory("");
      setRememberMerchant(false);
      setMerchantInfo(null);
    } else {
      onComplete?.();
    }
  };

  if (reviewTransactions.length === 0) {
    return null;
  }

  if (!currentTransaction) {
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
            {currentIndex + 1} of {reviewTransactions.length}
          </Badge>
        </div>
        <CardDescription>
          These transactions need your review to categorize them correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transaction Details */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-medium text-lg">
                {currentTransaction.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(currentTransaction.date).toLocaleDateString()}
              </p>
            </div>
            <p className="font-bold text-lg">
              {formatCurrency(Math.abs(currentTransaction.amount))}
            </p>
          </div>

          {/* Merchant Info */}
          {isSearching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <Search className="h-4 w-4 animate-spin" />
              <span>Searching for merchant information...</span>
            </div>
          )}

          {merchantInfo && !isSearching && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                {merchantInfo.name}
              </p>
              {merchantInfo.businessType && (
                <p className="text-sm text-blue-700 mt-1">
                  {merchantInfo.businessType}
                </p>
              )}
              {merchantInfo.description && (
                <p className="text-xs text-blue-600 mt-1">
                  {merchantInfo.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Remember Merchant */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMerchant}
            onChange={(e) => setRememberMerchant(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="remember" className="text-sm cursor-pointer">
            Remember this merchant for future transactions
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={!selectedCategory}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept & Continue
          </Button>
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
