import { useEffect, useRef, useState } from 'react';

/** Asks how to apply a backup file: merge or replace. */
export default function ImportDialog({ file, currentCount, newCount, onMerge, onReplace, onCancel }) {
  const [withSettings, setWithSettings] = useState(true);
  const cancel = useRef(null);
  useEffect(() => { cancel.current?.focus(); }, []);
  const alreadyHere = file.solves.length - newCount;
  return (
    <div className="popup-back confirm-back" onPointerDown={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="popup" role="dialog" aria-modal="true" aria-labelledby="im-title">
        <p className="pp-title" id="im-title">Restore backup</p>
        <p className="pp-sub">{file.solves.length} {file.solves.length === 1 ? 'solve' : 'solves'} in this file · {currentCount} on this device</p>
        <p className="pp-score im-detail">
          {newCount} new{alreadyHere ? ` · ${alreadyHere} already here` : ''}{file.skipped ? ` · ${file.skipped} unreadable skipped` : ''}
        </p>
        {file.settings && (
          <label className="im-check"><input type="checkbox" checked={withSettings} onChange={e => setWithSettings(e.target.checked)} /> Also restore settings</label>
        )}
        <div className="im-actions">
          <button className="btn pri" type="button" onClick={() => onMerge(withSettings)}>Merge ({newCount} new)</button>
          <button className="btn danger" type="button" onClick={() => onReplace(withSettings)}>Replace all {currentCount} solves</button>
          <button className="btn" type="button" ref={cancel} onClick={onCancel}>Cancel</button>
        </div>
        <p className="status im-hint">Merge keeps what you have. Replace swaps your history for the file’s.</p>
      </div>
    </div>
  );
}
