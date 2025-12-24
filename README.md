# SMB Owner - Bank Statement Analyzer

A powerful web application that helps small business owners convert PDF bank statements to CSV, automatically categorize transactions, and generate corporate business reports.

## Features

- **PDF Upload & Conversion**: Drag-and-drop PDF bank statements with seamless conversion to CSV
- **Smart Categorization**: AI-powered transaction categorization using:
  - Keyword matching
  - MCC (Merchant Category Code) detection
  - Web search fallback for unknown merchants
  - Confidence scoring
- **Interactive Review**: Review and approve categorized transactions with merchant context
- **Merchant Learning**: System remembers your categorization preferences
- **Excel Export**: Generate formatted corporate business reports matching your template
- **Persistent Storage**: Your merchant rules are saved locally for future use

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **xlsx** - Excel file generation
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API key from [bankstatementconverter.com](https://bankstatementconverter.com/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dareogunewu/smbowner.git
cd smbowner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:
```
NEXT_PUBLIC_BANK_STATEMENT_CONVERTER_API_KEY=your_actual_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload PDF**: Drag and drop your PDF bank statement or click to select
2. **Convert**: The app automatically converts the PDF to CSV using bankstatementconverter.com
3. **Review**: Check the categorized transactions - low confidence items are highlighted
4. **Approve**: Accept suggested categories or modify as needed
5. **Export**: Generate your corporate business report in Excel format

## Project Structure

```
smbowner/
├── app/
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main application page
├── components/
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/
│   ├── categories.ts     # Category database
│   ├── categorization.ts # Categorization engine
│   ├── store.ts          # Zustand store
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
