// Connect Four rules + alpha-beta AI. Board is ROWS x COLS, index = r * COLS + c, row 0 at top.
export const ROWS = 6;
export const COLS = 7;
const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function dropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r * COLS + col] === null) return r;
  }
  return -1;
}

// Returns the winning cells through (r, c) for the piece there, or null.
function winLineAt(board, r, c) {
  const p = board[r * COLS + c];
  if (p === null) return null;
  for (const [dr, dc] of DIRS) {
    const cells = [r * COLS + c];
    for (const s of [1, -1]) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr * COLS + cc] === p) {
        cells.push(rr * COLS + cc);
        rr += dr * s;
        cc += dc * s;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

export function createState() {
  return {
    board: Array(ROWS * COLS).fill(null),
    turn: 0,
    winner: null,
    draw: false,
    winLine: null,
    lastMove: null,
  };
}

export function applyMove(state, move, seat) {
  if (state.winner !== null || state.draw || state.turn !== seat) return null;
  const { col } = move || {};
  if (typeof col !== 'number' || col < 0 || col >= COLS) return null;
  const r = dropRow(state.board, col);
  if (r < 0) return null;

  const board = [...state.board];
  board[r * COLS + col] = seat;
  const line = winLineAt(board, r, col);
  const draw = !line && board.every((c) => c !== null);
  return {
    board,
    turn: line || draw ? state.turn : 1 - seat,
    winner: line ? seat : null,
    winLine: line,
    draw,
    lastMove: r * COLS + col,
  };
}

// ---------- AI ----------
const ORDER = [3, 2, 4, 1, 5, 0, 6];

function scoreWindow(cells, me) {
  let mine = 0;
  let theirs = 0;
  let empty = 0;
  for (const v of cells) {
    if (v === me) mine++;
    else if (v === null) empty++;
    else theirs++;
  }
  if (mine === 4) return 1000;
  if (mine === 3 && empty === 1) return 6;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -8;
  return 0;
}

function evaluate(board, me) {
  let score = 0;
  for (let r = 0; r < ROWS; r++) if (board[r * COLS + 3] === me) score += 3;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRS) {
        const er = r + dr * 3;
        const ec = c + dc * 3;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        const w = [0, 1, 2, 3].map((k) => board[(r + dr * k) * COLS + (c + dc * k)]);
        score += scoreWindow(w, me);
      }
    }
  }
  return score;
}

function negamax(board, depth, alpha, beta, player) {
  if (depth === 0) return evaluate(board, player);
  let any = false;
  let best = -Infinity;
  for (const c of ORDER) {
    const r = dropRow(board, c);
    if (r < 0) continue;
    any = true;
    board[r * COLS + c] = player;
    let score;
    if (winLineAt(board, r, c)) score = 100000 + depth;
    else score = -negamax(board, depth - 1, -beta, -alpha, 1 - player);
    board[r * COLS + c] = null;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return any ? best : 0;
}

export function getBotMove(state) {
  const board = [...state.board];
  const me = state.turn;
  const valid = ORDER.filter((c) => dropRow(board, c) >= 0);
  if (valid.length === 0) return null;
  if (Math.random() < 0.1) return { col: valid[Math.floor(Math.random() * valid.length)] };

  let bestScore = -Infinity;
  let bestCol = valid[0];
  for (const c of valid) {
    const r = dropRow(board, c);
    board[r * COLS + c] = me;
    const score = winLineAt(board, r, c)
      ? Infinity
      : -negamax(board, 4, -Infinity, Infinity, 1 - me);
    board[r * COLS + c] = null;
    if (score > bestScore) {
      bestScore = score;
      bestCol = c;
    }
  }
  return { col: bestCol };
}

export default { createState, applyMove, getBotMove };
