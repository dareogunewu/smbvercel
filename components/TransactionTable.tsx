"use client";

import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return null;
  }

  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;
  const needsReview = transactions.filter((t) => t.needsReview).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          {categorized} of {transactions.length} categorized
          {needsReview > 0 && ` • ${needsReview} need review`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      transaction.needsReview ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-md truncate">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.category || "Uncategorized"}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        transaction.type === "credit" || transaction.amount > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {transaction.needsReview ? (
                        <Badge variant="warning">Review</Badge>
                      ) : transaction.confidence !== undefined &&
                        transaction.confidence >= 0.8 ? (
                        <Badge variant="success">
                          {Math.round(transaction.confidence * 100)}%
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {Math.round((transaction.confidence || 0) * 100)}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
