"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { FileUpload } from "@/components/FileUpload";
import { TransactionTable } from "@/components/TransactionTable";
import { CategoryReview } from "@/components/CategoryReview";
import { ReportGenerator } from "@/components/ReportGenerator";
import { LoginPage } from "@/components/LoginPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MerchantRulesManager } from "@/components/MerchantRulesManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Upload as UploadIcon,
  Calendar,
  CalendarDays,
  Check,
  LogOut,
  RotateCcw,
  Clock,
} from "lucide-react";
import { isAuthenticated, clearAuth } from "@/lib/auth";

export default function Home() {
  const {
    transactions,
    setTransactions,
    clearTransactions,
    uploadStatus,
    setUploadStatus,
    uploadStep,
    setUploadStep,
    errorMessage,
    merchantRules,
    isMultiMonthMode,
    setMultiMonthMode,
    fileName,
    lastLoadedAt,
  } = useStore();

  const [showReview, setShowReview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  // Categorize via API (enables Claude Haiku AI for unknown merchants)
  useEffect(() => {
    if (uploadStatus !== "complete") return;

    const current = useStore.getState();
    const txns = current.transactions;
    if (txns.length === 0) return;

    const needsCategorization = txns.some((t) => !t.category);
    if (!needsCategorization) {
      if (txns.some((t) => t.needsReview)) setShowReview(true);
      return;
    }

    current.setUploadStatus("processing");
    current.setUploadStep("Matching known merchants...");

    fetch("/api/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions: txns, merchantRules: current.merchantRules }),
    })
      .then((r) => {
        useStore.getState().setUploadStep("AI categorizing unknown transactions...");
        return r.json();
      })
      .then((data) => {
        if (data.success) {
          useStore.getState().setTransactions(data.transactions);
          if (data.transactions.some((t: typeof txns[0]) => t.needsReview)) {
            setShowReview(true);
          }
        }
        useStore.getState().setUploadStatus("complete");
        useStore.getState().setUploadStep("");
      })
      .catch(() => {
        useStore.getState().setUploadStatus("complete");
        useStore.getState().setUploadStep("");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadStatus]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out? Your session will end.")) {
      clearAuth();
      setIsLoggedIn(false);
    }
  };

  const needsReview = transactions.filter((t) => t.needsReview).length;
  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;

  const sessionAge = lastLoadedAt
    ? Math.round((Date.now() - lastLoadedAt) / 60000)
    : null;

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Upload bank statements, categorize transactions, generate reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MerchantRulesManager />
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

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

      {transactions.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">
                    {transactions.length} transactions
                    {fileName && (
                      <span className="text-muted-foreground font-normal"> from {fileName}</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    {categorized} categorized
                    {needsReview > 0 && ` • ${needsReview} need review`}
                    {sessionAge !== null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sessionAge < 1 ? "just now" : `${sessionAge}m ago`}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {uploadStatus === "processing" && (
                  <Badge variant="secondary">{uploadStep || "AI categorizing..."}</Badge>
                )}
                {uploadStatus === "complete" && categorized === transactions.length && (
                  <Badge variant="success">All categorized</Badge>
                )}
                {needsReview > 0 && (
                  <Badge variant="warning">{needsReview} to review</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {transactions.length === 0 && <FileUpload />}

          {/* Mode Toggle */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">Upload Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    {isMultiMonthMode
                      ? "Multiple statements combined for year-end reporting"
                      : "Each upload replaces previous data"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => setMultiMonthMode(false)}
                    variant={!isMultiMonthMode ? "default" : "outline"}
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" />
                    Single
                  </Button>
                  <Button
                    onClick={() => setMultiMonthMode(true)}
                    variant={isMultiMonthMode ? "default" : "outline"}
                    size="sm"
                  >
                    <CalendarDays className="h-4 w-4 mr-1.5" />
                    Multi-Month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {transactions.length > 0 && (
            <div className="flex gap-3">
              {isMultiMonthMode && (
                <Button
                  onClick={() => setShowUpload(!showUpload)}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload Another Statement
                </Button>
              )}
              <Button
                onClick={() => {
                  if (confirm("Clear all transactions and start fresh?")) {
                    clearTransactions();
                    setShowUpload(false);
                    setShowReview(false);
                  }
                }}
                variant="outline"
                size="sm"
                className={isMultiMonthMode ? "" : "flex-1"}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Statement
              </Button>
              {!isMultiMonthMode && (
                <Button
                  onClick={() => {
                    if (confirm("Finish this session?")) {
                      clearTransactions();
                      setShowReview(false);
                    }
                  }}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Finish Session
                </Button>
              )}
            </div>
          )}

          {showUpload && isMultiMonthMode && (
            <FileUpload />
          )}

          {showReview && needsReview > 0 && (
            <ErrorBoundary>
              <CategoryReview
                transactions={transactions}
                onComplete={() => setShowReview(false)}
              />
            </ErrorBoundary>
          )}

          <ErrorBoundary>
            {transactions.length > 0 && (
              <TransactionTable transactions={transactions} />
            )}
          </ErrorBoundary>
        </div>

        <div className="space-y-4">
          <ErrorBoundary>
            <ReportGenerator transactions={transactions} />
          </ErrorBoundary>

          {transactions.length === 0 && (
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold">How it works</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Upload your PDF bank statement</li>
                  <li>AI categorizes every transaction automatically</li>
                  <li>Review & correct anything uncertain</li>
                  <li>Export your corporate business report</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
