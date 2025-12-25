"use client";

import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle } from "lucide-react";
import { verifyPasskey, setAuth } from "@/lib/auth";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const isValid = await verifyPasskey(passkey);

      if (isValid) {
        setAuth();
        onLogin();
      } else {
        setError("Invalid passkey. Please try again.");
        setPasskey("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">SMB Owner</CardTitle>
          <CardDescription className="text-base mt-2">
            Bank Statement Analyzer
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passkey" className="block text-sm font-medium mb-2">
                Enter Passkey
              </label>
              <Input
                id="passkey"
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter your passkey"
                className="w-full"
                autoFocus
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !passkey}
            >
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>Secure access to your financial data</p>
              <p className="mt-1">Sessions expire after 24 hours</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
