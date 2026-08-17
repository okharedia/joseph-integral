import { describe, expect, it } from "vitest";

import { reconcileTransactions } from "./reconciliation";
import type { AccountingDocument, Transaction } from "./types";

const transaction: Transaction = {
  id: 1,
  amount: 120,
  bookingDate: "2026-08-17",
  currency: "EUR",
  direction: "DEBIT",
  source: "MANUAL",
  sourceTransactionId: "transaction-1",
};

const document: AccountingDocument = {
  currency: "EUR",
  id: 10,
  number: "INV-10",
  taxInclusiveAmount: 120,
  type: "INVOICE_PAYABLE",
};

describe("reconcileTransactions", () => {
  it("matches exact amount and currency values", () => {
    const [row] = reconcileTransactions([transaction], [document]);

    expect(row.matchIds).toEqual([10]);
    expect(row.matchCount).toBe(1);
  });

  it("shows the first document and counts every exact match", () => {
    const secondDocument = { ...document, id: 11, number: "INV-11" };
    const [row] = reconcileTransactions([transaction], [document, secondDocument]);

    expect(row.matchIds).toEqual([10, 11]);
    expect(row.matchCount).toBe(2);
  });

  it("does not match a different currency", () => {
    const [row] = reconcileTransactions(
      [transaction],
      [{ ...document, currency: "USD" }],
    );

    expect(row.matchIds).toEqual([]);
    expect(row.matchCount).toBe(0);
  });
});
