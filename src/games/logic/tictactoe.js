// Tic Tac Toe rules + AI. Pure functions: state in, new state out.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function findWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { seat: board[a], line };
    }
  }
  return null;
}

export function createState() {
  return { board: Array(9).fill(null), turn: 0, winner: null, draw: false, winLine: null, lastMove: null };
}

export function applyMove(state, move, seat) {
  if (state.winner !== null || state.draw || state.turn !== seat) return null;
  const { cell } = move || {};
  if (typeof cell !== 'number' || cell < 0 || cell > 8 || state.board[cell] !== null) return null;

  const board = [...state.board];
  board[cell] = seat;
  const win = findWinner(board);
  const draw = !win && board.every((c) => c !== null);
  return {
    board,
    turn: win || draw ? state.turn : 1 - seat,
    winner: win ? win.seat : null,
    winLine: win ? win.line : null,
    draw,
    lastMove: cell,
  };
}

function minimax(board, player, me, depth) {
  const win = findWinner(board);
  if (win) return win.seat === me ? 10 - depth : depth - 10;
  if (board.every((c) => c !== null)) return 0;

  let best = player === me ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    board[i] = player;
    const score = minimax(board, 1 - player, me, depth + 1);
    board[i] = null;
    best = player === me ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

export function getBotMove(state) {
  const empty = state.board.map((c, i) => (c === null ? i : null)).filter((i) => i !== null);
  if (empty.length === 0) return null;

  // A little randomness keeps the bot beatable and fun.
  if (Math.random() < 0.2) {
    return { cell: empty[Math.floor(Math.random() * empty.length)] };
  }

  const me = state.turn;
  const board = [...state.board];
  let bestScore = -Infinity;
  let bestCells = [];
  for (const i of empty) {
    board[i] = me;
    const score = minimax(board, 1 - me, me, 0);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestCells = [i];
    } else if (score === bestScore) {
      bestCells.push(i);
    }
  }
  return { cell: bestCells[Math.floor(Math.random() * bestCells.length)] };
}

export default { createState, applyMove, getBotMove };
