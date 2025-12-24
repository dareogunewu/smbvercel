# SMB Owner - Bank Statement Analyzer

A powerful, production-ready web application that helps small business owners convert PDF bank statements to CSV, automatically categorize transactions, and generate corporate business reports.

**Live Demo:** [https://smbowner.vercel.app/](https://smbowner.vercel.app/)

## Features

- **PDF Upload & Conversion**: Drag-and-drop PDF bank statements with seamless conversion to CSV
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
  - Server-side API key management
  - Rate limiting on all API routes
  - Input validation and file size limits
  - Error boundaries for graceful failure handling

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **ExcelJS** - Secure Excel file generation (replaced xlsx for security)
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API key from [bankstatementconverter.com](https://bankstatementconverter.com/)

### Local Development

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
```env
# IMPORTANT: No NEXT_PUBLIC_ prefix - server-side only for security
BANK_STATEMENT_CONVERTER_API_KEY=your_actual_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Import project in Vercel dashboard

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `BANK_STATEMENT_CONVERTER_API_KEY` with your API key
   - **Important:** Use `BANK_STATEMENT_CONVERTER_API_KEY` (without `NEXT_PUBLIC_` prefix)

4. Deploy!

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BANK_STATEMENT_CONVERTER_API_KEY` | API key for PDF conversion service | Yes | `api-xxxxx` |

**Security Note:** Never use the `NEXT_PUBLIC_` prefix for API keys. This exposes them in the client-side bundle.

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Production Checklist

- [x] API keys secured server-side
- [x] Rate limiting implemented
- [x] Input validation and sanitization
- [x] File upload size limits (10MB)
- [x] Error boundaries
- [x] ESLint enabled and passing
- [x] Security vulnerabilities fixed
- [x] Privacy policy and terms of service
- [x] Production build tested

## Usage

1. **Upload PDF**: Drag and drop your PDF bank statement or click to select
2. **Convert**: The app automatically converts the PDF to CSV securely on the server
3. **Review**: Check the categorized transactions - low confidence items are highlighted
4. **Approve**: Accept suggested categories or modify as needed
5. **Export**: Generate your corporate business report in Excel format

## Project Structure

```
smbowner/
├── app/
│   ├── api/              # API routes with rate limiting
│   │   ├── convert/      # PDF to CSV conversion
│   │   ├── categorize/   # Transaction categorization
│   │   └── search-merchant/ # Merchant lookup
│   ├── privacy/          # Privacy policy page
│   ├── terms/            # Terms of service page
│   ├── layout.tsx        # Root layout with error boundary
│   └── page.tsx          # Main application page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── ErrorBoundary.tsx # Error handling component
│   └── ...               # Custom components
├── lib/
│   ├── categories.ts     # Category database
│   ├── categorization.ts # Categorization engine
│   ├── rate-limit.ts     # Rate limiting logic
│   ├── store.ts          # Zustand store
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## Security

- **API Keys**: Stored server-side only, never exposed to client
- **Rate Limiting**: 5 uploads/minute, 10 API requests/minute per IP
- **Input Validation**: File type and size validation
- **Error Handling**: Graceful error boundaries prevent crashes
- **Dependencies**: Regular security audits, no known vulnerabilities

## Performance

- **Bundle Size**: ~241 KB first load
- **Static Generation**: Pre-rendered pages for optimal performance
- **Server-Side Processing**: PDF conversion happens server-side for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Build to verify: `npm run build`
6. Submit a pull request

## License

MIT

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/dareogunewu/smbowner/issues)
- Review our [Privacy Policy](/privacy)
- Read our [Terms of Service](/terms)

## Changelog

### v1.0.0 (2025-12-24)
- ✅ Initial production release
- ✅ Secure API key management
- ✅ Rate limiting on all routes
- ✅ Security vulnerability fixes (replaced xlsx with exceljs)
- ✅ Error boundaries
- ✅ Privacy policy and terms
- ✅ Production deployment to Vercel

---

Built with ❤️ for small business owners
