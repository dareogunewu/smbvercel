#!/usr/bin/env python3
"""
Simple RBC statement parser for Vercel serverless functions
Converts RBC PDF statements to JSON format
"""

import sys
import json
import os
from datetime import datetime
from dateutil.parser import parse
import xml.etree.ElementTree as ET
import re
from typing import List, Dict

# Lazy import of pdfminer when needed
def _pdf_to_xml_root(pdf_path: str):
    from io import StringIO
    try:
        from pdfminer.high_level import extract_text_to_fp
        from pdfminer.layout import LAParams
    except Exception as e:
        raise RuntimeError(
            "pdfminer.six is required to parse PDFs. Install dependencies first."
        ) from e

    output = StringIO()
    with open(pdf_path, 'rb') as f:
        extract_text_to_fp(f, output, laparams=LAParams(), output_type='xml', codec=None)
    xml_text = output.getvalue()
    try:
        return ET.fromstring(xml_text)
    except ET.ParseError as e:
        raise RuntimeError(f"Failed to parse XML converted from PDF: {pdf_path}. Error: {e}") from e


class Block:
    def __init__(self, page, x, x2, y, text):
        self.page = page
        self.x = x
        self.x2 = x2
        self.text = text
        self.y = y


def parse_rbc_credit(root) -> List[Dict]:
    """Parse RBC Visa credit card statement"""
    txns = []
    re_exchange_rate = re.compile(r'Exchange rate-([0-9]+\.[0-9]+)', re.MULTILINE)
    re_foreign_currency = re.compile(r'Foreign Currency-([A-Z]+) ([0-9]+\.[0-9]+)', re.MULTILINE)

    font_header = "MetaBookLF-Roman"
    font_txn = "MetaBoldLF-Roman"

    pages = [el for el in list(root) if getattr(el, 'tag', None) == 'page']
    if not pages:
        pages = list(root.findall('.//page'))

    for page in pages:
        page_number = int(page.get('id', 0))
        rows = {}

        for textline in page.iter('textline'):
            y = float(textline.get('y0', 0))
            if y not in rows:
                rows[y] = {'blocks': [], 'fonts': []}

            for text in textline.iter('text'):
                font = text.get('font', '')
                content = text.text or ''
                if content.strip():
                    x = float(text.get('x0', 0))
                    x2 = float(text.get('x1', 0))
                    rows[y]['blocks'].append(Block(page_number, x, x2, y, content))
                    rows[y]['fonts'].append(font)

        # Process transactions
        for y in sorted(rows.keys(), reverse=True):
            row = rows[y]
            if not row['blocks']:
                continue

            # Check if this is a transaction row (has MetaBoldLF-Roman font)
            if font_txn not in row['fonts']:
                continue

            blocks = sorted(row['blocks'], key=lambda b: b.x)
            if len(blocks) < 3:
                continue

            # Try to parse as transaction
            try:
                trans_date_str = blocks[0].text.strip()
                post_date_str = blocks[1].text.strip()

                # Parse dates
                trans_date = parse(trans_date_str, fuzzy=False).strftime('%Y-%m-%d')
                post_date = parse(post_date_str, fuzzy=False).strftime('%Y-%m-%d')

                # Get amount (last block)
                amount_str = blocks[-1].text.strip().replace(',', '').replace('$', '')
                amount = float(amount_str) if amount_str else 0

                # Description is everything between dates and amount
                description = ' '.join([b.text for b in blocks[2:-1]]).strip()

                # Determine type
                txn_type = 'credit' if amount > 0 else 'debit'

                txns.append({
                    'date': post_date,
                    'description': description,
                    'amount': abs(amount) if txn_type == 'debit' else amount,
                    'type': txn_type
                })
            except:
                continue

    return txns


def parse_rbc_chequing_savings(root) -> List[Dict]:
    """Parse RBC chequing or savings statement"""
    txns = []
    pages = [el for el in list(root) if getattr(el, 'tag', None) == 'page']
    if not pages:
        pages = list(root.findall('.//page'))

    for page in pages:
        page_number = int(page.get('id', 0))
        rows = {}

        for textline in page.iter('textline'):
            y = float(textline.get('y0', 0))
            if y not in rows:
                rows[y] = []

            for text in textline.iter('text'):
                content = text.text or ''
                if content.strip():
                    x = float(text.get('x0', 0))
                    x2 = float(text.get('x1', 0))
                    rows[y].append(Block(page_number, x, x2, y, content))

        # Process transactions
        for y in sorted(rows.keys(), reverse=True):
            blocks = sorted(rows[y], key=lambda b: b.x)
            if len(blocks) < 2:
                continue

            try:
                # First block should be date
                date_str = blocks[0].text.strip()
                date = parse(date_str, fuzzy=False).strftime('%Y-%m-%d')

                # Last block is balance (skip it)
                # Second to last should be withdrawal or deposit
                if len(blocks) >= 3:
                    amount_str = blocks[-2].text.strip().replace(',', '').replace('$', '')
                    amount = float(amount_str) if amount_str else 0

                    # Description is everything between date and amounts
                    description = ' '.join([b.text for b in blocks[1:-2]]).strip()

                    # Determine type (withdrawals are negative, deposits positive)
                    txn_type = 'debit' if amount < 0 else 'credit'

                    txns.append({
                        'date': date,
                        'description': description,
                        'amount': abs(amount),
                        'type': txn_type
                    })
            except:
                continue

    return txns


def parse_rbc_statement(pdf_path: str) -> dict:
    """
    Parse an RBC bank statement PDF and return transaction data

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Dictionary with success status, transactions, and metadata
    """
    try:
        root = _pdf_to_xml_root(pdf_path)

        # Try to detect statement type by looking for keywords
        text_content = ET.tostring(root, encoding='unicode', method='text')

        transactions = []
        statement_type = "unknown"

        if "Visa" in text_content or "CREDIT CARD" in text_content:
            transactions = parse_rbc_credit(root)
            statement_type = "credit_card"
        elif "CHEQUING" in text_content or "Chequing" in text_content:
            transactions = parse_rbc_chequing_savings(root)
            statement_type = "chequing"
        elif "SAVINGS" in text_content or "Savings" in text_content:
            transactions = parse_rbc_chequing_savings(root)
            statement_type = "savings"
        else:
            # Try chequing/savings parser as fallback
            transactions = parse_rbc_chequing_savings(root)
            statement_type = "chequing_or_savings"

        return {
            "success": True,
            "bank": "RBC (Royal Bank of Canada)",
            "statement_type": statement_type,
            "transactions": transactions,
            "metadata": {
                "total_transactions": len(transactions),
                "parser": "rbc-statement-converter"
            }
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


def handler(event, context):
    """AWS Lambda / Vercel handler"""
    try:
        # Get PDF path from event
        pdf_path = event.get('pdf_path') or '/tmp/statement.pdf'

        result = parse_rbc_statement(pdf_path)

        return {
            'statusCode': 200 if result['success'] else 500,
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }


# CLI mode
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_rbc.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    result = parse_rbc_statement(pdf_path)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result['success'] else 1)
