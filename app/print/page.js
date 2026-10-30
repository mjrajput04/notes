'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ContractNote from '@/components/ContractNote';
import { defaultData } from '@/lib/defaults';
import { compute, buildTableRows, paginate } from '@/lib/calc';

function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  if (Array.isArray(base)) return saved;
  const out = { ...base };
  Object.keys(saved).forEach((k) => {
    out[k] =
      base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])
        ? merge(base[k], saved[k])
        : saved[k];
  });
  return out;
}

/**
 * The document on its own, at full size, with no editor chrome. /api/pdf points
 * headless Chrome at this route, and it is also what the browser's own print
 * dialog sees if someone opens it directly.
 */
function PrintView() {
  const params = useSearchParams();
  const id = params.get('id');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = id ? `/api/notes/${id}` : '/api/notes/latest';
        const r = await fetch(url);
        const j = await r.json();
        if (cancelled) return;
        setData(j.ok && j.note ? merge(defaultData(), j.note.data) : defaultData());
      } catch {
        if (!cancelled) setData(defaultData());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data) return null;

  const computed = compute(data);
  const pages = paginate(
    buildTableRows(computed.groups, computed.netTotal),
    data.layout.rowsPerPage
  );

  return (
    <div className="print-root">
      <ContractNote data={data} computed={computed} pages={pages} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PrintView />
    </Suspense>
  );
}
