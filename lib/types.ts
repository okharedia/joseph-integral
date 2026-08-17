export type TransactionDirection = "CREDIT" | "DEBIT";

export type Transaction = {
  id: number;
  amount: number;
  bookingDate: string;
  counterpartyName?: string | null;
  currency: string;
  direction: TransactionDirection;
  purpose?: string | null;
  source: string;
  sourceTransactionId: string;
  valueDate?: string | null;
};

export type Contact = {
  email?: string | null;
  name?: string | null;
};

export type Address = {
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  street?: string | null;
};

export type AccountingDocument = {
  amountDue?: number | null;
  billingContact?: Contact | null;
  currency: string;
  documentDate?: string | null;
  documentId?: number | null;
  dueDate?: string | null;
  id: number;
  issuerAddress?: Address | null;
  issuerContact?: Contact | null;
  number?: string | null;
  taxInclusiveAmount: number;
  type: string;
};

export type ReconciliationRow = {
  matchIds: number[];
  matchCount: number;
  transaction: Transaction;
};

export type PageResponse<T> = {
  content: T[];
  page?: {
    nextPage?: number | null;
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  totalElements?: number;
  totalPages?: number;
};
