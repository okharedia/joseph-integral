# Transaction-Document Reconciliation System

## Overview

Your task is to build a **reconciliation system** that matches financial transactions with their corresponding accounting documents (invoices, receipts, etc.). This is a critical feature in accounting software that helps businesses verify that every transaction has proper documentation.

## What is Reconciliation?

Reconciliation is the process of matching two sets of records to ensure they correspond correctly. In accounting:

- **Transactions** represent money movements (incoming/outgoing payments recorded by the bank).
- **Accounting documents** represent business artifacts (invoices, receipts, bills) that justify those money movements.

A successful reconciliation links a transaction to its supporting document, proving the transaction is legitimate and properly documented.

## Your Challenge

Design and implement the matching logic that determines which transactions correspond to which documents.

Build a UI that shows a table of reconciliations. In the reconciliation detail view, the matched document and transactions should be visible.

## API Information

### Base URL

[https://dev-happytax-fiscal-api.dev.getintegral.de](https://dev-happytax-fiscal-api.dev.getintegral.de/)

### Documentation

[Scalar API Documentation](https://registry.scalar.com/@integral/apis/integral-interview-api/latest)

### Endpoints

#### Get transactions

```http
GET /organizations/{organizationId}/transactions
```

[View transaction documentation](https://registry.scalar.com/@integral/apis/integral-interview-api#tag/transactions/get/organizations/{organizationId}/transactions)

#### Get documents

```http
GET /advisories/{advisoryId}/organizations/{organizationId}/accounting/documents
```

[View accounting-document documentation](https://registry.scalar.com/@integral/apis/integral-interview-api#tag/accounting-documents/get/advisories/{advisoryId}/organizations/{organizationId}/accounting/documents)

## Local Development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API key remains server-side and is never sent to the browser.

### Current Matching Rule

Candidates must have the same exact amount and currency. Debit transactions only match payable invoices, while credit transactions only match receivable invoices.

The remaining candidates are narrowed in priority order:

1. Prefer a document whose invoice number appears in the payment purpose.
2. Prefer a normalized counterparty/issuer name match.

Preferences only narrow the set when at least one candidate satisfies them. Multiple remaining documents are marked **Needs review** and shown in a sliding carousel. Dates never select a document automatically.
