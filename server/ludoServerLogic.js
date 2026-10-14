// Ludo Game Logic & Rules Engine

const SAFE_MAIN_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Color indices:
// 0: Red, 1: Green, 2: Yellow, 3: Blue
const COLOR_CONFIG = [
  { id: 'red', name: 'Red', hex: '#EF4444', startCell: 0 },
  { id: 'green', name: 'Green', hex: '#10B981', startCell: 13 },
  { id: 'yellow', name: 'Yellow', hex: '#F59E0B', startCell: 26 },
  { id: 'blue', name: 'Blue', hex: '#3B82F6', startCell: 39 },
];

const TOTAL_PATH_STEPS = 56; // 0..50 main board, 51..55 home column, 56 is home goal

class LudoGame {
  constructor(roomId, players, options = {}) {
    this.roomId = roomId;
    // players: array of { id, username, avatar, isBot }
    this.players = players;
    this.playerCount = players.length; // 2, 3, or 4
    this.options = options;

    // Map players to colors
    // In 2-player mode, we can use Red (0) and Yellow (2) or Red and Green
    this.colorAssignments = [];
    if (this.playerCount === 2) {
      this.colorAssignments = [0, 2]; // Red & Yellow (opposite sides)
    } else if (this.playerCount === 3) {
      this.colorAssignments = [0, 1, 2];
    } else {
      this.colorAssignments = [0, 1, 2, 3];
    }

    // tokens: colorIndex -> [step0, step1, step2, step3] (-1 means in yard, 56 means in home)
    this.tokens = {};
    this.colorAssignments.forEach((cIdx) => {
      this.tokens[cIdx] = [-1, -1, -1, -1];
    });

    this.currentTurnIndex = 0; // index into colorAssignments
    this.currentDice = null;
    this.diceRolled = false;
    this.consecutiveSixes = 0;
    this.winner = null;
    this.rankings = []; // array of finished playerIds
    this.gameStatus = 'in_progress'; // 'waiting', 'in_progress', 'finished'
    this.legalMoves = []; // array of token indices { tokenIndex, fromStep, toStep }
    this.lastAction = { type: 'start', message: 'Game started!' };
    this.turnTimer = 20; // seconds
  }

  getCurrentColor() {
    return this.colorAssignments[this.currentTurnIndex];
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  // Converts a player's step (0..56) to board coordinates or cell id
  // step -1: Yard
  // step 0..50: Main track cell index = (startCell + step) % 52
  // step 51..55: Home stretch 1..5 for this color
  // step 56: Home center pocket
  getBoardLocation(colorIndex, step) {
    if (step === -1) return { type: 'yard', colorIndex };
    if (step === 56) return { type: 'home', colorIndex };
    if (step >= 51 && step <= 55) {
      return { type: 'home_stretch', colorIndex, step: step - 50 };
    }
    const startCell = COLOR_CONFIG[colorIndex].startCell;
    const cellIndex = (startCell + step) % 52;
    return { type: 'main', cellIndex, isSafe: SAFE_MAIN_CELLS.has(cellIndex) };
  }

  // Check which tokens can move with rolled dice
  calculateLegalMoves(colorIndex, diceValue) {
    const playerTokens = this.tokens[colorIndex];
    const legalMoves = [];

    playerTokens.forEach((step, tokenIndex) => {
      // If token in yard: can only move out if dice is 6
      if (step === -1) {
        if (diceValue === 6) {
          legalMoves.push({
            tokenIndex,
            fromStep: -1,
            toStep: 0,
            type: 'spawn',
          });
        }
      } else if (step >= 0 && step < TOTAL_PATH_STEPS) {
        const nextStep = step + diceValue;
        if (nextStep <= TOTAL_PATH_STEPS) {
          legalMoves.push({
            tokenIndex,
            fromStep: step,
            toStep: nextStep,
            type: nextStep === TOTAL_PATH_STEPS ? 'reach_home' : 'move',
          });
        }
      }
    });

    return legalMoves;
  }

  // Roll dice for current player
  rollDice(requestedByPlayerId, forcedDice = null) {
    const currentPlayer = this.getCurrentPlayer();
    if (requestedByPlayerId !== currentPlayer.id && !currentPlayer.isBot) {
      return { success: false, message: 'Not your turn' };
    }

    if (this.diceRolled) {
      return { success: false, message: 'Dice already rolled for this turn' };
    }

    const dice = forcedDice ? forcedDice : Math.floor(Math.random() * 6) + 1;
    this.currentDice = dice;
    this.diceRolled = true;

    if (dice === 6) {
      this.consecutiveSixes += 1;
    } else {
      this.consecutiveSixes = 0;
    }

    // 3 consecutive 6s rule: player forfeits turn
    if (this.consecutiveSixes >= 3) {
      this.lastAction = {
        type: 'three_sixes',
        message: `${currentPlayer.username} rolled three 6s in a row! Turn skipped.`,
        dice,
      };
      this.consecutiveSixes = 0;
      this.nextTurn();
      return {
        success: true,
        dice,
        legalMoves: [],
        autoMoved: false,
        turnPassed: true,
        state: this.getState(),
      };
    }

    const currentColor = this.getCurrentColor();
    this.legalMoves = this.calculateLegalMoves(currentColor, dice);

    this.lastAction = {
      type: 'roll',
      message: `${currentPlayer.username} rolled a ${dice}!`,
      dice,
      player: currentPlayer.username,
      color: COLOR_CONFIG[currentColor].name,
    };

    // If no legal moves, turn automatically passes
    if (this.legalMoves.length === 0) {
      this.nextTurn();
      return {
        success: true,
        dice,
        legalMoves: [],
        autoMoved: false,
        turnPassed: true,
        state: this.getState(),
      };
    }

    return {
      success: true,
      dice,
      legalMoves: this.legalMoves,
      autoMoved: false,
      turnPassed: false,
      state: this.getState(),
    };
  }

  // Move selected token
  moveToken(requestedByPlayerId, tokenIndex) {
    const currentPlayer = this.getCurrentPlayer();
    if (requestedByPlayerId !== currentPlayer.id && !currentPlayer.isBot) {
      return { success: false, message: 'Not your turn' };
    }

    if (!this.diceRolled) {
      return { success: false, message: 'Roll the dice first' };
    }

    const move = this.legalMoves.find((m) => m.tokenIndex === tokenIndex);
    if (!move) {
      return { success: false, message: 'Illegal token move' };
    }

    const currentColor = this.getCurrentColor();
    this.tokens[currentColor][tokenIndex] = move.toStep;

    let bonusTurn = false;
    let captureInfo = null;

    // Check for capture if landing on main board (step 0..50)
    if (move.toStep >= 0 && move.toStep <= 50) {
      const myLoc = this.getBoardLocation(currentColor, move.toStep);
      if (!myLoc.isSafe) {
        // Check tokens of other players
        for (const [otherColorStr, otherTokens] of Object.entries(this.tokens)) {
          const otherColor = parseInt(otherColorStr, 10);
          if (otherColor === currentColor) continue;

          otherTokens.forEach((otherStep, oIdx) => {
            if (otherStep >= 0 && otherStep <= 50) {
              const otherLoc = this.getBoardLocation(otherColor, otherStep);
              if (otherLoc.cellIndex === myLoc.cellIndex) {
                // CAPTURE!
                this.tokens[otherColor][oIdx] = -1; // Send back to yard
                const victimPlayer = this.players[this.colorAssignments.indexOf(otherColor)];
                captureInfo = {
                  capturedColor: otherColor,
                  capturedTokenIndex: oIdx,
                  victimUsername: victimPlayer ? victimPlayer.username : 'Opponent',
                };
                bonusTurn = true; // Capturing grants bonus turn!
              }
            }
          });
        }
      }
    }

    // Check if token reached Home goal
    if (move.toStep === TOTAL_PATH_STEPS) {
      bonusTurn = true; // Reaching home gives bonus roll!
    }

    // Check if rolling 6 grants bonus turn
    if (this.currentDice === 6) {
      bonusTurn = true;
    }

    // Check victory condition: all 4 tokens at 56
    const hasWon = this.tokens[currentColor].every((s) => s === TOTAL_PATH_STEPS);
    if (hasWon && !this.rankings.includes(currentPlayer.id)) {
      this.rankings.push(currentPlayer.id);
      if (this.rankings.length === 1) {
        this.winner = currentPlayer;
      }
      if (this.rankings.length >= this.playerCount - 1) {
        this.gameStatus = 'finished';
      }
    }

    // Action summary message
    let actionMsg = `${currentPlayer.username} moved token #${tokenIndex + 1}`;
    if (captureInfo) {
      actionMsg += ` and captured ${captureInfo.victimUsername}'s token! 💥 Extra roll!`;
    } else if (move.toStep === TOTAL_PATH_STEPS) {
      actionMsg += ` reached Home! 🏆 Extra roll!`;
    } else if (this.currentDice === 6) {
      actionMsg += ` with a 6! 🎲 Extra roll!`;
    }

    this.lastAction = {
      type: 'move',
      message: actionMsg,
      tokenIndex,
      fromStep: move.fromStep,
      toStep: move.toStep,
      color: COLOR_CONFIG[currentColor].name,
      capture: captureInfo,
      bonusTurn,
    };

    // If game ended, finish
    if (this.gameStatus === 'finished') {
      return {
        success: true,
        finished: true,
        winner: this.winner,
        state: this.getState(),
      };
    }

    // Turn management
    if (bonusTurn) {
      // Current player rolls again!
      this.diceRolled = false;
      this.currentDice = null;
      this.legalMoves = [];
    } else {
      this.nextTurn();
    }

    return {
      success: true,
      capture: captureInfo,
      bonusTurn,
      state: this.getState(),
    };
  }

  nextTurn() {
    this.diceRolled = false;
    this.currentDice = null;
    this.legalMoves = [];

    // Advance to next active player
    let attempts = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.colorAssignments.length;
      attempts++;
      const currentPid = this.getCurrentPlayer().id;
      // Skip if this player has already finished all tokens
      if (!this.rankings.includes(currentPid)) {
        break;
      }
    } while (attempts < this.colorAssignments.length);
  }

  // Bot AI decision maker
  getBotMove() {
    const currentColor = this.getCurrentColor();
    const moves = this.legalMoves;
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    // Priority 1: Captures
    for (const move of moves) {
      if (move.toStep >= 0 && move.toStep <= 50) {
        const loc = this.getBoardLocation(currentColor, move.toStep);
        if (!loc.isSafe) {
          for (const [oColorStr, oTokens] of Object.entries(this.tokens)) {
            const oColor = parseInt(oColorStr, 10);
            if (oColor === currentColor) continue;
            for (const oStep of oTokens) {
              if (oStep >= 0 && oStep <= 50) {
                const oLoc = this.getBoardLocation(oColor, oStep);
                if (oLoc.cellIndex === loc.cellIndex) {
                  return move;
                }
              }
            }
          }
        }
      }
    }

    // Priority 2: Reaching Home
    const homeMove = moves.find((m) => m.toStep === TOTAL_PATH_STEPS);
    if (homeMove) return homeMove;

    // Priority 3: Spawn from yard
    const spawnMove = moves.find((m) => m.type === 'spawn');
    if (spawnMove) return spawnMove;

    // Priority 4: Furthest token
    moves.sort((a, b) => b.toStep - a.toStep);
    return moves[0];
  }

  getState() {
    return {
      roomId: this.roomId,
      gameType: 'ludo',
      players: this.players,
      colorAssignments: this.colorAssignments,
      tokens: this.tokens,
      currentTurnIndex: this.currentTurnIndex,
      currentColor: this.getCurrentColor(),
      currentPlayer: this.getCurrentPlayer(),
      currentDice: this.currentDice,
      diceRolled: this.diceRolled,
      legalMoves: this.legalMoves,
      winner: this.winner,
      rankings: this.rankings,
      gameStatus: this.gameStatus,
      lastAction: this.lastAction,
      colorConfig: COLOR_CONFIG,
      safeCells: Array.from(SAFE_MAIN_CELLS),
    };
  }
}

module.exports = {
  LudoGame,
  COLOR_CONFIG,
  SAFE_MAIN_CELLS,
};
