"use client";

import { useMemo, useState } from "react";

import type { AccountingDocument, ReconciliationRow, Transaction } from "@/lib/types";

type Filter = "all" | "matched" | "review" | "unmatched";

type Props = {
  documents: AccountingDocument[];
  rows: ReconciliationRow[];
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value?: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00Z`)) : "—";
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function getPartyName(transaction: Transaction) {
  return transaction.counterpartyName?.trim() || "Unknown counterparty";
}

function MatchBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="status-badge status-unmatched">Unmatched</span>;
  }

  if (count > 1) {
    return <span className="status-badge status-review">Needs review · {count}</span>;
  }

  return (
    <span className="status-badge status-matched">Matched</span>
  );
}

function TransactionListItem({
  isSelected,
  onSelect,
  row,
}: {
  isSelected: boolean;
  onSelect: () => void;
  row: ReconciliationRow;
}) {
  const { transaction } = row;

  return (
    <button
      className={`transaction-row${isSelected ? " transaction-row-selected" : ""}`}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className={`direction-icon direction-${transaction.direction.toLowerCase()}`} aria-hidden="true">
        {transaction.direction === "CREDIT" ? "↙" : "↗"}
      </span>
      <span className="transaction-main">
        <span className="transaction-title">{getPartyName(transaction)}</span>
        <span className="transaction-meta">
          {formatDate(transaction.bookingDate)} · #{transaction.id}
        </span>
      </span>
      <span className="transaction-end">
        <span className={`transaction-amount amount-${transaction.direction.toLowerCase()}`}>
          {transaction.direction === "CREDIT" ? "+" : "−"}
          {formatMoney(transaction.amount, transaction.currency)}
        </span>
        <MatchBadge count={row.matchCount} />
      </span>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function DocumentPanel({
  document,
  position,
  total,
}: {
  document: AccountingDocument;
  position: number;
  total: number;
}) {
  const issuerName = document.issuerContact?.name || "Unknown issuer";

  return (
    <div className="document-card">
      <div className="document-card-head">
        <div className="document-icon" aria-hidden="true">≡</div>
        <div>
          <p className="document-number">{document.number || `Document #${document.id}`}</p>
          <p className="document-type">{document.type.replaceAll("_", " ").toLowerCase()}</p>
        </div>
        <span className="match-count-badge">
          {position} of {total}
        </span>
      </div>

      <dl className="detail-list">
        <DetailRow label="Record ID" value={`#${document.id}`} />
        <DetailRow label="Issuer" value={issuerName} />
        <DetailRow label="Document date" value={formatDate(document.documentDate)} />
        <DetailRow label="Due date" value={formatDate(document.dueDate)} />
        <DetailRow
          label="Document total"
          value={<strong>{formatMoney(document.taxInclusiveAmount, document.currency)}</strong>}
        />
        <DetailRow
          label="Amount due"
          value={
            document.amountDue == null
              ? "—"
              : formatMoney(document.amountDue, document.currency)
          }
        />
      </dl>
    </div>
  );
}

function DocumentCarousel({ documents }: { documents: AccountingDocument[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = documents.length;

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + total) % total);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % total);
  };

  return (
    <div
      className="document-carousel"
      aria-label="Matching documents"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPrevious();
        if (event.key === "ArrowRight") showNext();
      }}
      tabIndex={0}
    >
      {total > 1 ? (
        <div className="carousel-toolbar">
          <p>Browse all {total} remaining candidates</p>
          <div className="carousel-controls">
            <button type="button" onClick={showPrevious} aria-label="Previous matching document">←</button>
            <span aria-live="polite">{activeIndex + 1} / {total}</span>
            <button type="button" onClick={showNext} aria-label="Next matching document">→</button>
          </div>
        </div>
      ) : null}

      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {documents.map((document, index) => (
            <div className="carousel-slide" key={document.id} aria-hidden={index !== activeIndex}>
              <DocumentPanel document={document} position={index + 1} total={total} />
            </div>
          ))}
        </div>
      </div>

      {total > 1 ? (
        <div className="carousel-dots" aria-label="Choose matching document">
          {documents.map((document, index) => (
            <button
              aria-label={`Show matching document ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={index === activeIndex ? "carousel-dot carousel-dot-active" : "carousel-dot"}
              key={document.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailPanel({
  documents,
  row,
}: {
  documents: AccountingDocument[];
  row: ReconciliationRow;
}) {
  const { matchCount, transaction } = row;

  return (
    <aside className="detail-panel" aria-label="Transaction details">
      <div className="detail-panel-header">
        <div>
          <p className="eyebrow">Transaction detail</p>
          <h2>{getPartyName(transaction)}</h2>
        </div>
        <MatchBadge count={matchCount} />
      </div>

      <div className="transaction-summary">
        <div>
          <p className="summary-label">Amount</p>
          <p className={`summary-amount amount-${transaction.direction.toLowerCase()}`}>
            {transaction.direction === "CREDIT" ? "+" : "−"}
            {formatMoney(transaction.amount, transaction.currency)}
          </p>
        </div>
        <div className="summary-date">
          <p className="summary-label">Booking date</p>
          <p>{formatDate(transaction.bookingDate)}</p>
        </div>
      </div>

      <dl className="detail-list transaction-details">
        <DetailRow label="Direction" value={transaction.direction.toLowerCase()} />
        <DetailRow label="Source" value={transaction.source} />
        <DetailRow label="Reference" value={transaction.purpose || "No payment reference"} />
      </dl>

      <div className="match-section-heading">
        <div>
          <p className="eyebrow">Rule-based match</p>
          <h3>Matching document</h3>
        </div>
        <span className="match-rule">Value · type · reference · name</span>
      </div>

      {documents.length ? (
        <DocumentCarousel documents={documents} />
      ) : (
        <div className="empty-match">
          <span className="empty-match-icon" aria-hidden="true">?</span>
          <h3>No matching document</h3>
          <p>
            No {transaction.direction === "DEBIT" ? "payable" : "receivable"} document passed the exact value and direction rules.
          </p>
        </div>
      )}
    </aside>
  );
}

export function ReconciliationBrowser({ documents, rows }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => rows[0]?.transaction.id ?? 0);

  const matchedCount = rows.reduce((total, row) => total + Number(row.matchCount === 1), 0);
  const reviewCount = rows.reduce((total, row) => total + Number(row.matchCount > 1), 0);
  const unmatchedCount = rows.length - matchedCount - reviewCount;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "matched" && row.matchCount === 1) ||
        (filter === "review" && row.matchCount > 1) ||
        (filter === "unmatched" && row.matchCount === 0);
      const transaction = row.transaction;
      const matchesQuery =
        !normalizedQuery ||
        getPartyName(transaction).toLowerCase().includes(normalizedQuery) ||
        transaction.purpose?.toLowerCase().includes(normalizedQuery) ||
        String(transaction.id).includes(normalizedQuery);

      return matchesFilter && Boolean(matchesQuery);
    });
  }, [filter, normalizedQuery, rows]);

  const selectedRow = rows.find((row) => row.transaction.id === selectedId) ?? rows[0];
  const documentsById = useMemo(
    () => new Map(documents.map((document) => [document.id, document])),
    [documents],
  );
  const selectedDocuments = selectedRow
    ? selectedRow.matchIds.flatMap((id) => {
        const document = documentsById.get(id);
        return document ? [document] : [];
      })
    : [];

  return (
    <>
      <section className="stats-grid" aria-label="Reconciliation summary">
        <article className="stat-card">
          <span className="stat-label">Transactions</span>
          <strong>{rows.length}</strong>
          <span>{documents.length} documents loaded</span>
        </article>
        <article className="stat-card stat-card-green">
          <span className="stat-label">Matched</span>
          <strong>{matchedCount}</strong>
          <span>{rows.length ? Math.round((matchedCount / rows.length) * 100) : 0}% exact match rate</span>
        </article>
        <article className="stat-card stat-card-amber">
          <span className="stat-label">Needs review</span>
          <strong>{reviewCount}</strong>
          <span>{unmatchedCount} unmatched transactions</span>
        </article>
      </section>

      <section className="reconciliation-grid">
        <div className="list-panel">
          <div className="list-toolbar">
            <div>
              <p className="eyebrow">Bank activity</p>
              <h2>Transactions</h2>
            </div>
            <label className="search-field">
              <span className="sr-only">Search transactions</span>
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, reference or ID"
              />
            </label>
          </div>

          <div className="filter-tabs" role="group" aria-label="Filter transactions">
            {(["all", "matched", "review", "unmatched"] as const).map((item) => (
              <button
                className={filter === item ? "filter-tab filter-tab-active" : "filter-tab"}
                key={item}
                type="button"
                onClick={() => setFilter(item)}
              >
                {item === "review" ? "Needs review" : item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
            <span className="result-count">{filteredRows.length} results</span>
          </div>

          <div className="transaction-list">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <TransactionListItem
                  key={row.transaction.id}
                  row={row}
                  isSelected={row.transaction.id === selectedRow?.transaction.id}
                  onSelect={() => setSelectedId(row.transaction.id)}
                />
              ))
            ) : (
              <div className="empty-list">No transactions match this filter.</div>
            )}
          </div>
        </div>

        {selectedRow ? (
          <DetailPanel
            documents={selectedDocuments}
            key={selectedRow.transaction.id}
            row={selectedRow}
          />
        ) : null}
      </section>
    </>
  );
}
