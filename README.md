# SMB Owner - Bank Statement Analyzer

A powerful, production-ready web application that helps small business owners convert PDF bank statements to CSV, automatically categorize transactions, and generate corporate business reports.

**Live Demo:** [https://smbowner.vercel.app/](https://smbowner.vercel.app/)

## Features

- **Multi-Bank PDF Support**: Automatically detects and parses bank statements from **17+ banks**:
  - 🇨🇦 **Canadian Banks**: RBC, TD Canada Trust, BMO, Scotiabank, CIBC, Canadian Tire Bank
  - 🇺🇸 **American Banks**: Bank of America, Chase, Citibank, Capital One
  - 🌏 **International Banks**: DBS/POSB, HSBC, Maybank, OCBC, UOB, Standard Chartered, and more
- **FREE Local Processing**: No paid API required - all PDF parsing happens locally on your server
- **Automatic Bank Detection**: Intelligently identifies your bank and uses the appropriate parser
- **🤖 Intelligent Categorization** (100% FREE): Automatic transaction categorization with multiple strategies:
  - **Smart Pattern Matching** - 100+ built-in merchant patterns (e.g., "Starbucks" → "Meals & entertainment")
  - **Brand Recognition** - Knows major chains: McDonald's, Walmart, Shell, Amazon, Netflix, Uber, and more
  - **User Learning** - Remembers your manual categorizations for future use
  - **Keyword Matching** - Fallback for unknown merchants
  - **MCC Codes** - Industry-standard merchant category codes
  - **Confidence Scoring** - Know how certain the categorization is
  - **No API costs** - All categorization runs locally, completely free
- **Interactive Review**: Review and approve categorized transactions with merchant context
- **Merchant Learning**: System remembers your categorization preferences
- **Excel Export**: Generate formatted corporate business reports using ExcelJS
- **Persistent Storage**: Your merchant rules are saved locally for future use
- **Privacy First**: Bank statements never leave your server - all processing is local
- **Security Features**:
  - Local PDF processing (no third-party uploads)
  - Rate limiting on all API routes
  - Input validation and file size limits
  - Error boundaries for graceful failure handling

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Python 3.10+** - PDF parsing with Monopoly library
- **Monopoly** - Multi-bank PDF statement parser (17+ banks supported)
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **ExcelJS** - Secure Excel file generation
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+**
- **System Dependencies** (for PDF processing):
  - macOS: `brew install poppler pkg-config`
  - Ubuntu/Debian: `apt-get install build-essential libpoppler-cpp-dev pkg-config`
  - Other: See [Monopoly installation docs](https://github.com/benjamin-awd/monopoly)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/dareogunewu/smbowner.git
cd smbowner
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip3 install monopoly-core pdftotext pymupdf
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

### Deploy to Vercel (Recommended)

1. **Ensure Python Runtime**: Vercel supports Python via serverless functions. The app automatically uses Python 3.11 runtime.

2. Push your code to GitHub

3. Import project in Vercel dashboard

4. **No environment variables needed** - all PDF processing is local!

5. Deploy!

### System Requirements for Production

- **Node.js 18+** runtime
- **Python 3.10+** runtime (automatically provided by Vercel)
- **poppler** library (configure in `vercel.json` or use Docker)

### Alternative: Docker Deployment

For full control over dependencies:

```bash
# Use the included Dockerfile (TODO: create)
docker build -t smbowner .
docker run -p 3000:3000 smbowner
```

**Note:** No API keys or external services required! All processing is local and free.

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Supported Banks

The app supports **17+ banks** using the Monopoly library:

| Bank | Country | Credit | Debit |
|------|---------|--------|-------|
| Royal Bank of Canada (RBC) | 🇨🇦 Canada | ✅ | ✅ |
| TD Canada Trust | 🇨🇦 Canada | ✅ | ✅ |
| Bank of Montreal (BMO) | 🇨🇦 Canada | ✅ | ✅ |
| Scotiabank | 🇨🇦 Canada | ✅ | ✅ |
| CIBC | 🇨🇦 Canada | ✅ | ✅ |
| Canadian Tire Bank | 🇨🇦 Canada | ✅ | ❌ |
| Bank of America | 🇺🇸 USA | ✅ | ✅ |
| Chase | 🇺🇸 USA | ✅ | ❌ |
| Citibank | 🇺🇸 USA | ✅ | ❌ |
| Capital One | 🇺🇸 USA | ✅ | ❌ |
| DBS/POSB | 🇸🇬 Singapore | ✅ | ✅ |
| OCBC | 🇸🇬 Singapore | ✅ | ✅ |
| UOB | 🇸🇬 Singapore | ✅ | ✅ |
| HSBC | International | ✅ | ❌ |
| Maybank | 🇲🇾 Malaysia | ✅ | ✅ |
| Standard Chartered | International | ✅ | ❌ |
| Other Banks | Generic Parser | ✅ | ✅ |

**Note:** If your bank isn't recognized, the app uses a generic parser that works with most statement formats.

## Production Checklist

- [x] **FREE** local PDF processing (no paid APIs!)
- [x] Multi-bank support (17+ banks)
- [x] Automatic bank detection
- [x] Privacy-first (no data sent to third parties)
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

## Security & Privacy

- **Local Processing**: PDF statements never leave your server - no third-party API calls
- **No API Keys Required**: Zero external dependencies for PDF parsing
- **Rate Limiting**: 5 uploads/minute, 10 API requests/minute per IP
- **Input Validation**: File type and size validation
- **Error Handling**: Graceful error boundaries prevent crashes
- **Dependencies**: Regular security audits, no known vulnerabilities
- **Privacy First**: Your financial data stays on your server

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

### v2.0.0 (2025-12-28) - Major Update: FREE Multi-Bank Support! 🎉
- ✅ **Replaced paid API with FREE local PDF parsing**
- ✅ **Multi-bank support**: 17+ banks including all major Canadian & US banks
- ✅ **Automatic bank detection**: Intelligently identifies RBC, TD, BMO, Chase, etc.
- ✅ **Privacy enhanced**: All processing is local, no data sent to third parties
- ✅ **Cost savings**: No API subscription needed
- ✅ **Python integration**: Uses Monopoly library for robust PDF parsing
- ✅ **Better accuracy**: Bank-specific parsers for each institution

### v1.0.0 (2024-12-24)
- ✅ Initial production release
- ✅ Secure API key management
- ✅ Rate limiting on all routes
- ✅ Security vulnerability fixes (replaced xlsx with exceljs)
- ✅ Error boundaries
- ✅ Privacy policy and terms
- ✅ Production deployment to Vercel

---

Built with ❤️ for small business owners
