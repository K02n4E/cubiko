const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
const MODS = ['', "'", '2'];
const AXIS = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };

export function makeScramble(length = 20) {
  const moves = [];
  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const previous = moves.at(-1)?.[0];
    const twoBack = moves.at(-2)?.[0];
    if (face === previous || (AXIS[face] === AXIS[previous] && face === twoBack)) continue;
    moves.push(face + MODS[Math.floor(Math.random() * MODS.length)]);
  }
  return moves.join(' ');
}
