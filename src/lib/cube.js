/* Tiny cube simulator: applies a scramble and returns the stickers of the unfolded net. */
const NORMALS = [[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[1,0,0],[-1,0,0]];
const FACE_AXIS = { U:[0,1,0], D:[0,-1,0], F:[0,0,1], B:[0,0,-1], R:[1,0,0], L:[-1,0,0] };
const STICKER_COLORS = { '0,1,0':'#F8FAFC', '0,-1,0':'#FACC15', '0,0,1':'#22C55E', '0,0,-1':'#3B82F6', '1,0,0':'#EF4444', '-1,0,0':'#F97316' };
const NET_LAYOUT = { '0,1,0':{o:[3,0],r:[1,0,0],d:[0,0,1]}, '-1,0,0':{o:[0,3],r:[0,0,1],d:[0,-1,0]}, '0,0,1':{o:[3,3],r:[1,0,0],d:[0,-1,0]}, '1,0,0':{o:[6,3],r:[0,0,-1],d:[0,-1,0]}, '0,0,-1':{o:[9,3],r:[-1,0,0],d:[0,-1,0]}, '0,-1,0':{o:[3,6],r:[1,0,0],d:[0,0,-1]} };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function solvedCube() {
  const stickers = [];
  NORMALS.forEach(n => {
    const axis = n.findIndex(v => v), others = [0, 1, 2].filter(i => i !== axis);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const p = [0, 0, 0]; p[axis] = n[axis]; p[others[0]] = a; p[others[1]] = b;
      stickers.push({ p, n: [...n], c: n.join() });
    }
  });
  return stickers;
}
function turnClockwise(v, k) { // rotate v by -90 degrees about axis k
  const cross = [k[1]*v[2] - k[2]*v[1], k[2]*v[0] - k[0]*v[2], k[0]*v[1] - k[1]*v[0]], d = dot3(k, v);
  return [-cross[0] + k[0]*d, -cross[1] + k[1]*d, -cross[2] + k[2]*d].map(x => x + 0);
}
function applyScramble(stickers, scramble) {
  scramble.split(/\s+/).filter(Boolean).forEach(move => {
    const k = FACE_AXIS[move[0]], times = move[1] === '2' ? 2 : move[1] === "'" ? 3 : 1;
    if (!k) return;
    for (let t = 0; t < times; t++) stickers.forEach(s => { if (dot3(s.p, k) === 1) { s.p = turnClockwise(s.p, k); s.n = turnClockwise(s.n, k); } });
  });
  return stickers;
}
/** Returns [{x, y, fill}] for the 54 stickers, in a 131 x 98 viewBox. */
export function netCells(scramble) {
  return applyScramble(solvedCube(), scramble).map(s => {
    const layout = NET_LAYOUT[s.n.join()];
    const col = layout.o[0] + dot3(s.p, layout.r) + 1, row = layout.o[1] + dot3(s.p, layout.d) + 1;
    return { x: col * 11, y: row * 11, fill: STICKER_COLORS[s.c] };
  });
}
