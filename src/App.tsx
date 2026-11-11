import { useEffect, useMemo, useState } from 'react';
import { PaymentLinkForm } from './components/PaymentLinkForm';
import { PaymentLinkList } from './components/PaymentLinkList';
import { createPaymentLinkService, type PaymentLinkService } from './service';
import { filterLinks } from './status';
import type { FormInput, PaymentLink, StatusFilter } from './types';

interface AppProps {
  service?: PaymentLinkService;
}

export default function App({ service: injected }: AppProps) {
  const service = useMemo(() => injected ?? createPaymentLinkService(), [injected]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick so links flip to Expired without a manual refresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const run = (action: () => void) => {
    try {
      action();
      setLinks(service.list());
      setNow(Date.now());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const visible = filterLinks(links, filter, now);

  return (
    <main className="container">
      <h1>Payment Links</h1>
      <PaymentLinkForm onCreate={(input: FormInput) => run(() => service.create(input))} submitError={error} />
      <PaymentLinkList
        links={visible}
        totalCount={links.length}
        filter={filter}
        now={now}
        onFilterChange={setFilter}
        onMarkPaid={(id) => run(() => service.markPaid(id))}
      />
    </main>
  );
}
