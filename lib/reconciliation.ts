import type { AccountingDocument, ReconciliationRow, Transaction } from "@/lib/types";

function matchKey(amount: number, currency: string) {
  return `${currency.toUpperCase()}:${amount}`;
}

function normalizeForComparison(value?: string | null) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function expectedDocumentType(transaction: Transaction) {
  return transaction.direction === "DEBIT" ? "INVOICE_PAYABLE" : "INVOICE_RECEIVABLE";
}

function hasInvoiceNumberMatch(transaction: Transaction, document: AccountingDocument) {
  const purpose = normalizeForComparison(transaction.purpose);
  const documentNumber = normalizeForComparison(document.number);

  return Boolean(purpose && documentNumber && purpose.includes(documentNumber));
}

function hasNameMatch(transaction: Transaction, document: AccountingDocument) {
  const counterparty = normalizeForComparison(transaction.counterpartyName);
  const issuer = normalizeForComparison(document.issuerContact?.name);

  return Boolean(
    counterparty &&
      issuer &&
      (counterparty.includes(issuer) || issuer.includes(counterparty)),
  );
}

function preferMatches(
  candidates: AccountingDocument[],
  predicate: (document: AccountingDocument) => boolean,
) {
  const preferred = candidates.filter(predicate);
  return preferred.length > 0 ? preferred : candidates;
}

export function reconcileTransactions(
  transactions: Transaction[],
  documents: AccountingDocument[],
): ReconciliationRow[] {
  const documentsByValue = new Map<string, AccountingDocument[]>();

  for (const document of documents) {
    const key = matchKey(document.taxInclusiveAmount, document.currency);
    const matches = documentsByValue.get(key);

    if (matches) {
      matches.push(document);
    } else {
      documentsByValue.set(key, [document]);
    }
  }

  return transactions.map((transaction) => {
    const exactValueMatches =
      documentsByValue.get(matchKey(transaction.amount, transaction.currency)) ?? [];
    const typeMatches = exactValueMatches.filter(
      (document) => document.type === expectedDocumentType(transaction),
    );
    const invoiceNumberMatches = preferMatches(
      typeMatches,
      (document) => hasInvoiceNumberMatch(transaction, document),
    );
    const matches = preferMatches(
      invoiceNumberMatches,
      (document) => hasNameMatch(transaction, document),
    );

    return {
      matchIds: matches.map((document) => document.id),
      matchCount: matches.length,
      transaction,
    };
  });
}
