// Central registry of every game in FastGame.
// `modes` controls which buttons appear on the game's detail page:
//   online -> play with friends over the network (rooms, quick match, challenges)
//   bot    -> play against the computer
//   local  -> two people on one device, alternating turns
//   solo   -> single-player / high-score run

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'board', label: 'Board' },
  { id: 'quick', label: 'Quick 1v1' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'brain', label: 'Brain' },
];

export const GAMES = [
  {
    id: 'ludo',
    name: 'Ludo Royale',
    emoji: '🎲',
    color: '#C8553D',
    category: 'board',
    tagline: 'Race all 4 tokens home',
    players: '2-4 players',
    description:
      'Roll a 6 to launch tokens, cut opponents back to their yard, use the safe stars and race all four tokens into the centre.',
    howTo: [
      'Roll a 6 to bring a token out.',
      'Rolling a 6 or reaching home gives you another roll.',
      'Land on an opponent to send them back.',
    ],
    modes: ['online', 'bot', 'local'],
    badge: 'POPULAR',
  },
  {
    id: 'chess',
    name: 'Chess Masters',
    emoji: '♟️',
    color: '#6C8EA4',
    category: 'board',
    tagline: 'The classic battle of minds',
    players: '1v1',
    description:
      'Full FIDE rules: castling, en passant, promotions and checkmate, with chess clocks for online games.',
    howTo: ['Tap a piece, then tap a highlighted square.', 'Checkmate the enemy king to win.'],
    modes: ['online', 'bot', 'local'],
    badge: 'CLASSIC',
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    emoji: '❌',
    color: '#8C7AB8',
    category: 'quick',
    tagline: 'Three in a row wins',
    players: '1v1',
    description:
      'The 30-second classic. Perfect for settling who pays for chai between lectures.',
    howTo: ['Take turns placing X and O.', 'Get three in a row — across, down or diagonal.'],
    modes: ['online', 'bot', 'local'],
    badge: 'NEW',
  },
  {
    id: 'connect4',
    name: 'Connect Four',
    emoji: '🔴',
    color: '#D9A93A',
    category: 'quick',
    tagline: 'Drop discs, line up four',
    players: '1v1',
    description:
      'Drop discs into the grid and be the first to connect four in a row, column or diagonal.',
    howTo: ['Tap a column to drop your disc.', 'Connect four of your colour to win.'],
    modes: ['online', 'bot', 'local'],
    badge: 'NEW',
  },
  {
    id: 'dotsboxes',
    name: 'Dots & Boxes',
    emoji: '🔲',
    color: '#5E9C66',
    category: 'brain',
    tagline: 'Close boxes, steal the board',
    players: '1v1',
    description:
      'The notebook-margin classic. Draw lines between dots; close a box to claim it and go again.',
    howTo: [
      'Tap the gap between two dots to draw a line.',
      'Complete the 4th side of a box to claim it and move again.',
      'Most boxes wins.',
    ],
    modes: ['online', 'bot', 'local'],
    badge: 'NEW',
  },
  {
    id: 'snake',
    name: 'Neon Snake',
    emoji: '🐍',
    color: '#6BA35A',
    category: 'arcade',
    tagline: 'Eat, grow, don’t crash',
    players: 'Solo or vs AI',
    description:
      'Classic snake with a twist: go for a high score solo, or duel an AI snake for the same food.',
    howTo: [
      'Swipe, use the arrow pad, or press arrow keys / WASD.',
      'Eat food to grow. Hitting a wall or a snake ends your run.',
      'Duel: first to 15 points — or the last snake alive — wins.',
    ],
    modes: ['solo', 'bot'],
    badge: 'NEW',
  },
  {
    id: 'reaction',
    name: 'Reflex Duel',
    emoji: '⚡',
    color: '#D9822B',
    category: 'quick',
    tagline: 'Fastest thumb on campus',
    players: 'Solo or 2 on one phone',
    description:
      'Wait for green, then tap! Test your reaction time solo, or put the phone on the table and battle a friend split-screen.',
    howTo: [
      'Wait for the screen to say TAP — tapping early costs you.',
      'Duel: each player gets half the screen. First to 5 points wins.',
    ],
    modes: ['solo', 'local'],
    badge: 'PARTY',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    emoji: '🧠',
    color: '#B8637F',
    category: 'brain',
    tagline: 'Flip cards, find pairs',
    players: 'Solo or 2 on one phone',
    description:
      'Flip two cards at a time and find all the matching pairs. Solo for your best score, or take turns with a friend.',
    howTo: [
      'Flip two cards. A match keeps them face up.',
      'Two players: finding a pair gives you another turn.',
    ],
    modes: ['solo', 'local'],
    badge: 'NEW',
  },
  {
    id: 'game2048',
    name: '2048',
    emoji: '🔢',
    color: '#C9A23A',
    category: 'brain',
    tagline: 'Merge tiles to 2048',
    players: 'Solo',
    description:
      'Slide the tiles, merge matching numbers and try to reach the 2048 tile. Dangerously addictive during boring lectures.',
    howTo: ['Swipe, use the arrow pad, or press arrow keys.', 'Equal tiles merge into one.'],
    modes: ['solo'],
    badge: 'NEW',
  },
  {
    id: 'hangman',
    name: 'Hangman',
    emoji: '🔤',
    color: '#A88B6A',
    category: 'brain',
    tagline: 'Guess the word, letter by letter',
    players: 'Solo or 2 on one phone',
    description:
      'Guess the hidden word before you run out of tries. Solo uses campus-themed words; with a friend, one of you secretly types the word.',
    howTo: [
      'Tap letters to guess. Right letters fill in the blanks.',
      'Six wrong guesses and the round is lost.',
      'Two players: take turns setting the secret word.',
    ],
    modes: ['solo', 'local'],
    badge: 'NEW',
  },
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    emoji: '✊',
    color: '#7C93B5',
    category: 'quick',
    tagline: 'Best of five, no take-backs',
    players: 'Vs AI or 2 on one phone',
    description:
      'The oldest decision-maker there is. Play the AI (it learns your habits) or settle it with a friend on one phone — picks stay hidden until both have chosen.',
    howTo: [
      'Rock beats scissors, scissors beats paper, paper beats rock.',
      'First to 3 round wins takes the match.',
    ],
    modes: ['bot', 'local'],
    badge: 'NEW',
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    emoji: '💣',
    color: '#8E8A80',
    category: 'brain',
    tagline: 'Clear the field, avoid the mines',
    players: 'Solo',
    description:
      'Use the numbers to work out where the mines are hiding. Clear every safe square to win. Your first tap is always safe.',
    howTo: [
      'Tap a square to reveal it. A number tells you how many mines touch it.',
      'Long-press (or switch to flag mode) to flag a mine.',
      'Reveal every safe square to win.',
    ],
    modes: ['solo'],
    badge: 'NEW',
  },
];

// Step-by-step demos for new players. `art` is a small text/emoji picture shown above the text.
// Turn-based games also get a live "watch the AI play" step automatically (see DemoModal).
export const DEMOS = {
  ludo: [
    { art: '🎲  6  →  🔴 out of base', title: 'Roll a 6 to start', text: 'Your tokens start in your base. You need a 6 to bring one onto the board.' },
    { art: '🔴 ➝ ➝ ➝ ➝', title: 'Move by the dice', text: 'Tap a token to move it forward by the number you rolled.' },
    { art: '🔴 ➝ 🟡  =  🟡 back home', title: 'Capture', text: 'Land exactly on an opponent to send them back to their base. Star squares ⭐ are safe.' },
    { art: '🎲 6  =  roll again', title: 'Bonus rolls', text: 'Rolling a 6 or getting a token home gives you another roll.' },
    { art: '🔴🔴🔴🔴  →  🏠', title: 'Win', text: 'First player to get all four tokens into the centre wins.' },
  ],
  chess: [
    { art: '♙ ↑    ♙ ↗ captures', title: 'Pawns', text: 'Pawns move one square forward (two on their first move) and capture diagonally.' },
    { art: '♘  L-shape, jumps', title: 'Knights', text: 'Knights move in an L: two squares one way, one square sideways. They can jump over pieces.' },
    { art: '♗ ↗↘   ♖ ↑→   ♕ both', title: 'Bishops, rooks, queen', text: 'Bishops move diagonally, rooks in straight lines, and the queen can do both.' },
    { art: '♔  one square', title: 'The king', text: 'The king moves one square in any direction. Keep it safe!' },
    { art: '♔ ✖  no escape = checkmate', title: 'Checkmate wins', text: 'If the enemy king is attacked and has no way out, you win.' },
  ],
  tictactoe: [
    { art: '·  ·  ·\n·  ✕  ·\n·  ·  ·', title: 'Take turns', text: 'Players take turns putting their mark (✕ or ○) in an empty square.' },
    { art: '✕  ✕  ✕\n○  ○  ·\n·  ·  ·', title: 'Three in a row', text: 'Get three of your marks in a row — across, down or diagonally — to win.' },
    { art: '✕  ○  ✕\n✕  ○  ○\n○  ✕  ✕', title: 'Full board = draw', text: 'If the board fills up with no winner, it\'s a draw.' },
  ],
  connect4: [
    { art: '⬇️\n⚪⚪⚪⚪\n⚪⚪⚪⚪\n🔴⚪⚪⚪', title: 'Drop a disc', text: 'Tap a column. Your disc falls to the lowest empty space.' },
    { art: '⚪⚪⚪⚪\n🔴🟡⚪⚪\n🔴🟡⚪⚪\n🔴🟡🟡⚪\n🔴⚪⚪⚪', title: 'Connect four', text: 'Line up four of your discs — across, down or diagonal — to win.' },
    { art: '🔴🔴🔴 ⬅ block!', title: 'Watch out', text: 'If your opponent has three in a row, block the fourth spot!' },
  ],
  dotsboxes: [
    { art: '•──•   •\n         \n•   •   •', title: 'Draw a line', text: 'On your turn, tap the gap between two dots to draw a line.' },
    { art: '•──•\n│ P1 │\n•──•', title: 'Close a box', text: 'Draw the 4th side of a box and it\'s yours. You also get another turn!' },
    { art: '•──•\n│     \n•──•  ⚠️', title: 'Don\'t give boxes away', text: 'Avoid drawing the 3rd side of a box — your opponent will close it.' },
    { art: '🟦 7  vs  🟪 9', title: 'Most boxes wins', text: 'When every box is claimed, the player with the most boxes wins.' },
  ],
  snake: [
    { art: '🟩🟩🟩➡️     🟡', title: 'Steer the snake', text: 'Swipe, use the arrow pad, or press arrow keys / WASD to change direction.' },
    { art: '🟩🟩🟩🟩🟩➡️', title: 'Eat to grow', text: 'Each piece of food makes you longer and scores a point. The game speeds up as you score.' },
    { art: '🟩🟩➡️🧱  💥', title: 'Don\'t crash', text: 'Hitting a wall, yourself or the other snake ends your run.' },
    { art: '🟩 vs 🟪  first to 15', title: 'Duel mode', text: 'Race the AI snake for food. First to 15 points — or the last snake alive — wins.' },
  ],
  reaction: [
    { art: '🟥  wait…', title: 'Wait for it', text: 'The pad turns red. Don\'t tap yet!' },
    { art: '🟩  TAP!', title: 'Then tap fast', text: 'The moment it turns green, tap as fast as you can.' },
    { art: '🟥 👆 = too early', title: 'No cheating', text: 'Tapping on red costs you — in a duel, the point goes to your opponent.' },
    { art: '📱 P1 ⬆   ⬇ P2', title: 'Duel', text: 'Put the phone flat between you. Each player taps their own half. First to 5 wins.' },
  ],
  memory: [
    { art: '❔ ❔ ❔ ❔\n❔ ❔ ❔ ❔', title: 'Cards face down', text: 'All cards start face down. Each picture appears exactly twice.' },
    { art: '🍕 ❔ ❔ 🎧', title: 'Flip two', text: 'Flip two cards. If they don\'t match, they flip back — try to remember them!' },
    { art: '🍕 ❔ ❔ 🍕  ✅', title: 'Find pairs', text: 'Matching cards stay face up. With two players, a match gives you another turn.' },
  ],
  game2048: [
    { art: '2  ·  ·  2   ⬅️', title: 'Slide', text: 'Swipe in a direction and every tile slides as far as it can.' },
    { art: '2 + 2  →  4', title: 'Merge', text: 'Two tiles with the same number merge into one with their sum.' },
    { art: '1024 + 1024 → 2048 🎉', title: 'Reach 2048', text: 'Keep merging to build the 2048 tile. The game ends when no move is possible.' },
  ],
  hangman: [
    { art: '_ _ _ _ _ _ _', title: 'A hidden word', text: 'Each blank is a letter of the secret word.' },
    { art: 'L _ B _ A _ _', title: 'Guess letters', text: 'Tap a letter. If it\'s in the word, every copy of it is revealed.' },
    { art: '❤️❤️❤️❤️🖤🖤', title: 'Six lives', text: 'Each wrong letter costs a life. Lose all six and the round is over.' },
    { art: '🤫 P1 types → P2 guesses', title: 'Two players', text: 'One player secretly types a word, the other guesses. Then swap.' },
  ],
  rps: [
    { art: '✊ > ✌️   ✌️ > ✋   ✋ > ✊', title: 'The rules', text: 'Rock beats scissors, scissors beats paper, paper beats rock. Same pick = tie.' },
    { art: '🙈 P1 picks → 🙈 P2 picks → reveal', title: 'Hidden picks', text: 'In pass & play, each player picks while the other looks away. Then both are revealed.' },
    { art: '🏆  first to 3', title: 'Best of five', text: 'First to win 3 rounds takes the match. The AI learns your favourite moves — mix it up!' },
  ],
  minesweeper: [
    { art: '⬜ ⬜ ⬜\n⬜ 👆 ⬜\n⬜ ⬜ ⬜', title: 'Tap to reveal', text: 'Tap any square. Your first tap is always safe and usually opens up an area.' },
    { art: '1  1  1\n1  💣 1\n1  1  1', title: 'Read the numbers', text: 'A number shows how many mines touch that square (including diagonals).' },
    { art: '🚩 = mine here', title: 'Flag mines', text: 'Long-press, or switch to flag mode, to mark a square you think has a mine.' },
    { art: '✅ all safe squares open', title: 'Win', text: 'Reveal every square that isn\'t a mine. Hit a mine and it\'s game over.' },
  ],
};

export const getGame = (id) => GAMES.find((g) => g.id === id);

// Turn-based games that share the generic TurnGameScreen + online relay.
export const TURN_GAMES = ['tictactoe', 'connect4', 'dotsboxes'];

export const MODE_INFO = {
  online: {
    label: 'Play with Friends',
    sub: 'Private room or invite a friend online',
    icon: 'people',
  },
  bot: { label: 'Play vs AI', sub: 'Challenge the computer', icon: 'hardware-chip-outline' },
  local: {
    label: 'Pass & Play',
    sub: 'Two players on this device',
    icon: 'phone-portrait-outline',
  },
  solo: { label: 'Play Solo', sub: 'Beat your best score', icon: 'person' },
};
