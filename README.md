# SMB Owner - Vercel Edition (RBC Only)

A production-ready web application for RBC (Royal Bank of Canada) customers to convert PDF bank statements to CSV, automatically categorize transactions, and generate corporate business reports.

**Note:** This is the Vercel-optimized version that supports RBC statements only. For multi-bank support (17+ banks), see [smbowner (Railway)](https://github.com/dareogunewu/smbowner).

## Features

- **RBC PDF Upload & Conversion**: Drag-and-drop RBC bank statements with FREE local parsing
  - Credit Card (Visa)
  - Chequing
  - Savings
- **Smart Categorization**: AI-powered transaction categorization using:
  - Keyword matching
  - MCC (Merchant Category Code) detection
  - Web search fallback for unknown merchants
  - Confidence scoring
- **Interactive Review**: Review and approve categorized transactions with merchant context
- **Merchant Learning**: System remembers your categorization preferences
- **Excel Export**: Generate formatted corporate business reports using ExcelJS
- **Persistent Storage**: Your merchant rules are saved locally for future use
- **Security Features**:
  - No API keys needed - 100% local processing
  - Rate limiting on all API routes
  - Input validation and file size limits
  - Error boundaries for graceful failure handling

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **ExcelJS** - Secure Excel file generation
- **Zod** - Schema validation
- **Python** - RBC statement parser (pdfminer.six)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for PDF parsing)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/dareogunewu/smbvercel.git
cd smbvercel
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

4. Copy the environment file (optional - no API keys needed):
```bash
cp .env.local.example .env.local
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dareogunewu/smbvercel)

1. Push to GitHub
2. Import to Vercel
3. Deploy - no environment variables needed!

Vercel will automatically:
- Install Node.js dependencies
- Install Python dependencies from requirements.txt
- Build and deploy your application

## RBC Statement Support

This version uses the [rbc-statement-to-csv](https://github.com/mindcruzer/rbc-statement-to-csv) converter, which supports:

### Credit Card (Visa)
- Transaction Date
- Posting Date
- Description
- Credit/Debit amounts
- Foreign Currency support
- Exchange Rate

### Chequing & Savings
- Date
- Description
- Withdrawals
- Deposits
- Balance

## Project Structure

```
smbvercel/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── convert/       # PDF conversion endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── api/                   # Python API functions
│   └── parse_rbc.py       # RBC PDF parser
├── components/            # React components
├── lib/                   # Utilities and helpers
├── requirements.txt       # Python dependencies
└── vercel.json           # Vercel configuration
```

## Security

- ✅ No third-party APIs - all processing is local
- ✅ No API keys to manage
- ✅ Rate limiting (5 uploads/min)
- ✅ CSRF protection
- ✅ File validation (type, size)
- ✅ Error boundaries
- ✅ Zero vulnerabilities (npm audit clean)

## For Multi-Bank Support

If you need support for banks other than RBC, check out the [Railway version](https://github.com/dareogunewu/smbowner) which supports 17+ banks:

**Canadian**: RBC, TD, BMO, Scotiabank, CIBC
**American**: Bank of America, Chase, Citibank, Capital One, Wells Fargo, US Bank
**European**: N26, Revolut, and more

## License

MIT License - See LICENSE file for details

## Credits

- RBC Parser: Based on [rbc-statement-to-csv](https://github.com/mindcruzer/rbc-statement-to-csv) by mindcruzer
- Built with [Next.js](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), and [Vercel](https://vercel.com/)
