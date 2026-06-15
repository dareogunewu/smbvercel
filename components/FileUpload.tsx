"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateFile, sanitizeFileName, checkClientRateLimit } from "@/lib/sanitize";
import Papa from "papaparse";

interface CsvTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
}

function parseCsvTransactions(text: string): CsvTransaction[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .map((row) => {
      const date = row["date"] || row["transaction date"] || row["posted date"] || "";
      const description = row["description"] || row["memo"] || row["payee"] || row["name"] || "";
      const amountRaw = row["amount"] || row["debit"] || row["credit"] || "";
      const amount = parseFloat(amountRaw.replace(/[$,]/g, ""));
      if (!date || !description || isNaN(amount)) return null;
      return {
        id: crypto.randomUUID(),
        date: date.trim(),
        description: description.trim(),
        amount,
        type: (amount >= 0 ? "credit" : "debit") as "debit" | "credit",
      };
    })
    .filter((t): t is CsvTransaction => t !== null);
}

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [incompleteWarning, setIncompleteWarning] = useState(false);
  const { setFileName, setUploadStatus, setErrorMessage } = useStore();

  const handleCsvFile = useCallback(async (file: File) => {
    const { addTransactions } = useStore.getState();
    const text = await file.text();
    const transactions = parseCsvTransactions(text);
    if (transactions.length === 0) {
      setErrorMessage("Could not read any transactions from this CSV. Check column headers (date, description, amount).");
      setUploadStatus("error");
      return;
    }
    const sanitizedName = sanitizeFileName(file.name);
    setFileName(sanitizedName);
    addTransactions(transactions);
    setUploadStatus("complete");
    if (transactions.length < 5) setIncompleteWarning(true);
  }, [setFileName, setUploadStatus, setErrorMessage]);

  const handlePdfFile = useCallback(async (file: File) => {
    const { addTransactions } = useStore.getState();
    const sanitizedName = sanitizeFileName(file.name);
    setFileName(sanitizedName);
    setUploadStatus("uploading");
    setErrorMessage(null);
    setIncompleteWarning(false);

    const formData = new FormData();
    formData.append("file", file);

    const convertResponse = await fetch("/api/convert", {
      method: "POST",
      body: formData,
    });

    if (!convertResponse.ok) {
      const err = await convertResponse.json().catch(() => ({}));
      throw new Error(err.error || "Failed to convert PDF");
    }

    const convertData = await convertResponse.json();

    if (!convertData.success || !convertData.transactions) {
      throw new Error("Invalid response from conversion API");
    }

    addTransactions(convertData.transactions);
    setUploadStatus("complete");

    if (convertData.confidence === "partial") {
      setIncompleteWarning(true);
    }
  }, [setFileName, setUploadStatus, setErrorMessage]);

  const handleFileSelection = useCallback(async (file: File) => {
    if (!checkClientRateLimit("file-upload", 5, 60000)) {
      setErrorMessage("Too many upload attempts. Please wait a minute and try again.");
      return;
    }

    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
    if (isCsv) {
      await handleCsvFile(file);
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file");
      return;
    }

    try {
      await handlePdfFile(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload file");
      setUploadStatus("error");
    }
  }, [handleCsvFile, handlePdfFile, setErrorMessage, setUploadStatus]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find(
        (f) => f.type === "application/pdf" || f.type === "text/csv" || f.name.endsWith(".csv")
      );
      if (file) {
        handleFileSelection(file);
      } else {
        setErrorMessage("Please upload a PDF or CSV file");
      }
    },
    [handleFileSelection, setErrorMessage]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelection(file);
    },
    [handleFileSelection]
  );

  const handleClear = () => {
    setFileName(null);
    setUploadStatus("idle");
    setErrorMessage(null);
    setIncompleteWarning(false);
  };

  const { fileName, uploadStatus } = useStore();

  if (fileName && uploadStatus !== "idle") {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {uploadStatus === "uploading" && "Uploading..."}
                  {uploadStatus === "converting" && "Converting..."}
                  {uploadStatus === "processing" && "Categorizing transactions..."}
                  {uploadStatus === "complete" && "Processing complete"}
                  {uploadStatus === "error" && "Upload failed"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {incompleteWarning && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Only a few transactions were found — the PDF may use a non-standard format.
                Try exporting as CSV from your bank and uploading that instead.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        isDragging && "border-primary bg-primary/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="pt-6">
        <label className="flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[200px]">
          <Upload
            className={cn(
              "h-12 w-12 text-muted-foreground transition-colors",
              isDragging && "text-primary"
            )}
          />
          <div className="text-center">
            <p className="text-lg font-medium">Drop your bank statement here</p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF or CSV · or click to browse
            </p>
          </div>
          <input
            type="file"
            accept="application/pdf,.pdf,text/csv,.csv"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </CardContent>
    </Card>
  );
}
