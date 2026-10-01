import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, ReactNode, createElement } from 'react';
import { getAdminPassword, setAdminPassword } from './adminSession';

// Always same-origin: in dev the Vite server proxies /api -> :5050 (see
// vite.config server.proxy), in prod it's the same host. Using a relative path
// avoids a cross-origin call to :5050, which can fail CORS/preflight on saves.
const API_URL = '';

type TextMap = Record<string, string>;

// Local cache of the last-known overrides, so the very first paint after a
// refresh uses the saved text instead of the built-in defaults (no "flash of
// old text" while the network fetch is in flight). Updated on every load/save.
const CACHE_KEY = 'siteTextCache';
function readTextCache(): TextMap {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeTextCache(m: TextMap) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(m || {})); } catch { /* ignore */ }
}

interface Ctx {
  map: TextMap;                       // saved overrides (id -> text)
  editing: boolean;
  setDraft: (id: string, value: string) => void;
  registerDefault: (id: string, def: string) => void;
}

const SiteTextCtx = createContext<Ctx>({
  map: {}, editing: false, setDraft: () => {}, registerDefault: () => {},
});

export function useSiteText() { return useContext(SiteTextCtx); }

/**
 * Wraps the app. Loads saved text overrides once, exposes edit mode, and renders
 * the floating "Edit text" toolbar (only for a logged-in admin).
 */
export function SiteTextProvider({ children, showEditor = true }: { children: ReactNode; showEditor?: boolean }) {
  // Seed synchronously from the local cache so the first render already shows
  // saved overrides; the network fetch below then confirms/updates them.
  const [map, setMap] = useState<TextMap>(() => readTextCache());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const drafts = useRef<TextMap>({});      // pending edits, id -> new text
  const defaults = useRef<TextMap>({});    // id -> built-in default text
  const [pwPrompt, setPwPrompt] = useState(false);   // show the unlock field
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    // no-store + cache-buster so a refresh always pulls the latest saved text,
    // never a browser-cached copy from before the last edit.
    fetch(`${API_URL}/api/site-text?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json()).then(d => { const t = d.text || {}; setMap(t); writeTextCache(t); }).catch(() => {});
  }, []);

  const setDraft = (id: string, value: string) => { drafts.current[id] = value; };
  const registerDefault = (id: string, def: string) => { defaults.current[id] = def; };

  // Clicking "Edit text": go straight in if already unlocked, else ask for the
  // admin password first (needed so Save can authenticate to the server).
  function onEditClick() {
    if (getAdminPassword()) { startEditing(); return; }
    setPwError('');
    setPwPrompt(true);
  }

  async function submitPassword(pw: string) {
    const password = (pw || '').trim();
    if (!password) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.role !== 'admin') { setPwError('Incorrect password'); return; }
      setAdminPassword(password);
      setPwPrompt(false);
      setPwError('');
      startEditing();
    } catch {
      setPwError('Could not verify — try again.');
    }
  }

  function startEditing() { drafts.current = {}; setEditing(true); }
  function cancel() { drafts.current = {}; setEditing(false); setPwPrompt(false); setPwError(''); }

  async function save() {
    // Only send edits that actually changed vs the current value (override or default).
    const edits: TextMap = {};
    for (const [id, value] of Object.entries(drafts.current)) {
      const currentVal = map[id] ?? defaults.current[id] ?? '';
      if (value !== currentVal) {
        // Blank or back-to-default → send '' so the server resets to the built-in text.
        edits[id] = value.trim() === (defaults.current[id] ?? '').trim() ? '' : value;
      }
    }
    if (Object.keys(edits).length === 0) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/site-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': getAdminPassword() || '' },
        body: JSON.stringify({ edits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      const t = data.text || {};
      setMap(t);
      writeTextCache(t);
      setEditing(false);
      setToast('Saved — changes are live.');
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setToast(e?.message || 'Could not save.');
      setTimeout(() => setToast(null), 4000);
    } finally { setSaving(false); }
  }

  return (
    <SiteTextCtx.Provider value={{ map, editing, setDraft, registerDefault }}>
      {children}
      {showEditor && <EditorBar
        editing={editing} saving={saving} toast={toast}
        pwPrompt={pwPrompt} pwError={pwError}
        onStart={onEditClick} onSave={save} onCancel={cancel}
        onSubmitPassword={submitPassword}
      />}
    </SiteTextCtx.Provider>
  );
}

function EditorBar({ editing, saving, toast, pwPrompt, pwError, onStart, onSave, onCancel, onSubmitPassword }: {
  editing: boolean; saving: boolean; toast: string | null;
  pwPrompt: boolean; pwError: string;
  onStart: () => void; onSave: () => void; onCancel: () => void;
  onSubmitPassword: (pw: string) => void;
}) {
  const [pw, setPw] = useState('');
  const wrap: React.CSSProperties = { position: 'fixed', right: 20, bottom: 20, zIndex: 900, display: 'flex', gap: 8, alignItems: 'center' };
  const btn: React.CSSProperties = { border: 0, borderRadius: 999, padding: '11px 18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.25)' };
  return (
    <>
      {editing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 899, background: 'var(--wrs-green, #24432f)', color: '#fff', textAlign: 'center', padding: '8px 12px', fontSize: 14, fontWeight: 600 }}>
          Editing text — click any highlighted text to change it, then Save.
        </div>
      )}
      <div style={wrap}>
        {toast && <span style={{ background: '#111', color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>{toast}</span>}
        {editing ? (
          <>
            <button style={{ ...btn, background: '#fff', color: '#333', border: '1px solid #ccc' }} onClick={onCancel} disabled={saving}>Cancel</button>
            <button style={{ ...btn, background: 'var(--wrs-blue, #2f6fb0)', color: '#fff' }} onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save & publish'}</button>
          </>
        ) : pwPrompt ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', borderRadius: 999, padding: '6px 6px 6px 14px', boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>
              <input
                type="password" autoFocus placeholder="Admin password" value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSubmitPassword(pw); }}
                style={{ border: 0, outline: 'none', fontSize: 14, width: 150 }}
              />
              <button style={{ ...btn, padding: '8px 16px', background: 'var(--wrs-green, #24432f)', color: '#fff' }} onClick={() => onSubmitPassword(pw)}>Unlock</button>
              <button style={{ ...btn, padding: '8px 12px', background: '#fff', color: '#888', border: '1px solid #ddd', boxShadow: 'none' }} onClick={onCancel}>✕</button>
            </div>
            {pwError && <span style={{ background: '#b3261e', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12 }}>{pwError}</span>}
          </div>
        ) : (
          <button style={{ ...btn, background: 'var(--wrs-green, #24432f)', color: '#fff' }} onClick={onStart}>✏️ Edit text</button>
        )}
      </div>
    </>
  );
}

/**
 * Editable text node. Usage: <Ed id="home.hero.title" as="h1" className="...">Default text</Ed>
 * - Normal mode: renders the saved override or the default.
 * - Edit mode (admin): becomes contentEditable and highlighted; edits are collected on save.
 */
export function Ed({ id, children, as = 'span', className, style }: {
  id: string; children: string; as?: any; className?: string; style?: React.CSSProperties;
}) {
  const { map, editing, setDraft, registerDefault } = useSiteText();
  const def = typeof children === 'string' ? children : '';
  registerDefault(id, def);
  const value = map[id] ?? def;
  const ref = useRef<HTMLElement | null>(null);

  // When entering edit mode, seed the element's text ONCE via the DOM and then
  // leave it uncontrolled. We intentionally do NOT pass `value` as a React child
  // while editing: if we did, any re-render would reconcile the DOM back to the
  // original text and silently wipe what the user typed before Save reads it.
  useLayoutEffect(() => {
    if (editing && ref.current) {
      ref.current.textContent = value;
      setDraft(id, value); // baseline so an untouched field is a no-op on save
    }
    // Re-seed only when edit mode toggles, never on every keystroke/re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (!editing) {
    return createElement(as, { className, style }, value);
  }
  return createElement(as, {
    ref,
    className,
    style: { ...style, outline: '2px dashed rgba(47,111,176,.7)', outlineOffset: 2, cursor: 'text', borderRadius: 3 },
    contentEditable: 'plaintext-only' as any,
    suppressContentEditableWarning: true,
    'data-edit-id': id,
    onInput: (e: any) => setDraft(id, e.currentTarget.textContent || ''),
    // Keep clicks/keys inside the editable text from triggering a parent
    // button or link (e.g. nav buttons) while editing.
    onClick: (e: any) => e.stopPropagation(),
    onMouseDown: (e: any) => e.stopPropagation(),
    onKeyDown: (e: any) => e.stopPropagation(),
    // No children: the text lives in the DOM (seeded above) and stays put
    // across re-renders, so typed edits are never clobbered.
  });
}
