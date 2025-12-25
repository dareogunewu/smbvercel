"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SMB Owner
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                isActive("/")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/privacy"
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                isActive("/privacy")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                isActive("/terms")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              Terms
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href="https://github.com/dareogunewu/smbowner"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-semibold text-primary border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all shadow-sm hover:shadow-md"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
