import { ReconciliationBrowser } from "@/components/reconciliation-browser";
import { getAllDocuments, getAllTransactions } from "@/lib/integral-api";
import { reconcileTransactions } from "@/lib/reconciliation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [transactions, documents] = await Promise.all([
    getAllTransactions(),
    getAllDocuments(),
  ]);

  const rows = reconcileTransactions(transactions, documents);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Untitled reconciliation home">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span>untitled</span>
        </a>
        <div className="environment-pill">
          <span className="environment-dot" aria-hidden="true" />
          Organization 216
        </div>
      </header>

      <section className="workspace" id="top">
        <div className="intro">
          <p className="eyebrow">Reconciliation workspace</p>
          <h1>Match every movement to its proof.</h1>
          <p className="intro-copy">
            Transactions are matched to documents with the same total amount and currency.
          </p>
        </div>

        <ReconciliationBrowser rows={rows} documents={documents} />
      </section>
    </main>
  );
}
