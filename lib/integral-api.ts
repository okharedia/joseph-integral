import "server-only";

import type { AccountingDocument, PageResponse, Transaction } from "@/lib/types";

const PAGE_SIZE = 100;
const API_URL = process.env.INTEGRAL_API_URL ?? "https://dev-happytax-fiscal-api.dev.getintegral.de";
const ORGANIZATION_ID = process.env.INTEGRAL_ORGANIZATION_ID ?? "216";
const ADVISORY_ID = process.env.INTEGRAL_ADVISORY_ID ?? "1";

function getApiKey() {
  const apiKey = process.env.INTEGRAL_API_KEY;

  if (!apiKey) {
    throw new Error("INTEGRAL_API_KEY is not configured.");
  }

  return apiKey;
}

async function fetchPage<T>(path: string, page: number, extraParams?: Record<string, string>) {
  const url = new URL(path, API_URL);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(PAGE_SIZE));

  for (const [key, value] of Object.entries(extraParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: { "x-api-key": getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`Integral API request failed with status ${response.status}.`);
  }

  return response.json() as Promise<PageResponse<T>>;
}

async function fetchAllPages<T>(
  path: string,
  extraParams?: Record<string, string>,
  firstRemainingPage = 1,
) {
  const firstPage = await fetchPage<T>(path, 0, extraParams);
  const totalPages = firstPage.page?.totalPages ?? firstPage.totalPages ?? 1;
  const remainingPageNumbers = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => index + firstRemainingPage,
  );

  const remainingPages = await Promise.all(
    remainingPageNumbers.map((page) => fetchPage<T>(path, page, extraParams)),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.content);
}

export async function getAllTransactions() {
  const transactions = await fetchAllPages<Transaction>(`/organizations/${ORGANIZATION_ID}/transactions`, {
    sortBy: "bookingDate",
    sortDirection: "desc",
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    amount: transaction.amount,
    bookingDate: transaction.bookingDate,
    counterpartyName: transaction.counterpartyName,
    currency: transaction.currency,
    direction: transaction.direction,
    purpose: transaction.purpose,
    source: transaction.source,
    sourceTransactionId: transaction.sourceTransactionId,
    valueDate: transaction.valueDate,
  }));
}

export async function getAllDocuments() {
  const documents = await fetchAllPages<AccountingDocument>(
    `/advisories/${ADVISORY_ID}/organizations/${ORGANIZATION_ID}/accounting/documents`,
    undefined,
    2,
  );
  const uniqueDocuments = [...new Map(documents.map((document) => [document.id, document])).values()];

  return uniqueDocuments.map((document) => ({
    amountDue: document.amountDue,
    billingContact: document.billingContact,
    currency: document.currency,
    documentDate: document.documentDate,
    documentId: document.documentId,
    dueDate: document.dueDate,
    id: document.id,
    issuerAddress: document.issuerAddress,
    issuerContact: document.issuerContact,
    number: document.number,
    taxInclusiveAmount: document.taxInclusiveAmount,
    type: document.type,
  }));
}
