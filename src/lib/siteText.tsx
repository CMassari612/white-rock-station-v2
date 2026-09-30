import { createContext, useContext, useEffect, useRef, useState, ReactNode, createElement } from 'react';
import { getAdminPassword } from './adminSession';

const API_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5050') : '';

type TextMap = Record<string, string>;

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
  const [map, setMap] = useState<TextMap>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const drafts = useRef<TextMap>({});      // pending edits, id -> new text
  const defaults = useRef<TextMap>({});    // id -> built-in default text
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/site-text`).then(r => r.json()).then(d => setMap(d.text || {})).catch(() => {});
    setIsAdmin(!!getAdminPassword());
    const onFocus = () => setIsAdmin(!!getAdminPassword());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const setDraft = (id: string, value: string) => { drafts.current[id] = value; };
  const registerDefault = (id: string, def: string) => { defaults.current[id] = def; };

  function startEditing() { drafts.current = {}; setEditing(true); }
  function cancel() { drafts.current = {}; setEditing(false); }

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
      setMap(data.text || {});
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
      {isAdmin && showEditor && <EditorBar
        editing={editing} saving={saving} toast={toast}
        onStart={startEditing} onSave={save} onCancel={cancel}
      />}
    </SiteTextCtx.Provider>
  );
}

function EditorBar({ editing, saving, toast, onStart, onSave, onCancel }: {
  editing: boolean; saving: boolean; toast: string | null;
  onStart: () => void; onSave: () => void; onCancel: () => void;
}) {
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
        {!editing ? (
          <button style={{ ...btn, background: 'var(--wrs-green, #24432f)', color: '#fff' }} onClick={onStart}>✏️ Edit text</button>
        ) : (
          <>
            <button style={{ ...btn, background: '#fff', color: '#333', border: '1px solid #ccc' }} onClick={onCancel} disabled={saving}>Cancel</button>
            <button style={{ ...btn, background: 'var(--wrs-blue, #2f6fb0)', color: '#fff' }} onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save & publish'}</button>
          </>
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

  if (!editing) {
    return createElement(as, { className, style }, value);
  }
  return createElement(as, {
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
  }, value);
}
