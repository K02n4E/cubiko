import { useMemo } from 'react';
import { netCells } from '../lib/cube';

/** Unfolded cube diagram for a scramble. `keep` shows it even when the preview setting is off. */
export default function CubeNet({ scramble, className = '', keep = false }) {
  const cells = useMemo(() => netCells(scramble), [scramble]);
  return (
    <div className={`net ${keep ? 'keep' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 131 98" role="img" aria-label="Scramble preview">
        {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width="10" height="10" rx="1.6" fill={c.fill} />)}
      </svg>
    </div>
  );
}
