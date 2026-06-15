"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { getCategoryByName, getAllCategoryNames } from "@/lib/categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Download, X } from "lucide-react";

export function MerchantRulesManager() {
  const { merchantRules, deleteMerchantRule, clearMerchantRules, addMerchantRule } = useStore();
  const [open, setOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<string | null>(null);
  const allCategories = getAllCategoryNames();

  const handleExport = () => {
    const json = JSON.stringify(merchantRules, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merchant-rules.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCategoryChange = (merchantName: string, category: string) => {
    addMerchantRule({ merchantName, category, timestamp: Date.now() });
    setEditingMerchant(null);
  };

  const sorted = [...merchantRules].sort((a, b) =>
    a.merchantName.localeCompare(b.merchantName)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Rules
          {merchantRules.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {merchantRules.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Merchant Categorization Rules</DialogTitle>
        </DialogHeader>

        {merchantRules.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-center">
            <div>
              <p className="text-muted-foreground text-sm">No rules yet.</p>
              <p className="text-muted-foreground text-xs mt-1">
                Rules are created when you correct a transaction&apos;s category.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {merchantRules.length} rule{merchantRules.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                  onClick={() => {
                    if (confirm("Delete all rules? This cannot be undone.")) {
                      clearMerchantRules();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Merchant</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((rule) => {
                    const icon = getCategoryByName(rule.category)?.icon ?? "";
                    return (
                      <tr key={rule.merchantName} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-medium">{rule.merchantName}</td>
                        <td className="px-3 py-2.5">
                          {editingMerchant === rule.merchantName ? (
                            <Select
                              value={rule.category}
                              onValueChange={(v) => handleCategoryChange(rule.merchantName, v)}
                              open
                              onOpenChange={(o) => !o && setEditingMerchant(null)}
                            >
                              <SelectTrigger className="h-7 text-xs w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {allCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {getCategoryByName(cat)?.icon ?? ""} {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <button
                              className="hover:underline text-left"
                              onClick={() => setEditingMerchant(rule.merchantName)}
                            >
                              {icon} {rule.category}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => deleteMerchantRule(rule.merchantName)}
                            className="text-muted-foreground hover:text-red-600"
                            title="Delete rule"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
