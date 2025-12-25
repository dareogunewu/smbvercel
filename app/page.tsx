"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { FileUpload } from "@/components/FileUpload";
import { TransactionTable } from "@/components/TransactionTable";
import { CategoryReview } from "@/components/CategoryReview";
import { ReportGenerator } from "@/components/ReportGenerator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Trash2, Upload as UploadIcon, Calendar, CalendarDays, Check } from "lucide-react";

export default function Home() {
  const {
    transactions,
    setTransactions,
    clearTransactions,
    uploadStatus,
    setUploadStatus,
    errorMessage,
    merchantRules,
    isMultiMonthMode,
    setMultiMonthMode,
  } = useStore();

  const [showReview, setShowReview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

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
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Upload bank statements, categorize transactions, and generate reports
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

          {/* Mode Toggle */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Upload Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    {isMultiMonthMode
                      ? "Multiple statements will be combined for year-end reporting"
                      : "Each upload replaces previous data (single statement)"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setMultiMonthMode(false)}
                    variant={!isMultiMonthMode ? "default" : "outline"}
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Single
                  </Button>
                  <Button
                    onClick={() => setMultiMonthMode(true)}
                    variant={isMultiMonthMode ? "default" : "outline"}
                    size="sm"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Multi-Month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Another + Finish Session buttons */}
          {transactions.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  {isMultiMonthMode && (
                    <Button
                      onClick={() => setShowUpload(!showUpload)}
                      variant="outline"
                      className="flex-1"
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Another Statement
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const message = isMultiMonthMode
                        ? "Finish this session and start a new one? Current data will be cleared."
                        : "Finish this session and start a new one? Current data will be cleared.";
                      if (confirm(message)) {
                        clearTransactions();
                        setShowUpload(false);
                      }
                    }}
                    variant="default"
                    className={isMultiMonthMode ? "bg-green-600 hover:bg-green-700" : "flex-1 bg-green-600 hover:bg-green-700"}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Finish Session
                  </Button>
                </div>
                {showUpload && isMultiMonthMode && (
                  <div className="mt-4">
                    <FileUpload />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

    </div>
  );
}
