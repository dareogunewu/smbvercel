#!/usr/bin/env python3
"""
PDF Bank Statement Parser using Monopoly library
Converts PDF bank statements to CSV/JSON format with automatic bank detection
"""

import sys
import json
import argparse
from pathlib import Path
from monopoly.banks import BankDetector, banks
from monopoly.generic import GenericBank
from monopoly.pdf import PdfDocument, PdfParser, MissingOCRError
from monopoly.pipeline import Pipeline
from monopoly.statements.base import SafetyCheckError


def parse_statement(pdf_path: str, output_format: str = "json") -> dict:
    """
    Parse a bank statement PDF and return transaction data

    Args:
        pdf_path: Path to the PDF file
        output_format: Output format - "json" or "csv"

    Returns:
        Dictionary with bank name, transactions, and metadata
    """
    try:
        # Load PDF document
        document = PdfDocument(pdf_path)

        # Detect bank automatically
        analyzer = BankDetector(document)
        detected_bank = analyzer.detect_bank(banks) or GenericBank
        bank_name = detected_bank.__name__

        # Parse the document
        parser = PdfParser(detected_bank, document)
        pipeline = Pipeline(parser)

        try:
            # Extract statement data (skip safety check initially)
            statement = pipeline.extract(safety_check=False)

            # Perform safety check separately to handle errors gracefully
            safety_check_passed = True
            if statement.config.safety_check:
                try:
                    statement.perform_safety_check()
                except SafetyCheckError:
                    safety_check_passed = False

            # Transform to structured data
            transactions = pipeline.transform(statement)

            # Convert to list of dicts
            transaction_list = []
            for txn in transactions:
                # Transaction objects are Pydantic models, use attribute access
                transaction_list.append({
                    "date": str(getattr(txn, "date", "")),
                    "description": getattr(txn, "description", ""),
                    "amount": float(getattr(txn, "amount", 0)),
                })

            return {
                "success": True,
                "bank": bank_name,
                "transactions": transaction_list,
                "metadata": {
                    "total_transactions": len(transaction_list),
                    "safety_check_passed": safety_check_passed,
                    "statement_type": statement.config.statement_type if hasattr(statement.config, 'statement_type') else "unknown"
                }
            }

        except MissingOCRError:
            return {
                "success": False,
                "error": "PDF requires OCR processing. The PDF appears to be scanned and contains no extractable text.",
                "bank": bank_name
            }

    except FileNotFoundError:
        return {
            "success": False,
            "error": f"PDF file not found: {pdf_path}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse PDF: {str(e)}",
            "error_type": type(e).__name__
        }


def main():
    parser = argparse.ArgumentParser(
        description="Parse bank statement PDF and extract transactions"
    )
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument(
        "--format",
        choices=["json", "csv"],
        default="json",
        help="Output format (default: json)"
    )

    args = parser.parse_args()

    # Parse the statement
    result = parse_statement(args.pdf_path, args.format)

    # Output as JSON
    print(json.dumps(result, indent=2))

    # Exit with appropriate code
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()
