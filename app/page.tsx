"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { FileUpload } from "@/components/FileUpload";
import { TransactionTable } from "@/components/TransactionTable";
import { CategoryReview } from "@/components/CategoryReview";
import { ReportGenerator } from "@/components/ReportGenerator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export default function Home() {
  const {
    transactions,
    setTransactions,
    uploadStatus,
    setUploadStatus,
    errorMessage,
    merchantRules,
  } = useStore();

  const [showReview, setShowReview] = useState(false);

  // Categorize transactions when they're loaded
  useEffect(() => {
    if (transactions.length > 0 && uploadStatus === "complete") {
      // Check if transactions need categorization
      const needsCategorization = transactions.some((t) => !t.category);

      if (needsCategorization) {
        setUploadStatus("processing");

        // Categorize transactions
        const categorized = batchCategorizeTransactions(
          transactions,
          merchantRules
        );

        setTransactions(categorized);

        // Check if any need review
        const needsReview = categorized.some((t) => t.needsReview);
        if (needsReview) {
          setShowReview(true);
        }

        setUploadStatus("complete");
      }
    }
  }, [transactions, uploadStatus, merchantRules, setTransactions, setUploadStatus]);

  const needsReview = transactions.filter((t) => t.needsReview).length;
  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          SMB Owner
        </h1>
        <p className="text-lg text-gray-600">
          Convert bank statements, categorize transactions, generate reports
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Banner */}
      {transactions.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-lg">
                    {transactions.length} transactions loaded
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {categorized} categorized
                    {needsReview > 0 && ` • ${needsReview} need review`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {uploadStatus === "processing" && (
                  <Badge variant="secondary">Processing...</Badge>
                )}
                {uploadStatus === "complete" && categorized === transactions.length && (
                  <Badge variant="success">All categorized!</Badge>
                )}
                {needsReview > 0 && (
                  <Badge variant="warning">{needsReview} to review</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload and Review */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          {transactions.length === 0 && <FileUpload />}

          {/* Category Review */}
          {showReview && needsReview > 0 && (
            <CategoryReview
              transactions={transactions}
              onComplete={() => setShowReview(false)}
            />
          )}

          {/* Transactions Table */}
          {transactions.length > 0 && (
            <TransactionTable transactions={transactions} />
          )}
        </div>

        {/* Right Column - Report Generator */}
        <div className="space-y-6">
          {transactions.length > 0 && (
            <ReportGenerator transactions={transactions} />
          )}

          {/* Help Card */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold">How it works</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Upload your PDF bank statement</li>
                <li>We convert it to CSV and categorize transactions</li>
                <li>Review and approve any uncertain categories</li>
                <li>Generate your corporate business report</li>
              </ol>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Secure Processing</p>
                  <p className="text-xs">
                    Your bank statements are processed securely. PDF conversion happens server-side to protect your data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p className="mb-2">
          SMB Owner - Simplifying financial reporting for small business owners
        </p>
        <div className="flex justify-center gap-4">
          <a href="/privacy" className="hover:text-gray-700 underline">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-gray-700 underline">
            Terms of Service
          </a>
          <span>•</span>
          <a
            href="https://github.com/dareogunewu/smbowner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
