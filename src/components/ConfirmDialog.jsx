import { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, sub, note = 'This can’t be undone.', yesLabel = 'Delete', onYes, onNo, children }) {
  const no = useRef(null);
  useEffect(() => { no.current?.focus(); }, []);
  return (
    <div className="popup-back confirm-back" onPointerDown={e => { if (e.target === e.currentTarget) onNo(); }}>
      <div className="popup danger" role="alertdialog" aria-modal="true" aria-labelledby="cf-title">
        <div className="pp-icon"><svg className="i" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg></div>
        <p className="pp-title" id="cf-title">{title}</p>
        {sub && <p className="pp-sub">{sub}</p>}
        {children}
        {note && <p className="pp-score">{note}</p>}
        <div className="pp-actions">
          <button className="btn" type="button" ref={no} onClick={onNo}>Cancel</button>
          <button className="btn danger" type="button" onClick={onYes}>{yesLabel}</button>
        </div>
      </div>
    </div>
  );
}
