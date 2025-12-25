"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, FileText, Shield, Scale } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SMB Owner</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/") ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <FileText className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/privacy"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/privacy") ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <Shield className="h-4 w-4" />
              Privacy
            </Link>
            <Link
              href="/terms"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-600 ${
                isActive("/terms") ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <Scale className="h-4 w-4" />
              Terms
            </Link>
          </nav>

          {/* Mobile Menu Icon (optional - can expand later) */}
          <div className="md:hidden">
            <a
              href="https://github.com/dareogunewu/smbowner"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
