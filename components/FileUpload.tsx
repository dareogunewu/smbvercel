"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateFile, sanitizeFileName, checkClientRateLimit } from "@/lib/sanitize";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { setFileName, setUploadStatus, setErrorMessage } = useStore();

  const handleFileSelection = useCallback(async (file: File) => {
    const { addTransactions } = useStore.getState();

    // Rate limiting check
    if (!checkClientRateLimit('file-upload', 5, 60000)) {
      setErrorMessage("Too many upload attempts. Please wait a minute and try again.");
      return;
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Invalid file");
      return;
    }

    // Sanitize filename
    const sanitizedName = sanitizeFileName(file.name);
    setFileName(sanitizedName);
    setUploadStatus("uploading");
    setErrorMessage(null);

    try {
      // Step 1: Convert PDF to CSV
      const formData = new FormData();
      formData.append("file", file);

      const convertResponse = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!convertResponse.ok) {
        throw new Error("Failed to convert PDF");
      }

      const convertData = await convertResponse.json();

      if (!convertData.success || !convertData.transactions) {
        throw new Error("Invalid response from conversion API");
      }

      // Step 2: Add transactions (append to existing, they'll be categorized by the page component)
      addTransactions(convertData.transactions);
      setUploadStatus("complete");
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload file"
      );
      setUploadStatus("error");
    }
  }, [setFileName, setUploadStatus, setErrorMessage]);

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

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((file) => file.type === "application/pdf");

      if (pdfFile) {
        handleFileSelection(pdfFile);
      } else {
        setErrorMessage("Please upload a PDF file");
      }
    },
    [handleFileSelection, setErrorMessage]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  const handleClear = () => {
    setFileName(null);
    setUploadStatus("idle");
    setErrorMessage(null);
  };

  const { fileName, uploadStatus } = useStore();

  if (fileName && uploadStatus !== "idle") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {uploadStatus === "uploading" && "Uploading..."}
                  {uploadStatus === "converting" && "Converting PDF to CSV..."}
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
            <p className="text-lg font-medium">
              Drop your PDF bank statement here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse files
            </p>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </CardContent>
    </Card>
  );
}
