"use client";

import Link from "next/link";
import { Github, Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SMB Owner
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simplifying financial reporting for small business owners
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/dareogunewu/smbowner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground font-medium">
            © {currentYear} SMB Owner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
