'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@/components/Editor';
import ContractNote from '@/components/ContractNote';
import { defaultData, STORAGE_KEY } from '@/lib/defaults';
import { compute, buildTableRows, paginate } from '@/lib/calc';

/* Immutable set-by-path, so the editor can address any nested field. */
function setPath(obj, path, value) {
  const keys = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...cur[k] };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

// Saved documents may predate newer fields, so merge onto the current defaults.
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

const LAST_ID_KEY = 'contract-note-last-id';

export default function Page() {
  const [data, setData] = useState(defaultData);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(0.4);
  const [noteId, setNoteId] = useState(null);
  const [status, setStatus] = useState('loading');   // loading | saved | saving | local | error
  const [savedAt, setSavedAt] = useState('');
  const [notes, setNotes] = useState([]);
  const [pdfBusy, setPdfBusy] = useState(false);
  const fileRef = useRef(null);
  const dirty = useRef(false);

  const refreshList = useCallback(async () => {
    try {
      const r = await fetch('/api/notes');
      const j = await r.json();
      if (j.ok) setNotes(j.notes);
    } catch {
      /* list stays as it was */
    }
  }, []);

  // Restore: Mongo first, local storage if the database is unreachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/notes/latest');
        const j = await r.json();
        if (cancelled) return;
        if (j.ok) {
          if (j.note) {
            setData(merge(defaultData(), j.note.data));
            setNoteId(j.note.id);
          }
          setStatus('saved');
          refreshList();
          setReady(true);
          return;
        }
        throw new Error(j.message || 'db down');
      } catch {
        if (cancelled) return;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setData(merge(defaultData(), JSON.parse(raw)));
        } catch {
          /* ignore unreadable storage */
        }
        setStatus('local');
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshList]);

  // Autosave, debounced. Always mirrors to local storage as a safety net.
  useEffect(() => {
    if (!ready || !dirty.current) return undefined;
    const id = setTimeout(async () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* storage full or blocked */
      }
      setStatus((s) => (s === 'local' ? 'local' : 'saving'));
      try {
        const r = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId, data }),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.message || 'save failed');
        if (!noteId) setNoteId(j.id);
        setStatus('saved');
        setSavedAt(new Date().toLocaleTimeString());
        refreshList();
      } catch {
        setStatus('local');
        setSavedAt(new Date().toLocaleTimeString());
      }
    }, 700);
    return () => clearTimeout(id);
  }, [data, ready, noteId, refreshList]);

  const set = useCallback((path, value) => {
    dirty.current = true;
    setData((d) => setPath(d, path, value));
  }, []);

  const computed = useMemo(() => compute(data), [data]);
  const pages = useMemo(
    () => paginate(buildTableRows(computed.groups, computed.netTotal), data.layout.rowsPerPage),
    [computed, data.layout.rowsPerPage]
  );

  const loadNote = async (id) => {
    try {
      const r = await fetch(`/api/notes/${id}`);
      const j = await r.json();
      if (!j.ok) throw new Error();
      dirty.current = false;
      setData(merge(defaultData(), j.note.data));
      setNoteId(j.note.id);
      setStatus('saved');
    } catch {
      alert('Could not load that note.');
    }
  };

  const deleteNote = async (id, label) => {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (id === noteId) {
        setNoteId(null);
        dirty.current = false;
      }
      refreshList();
    } catch {
      alert('Could not delete that note.');
    }
  };

  const newNote = () => {
    if (!confirm('Start a new blank note? The current one stays saved in the list.')) return;
    dirty.current = false;
    setNoteId(null);
    setData(defaultData());
  };

  /**
   * Export through headless Chrome rather than window.print(): the print
   * dialog's Scale and Margins settings rescale the sheet, which thickens the
   * 0.5pt rules and shifts every measurement.
   */
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const r = await fetch(`/api/pdf${noteId ? `?id=${noteId}` : ''}`);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || 'PDF render failed');
      }
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `contract-note-${data.note.contractNoteNo || 'draft'}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert(
        `Could not build the PDF: ${err.message}

` +
          'Use "Print view" and save from the browser instead - set Paper to A2 ' +
          '(1684x1190pt), Margins to None and Scale to 100%.'
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `contract-note-${data.note.contractNoteNo || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        dirty.current = true;
        setData(merge(defaultData(), JSON.parse(String(reader.result))));
      } catch {
        alert('That file is not a valid contract-note JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!ready) return null;

  const statusText = {
    saved: savedAt ? `saved to MongoDB ${savedAt}` : 'loaded from MongoDB',
    saving: 'saving...',
    local: `MongoDB unreachable - saved locally${savedAt ? ` ${savedAt}` : ''}`,
    loading: 'loading...',
  }[status];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="toolbar">
          <h1>Contract Note</h1>
          <button onClick={newNote}>New</button>
          <button onClick={exportJson}>Export</button>
          <button onClick={() => fileRef.current && fileRef.current.click()}>Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
          <div className={`status ${status}`}>{statusText}</div>
        </div>

        <details className="sec" open={notes.length > 0}>
          <summary>Saved notes ({notes.length})</summary>
          <div className="body">
            {notes.length === 0 ? (
              <p className="hint">
                Nothing saved yet. Edits are written to the local MongoDB
                (<code>contract_notes.notes</code>) a moment after you stop typing.
              </p>
            ) : (
              notes.map((n) => (
                <div className={`note-row${n.id === noteId ? ' active' : ''}`} key={n.id}>
                  <button className="link" onClick={() => loadNote(n.id)}>
                    <b>{n.title}</b>
                    <span>{new Date(n.updatedAt).toLocaleString()}</span>
                  </button>
                  <button className="tiny danger" onClick={() => deleteNote(n.id, n.title)}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </details>

        <Editor data={data} set={set} computed={computed} />
      </aside>

      <main className="stage">
        <div className="stage-note" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="primary" onClick={downloadPdf} disabled={pdfBusy}>
            {pdfBusy ? 'Building PDF...' : 'Download PDF'}
          </button>
          <button onClick={() => window.open(`/print${noteId ? `?id=${noteId}` : ''}`, '_blank')}>
            Print view
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.15, z - 0.05))}>&minus;</button>
          <span style={{ minWidth: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1, z + 0.05))}>+</button>
          <span>
            <b>Download PDF</b> renders the sheet at exactly 1684&times;1190pt
            through headless Chrome, so printer defaults cannot rescale it.
          </span>
        </div>

        <div
          className="scaler"
          style={{ transform: `scale(${zoom})`, width: `calc(1684pt * ${zoom})`, height: 'fit-content' }}
        >
          <div style={{ width: '1684pt', display: 'flex', flexDirection: 'column', gap: '24pt' }}>
            <ContractNote data={data} computed={computed} pages={pages} />
          </div>
        </div>
      </main>
    </div>
  );
}
