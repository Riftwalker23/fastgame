// Dots & Boxes rules + AI. N x N boxes, (N+1) x (N+1) dots.
// Horizontal line (r, c): r in 0..N, c in 0..N-1  -> index r * N + c
// Vertical line   (r, c): r in 0..N-1, c in 0..N  -> index r * (N + 1) + c
export const N = 4;

export function createState() {
  return {
    h: Array((N + 1) * N).fill(null),
    v: Array(N * (N + 1)).fill(null),
    boxes: Array(N * N).fill(null),
    scores: [0, 0],
    turn: 0,
    winner: null,
    draw: false,
    lastMove: null,
  };
}

const hIdx = (r, c) => r * N + c;
const vIdx = (r, c) => r * (N + 1) + c;

function sidesOf(h, v, br, bc) {
  return [h[hIdx(br, bc)], h[hIdx(br + 1, bc)], v[vIdx(br, bc)], v[vIdx(br, bc + 1)]].filter(
    (x) => x !== null
  ).length;
}

// Boxes touching a given line.
function adjacentBoxes(type, r, c) {
  const out = [];
  if (type === 'h') {
    if (r > 0) out.push([r - 1, c]);
    if (r < N) out.push([r, c]);
  } else {
    if (c > 0) out.push([r, c - 1]);
    if (c < N) out.push([r, c]);
  }
  return out;
}

function validLine(type, r, c) {
  if (type === 'h') return r >= 0 && r <= N && c >= 0 && c < N;
  if (type === 'v') return r >= 0 && r < N && c >= 0 && c <= N;
  return false;
}

export function applyMove(state, move, seat) {
  if (state.winner !== null || state.draw || state.turn !== seat) return null;
  const { type, r, c } = move || {};
  if (!validLine(type, r, c)) return null;
  const arr = type === 'h' ? state.h : state.v;
  const idx = type === 'h' ? hIdx(r, c) : vIdx(r, c);
  if (arr[idx] !== null) return null;

  const h = [...state.h];
  const v = [...state.v];
  (type === 'h' ? h : v)[idx] = seat;

  const boxes = [...state.boxes];
  const scores = [...state.scores];
  let closed = 0;
  for (const [br, bc] of adjacentBoxes(type, r, c)) {
    if (boxes[br * N + bc] === null && sidesOf(h, v, br, bc) === 4) {
      boxes[br * N + bc] = seat;
      scores[seat]++;
      closed++;
    }
  }

  const over = boxes.every((b) => b !== null);
  return {
    h,
    v,
    boxes,
    scores,
    turn: closed > 0 || over ? seat : 1 - seat,
    winner: over && scores[0] !== scores[1] ? (scores[0] > scores[1] ? 0 : 1) : null,
    draw: over && scores[0] === scores[1],
    lastMove: { type, r, c },
  };
}

export function getBotMove(state) {
  const { h, v } = state;
  const candidates = [];
  for (let r = 0; r <= N; r++)
    for (let c = 0; c < N; c++) if (h[hIdx(r, c)] === null) candidates.push({ type: 'h', r, c });
  for (let r = 0; r < N; r++)
    for (let c = 0; c <= N; c++) if (v[vIdx(r, c)] === null) candidates.push({ type: 'v', r, c });
  if (candidates.length === 0) return null;

  const scored = candidates.map((m) => {
    let completes = 0;
    let givesAway = 0;
    for (const [br, bc] of adjacentBoxes(m.type, m.r, m.c)) {
      const s = sidesOf(h, v, br, bc);
      if (s === 3) completes++;
      if (s === 2) givesAway++;
    }
    return { m, completes, givesAway };
  });

  const pick = (list) => list[Math.floor(Math.random() * list.length)].m;

  const closing = scored.filter((s) => s.completes > 0);
  if (closing.length) return pick(closing);

  const safe = scored.filter((s) => s.givesAway === 0);
  if (safe.length) return pick(safe);

  const minGive = Math.min(...scored.map((s) => s.givesAway));
  return pick(scored.filter((s) => s.givesAway === minGive));
}

export default { createState, applyMove, getBotMove };
