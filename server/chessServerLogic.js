// Chess Game Engine for FastGame Server using chess.js with AI bot support

const { Chess } = require('chess.js');

// Piece square table approximations for bot evaluation
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

class ChessGame {
  constructor(roomId, whitePlayer, blackPlayer, options = {}) {
    this.roomId = roomId;
    this.whitePlayer = whitePlayer; // { id, username, avatar, isBot }
    this.blackPlayer = blackPlayer; // { id, username, avatar, isBot }
    this.options = options;
    this.timeControlMinutes = options.timeControlMinutes || 10;

    this.chess = new Chess();
    this.moveHistory = [];
    this.gameStatus = 'in_progress'; // 'in_progress', 'checkmate', 'stalemate', 'draw', 'resigned', 'timeout'
    this.winner = null;
    this.winReason = null;

    // Timers in seconds
    this.whiteTime = this.timeControlMinutes * 60;
    this.blackTime = this.timeControlMinutes * 60;
    this.lastMoveTimestamp = Date.now();

    this.drawOffer = null; // playerId who offered draw
    this.capturedWhite = []; // Pieces black captured
    this.capturedBlack = []; // Pieces white captured
  }

  getCurrentTurn() {
    return this.chess.turn(); // 'w' or 'b'
  }

  getCurrentPlayer() {
    return this.chess.turn() === 'w' ? this.whitePlayer : this.blackPlayer;
  }

  updateClocks() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.lastMoveTimestamp) / 1000);
    if (elapsedSeconds > 0) {
      if (this.getCurrentTurn() === 'w') {
        this.whiteTime = Math.max(0, this.whiteTime - elapsedSeconds);
        if (this.whiteTime === 0) {
          this.gameStatus = 'timeout';
          this.winner = this.blackPlayer;
          this.winReason = 'White ran out of time!';
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - elapsedSeconds);
        if (this.blackTime === 0) {
          this.gameStatus = 'timeout';
          this.winner = this.whitePlayer;
          this.winReason = 'Black ran out of time!';
        }
      }
      this.lastMoveTimestamp = now;
    }
  }

  makeMove(playerId, moveData) {
    if (this.gameStatus !== 'in_progress') {
      return { success: false, message: 'Game has already ended' };
    }

    const currentPlayer = this.getCurrentPlayer();
    if (playerId !== currentPlayer.id && !currentPlayer.isBot) {
      return { success: false, message: 'Not your turn' };
    }

    this.updateClocks();
    if (this.gameStatus === 'timeout') {
      return { success: false, message: this.winReason, state: this.getState() };
    }

    try {
      // moveData: { from: 'e2', to: 'e4', promotion: 'q' }
      const move = this.chess.move(moveData);
      if (!move) {
        return { success: false, message: 'Illegal move' };
      }

      this.moveHistory.push({
        san: move.san,
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        fen: this.chess.fen(),
      });

      if (move.captured) {
        if (move.color === 'w') {
          this.capturedBlack.push(move.captured);
        } else {
          this.capturedWhite.push(move.captured);
        }
      }

      // Check game-ending conditions
      if (this.chess.isCheckmate()) {
        this.gameStatus = 'checkmate';
        this.winner = currentPlayer;
        this.winReason = `Checkmate! ${currentPlayer.username} wins!`;
      } else if (this.chess.isStalemate()) {
        this.gameStatus = 'stalemate';
        this.winReason = 'Draw by stalemate!';
      } else if (this.chess.isDraw()) {
        this.gameStatus = 'draw';
        this.winReason = 'Draw (insufficient material or 50-move rule)!';
      }

      this.lastMoveTimestamp = Date.now();

      return {
        success: true,
        move,
        inCheck: this.chess.inCheck(),
        isGameOver: this.gameStatus !== 'in_progress',
        state: this.getState(),
      };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid move' };
    }
  }

  resign(playerId) {
    if (this.gameStatus !== 'in_progress') return { success: false };

    if (playerId === this.whitePlayer.id) {
      this.gameStatus = 'resigned';
      this.winner = this.blackPlayer;
      this.winReason = `${this.whitePlayer.username} resigned.`;
    } else if (playerId === this.blackPlayer.id) {
      this.gameStatus = 'resigned';
      this.winner = this.whitePlayer;
      this.winReason = `${this.blackPlayer.username} resigned.`;
    }

    return { success: true, state: this.getState() };
  }

  offerDraw(playerId) {
    if (this.drawOffer === playerId) return { success: false, message: 'Draw already offered' };
    this.drawOffer = playerId;
    return { success: true, offeredBy: playerId };
  }

  respondDraw(playerId, accept) {
    if (!this.drawOffer || this.drawOffer === playerId) {
      return { success: false };
    }

    if (accept) {
      this.gameStatus = 'draw';
      this.winReason = 'Draw agreed by both players!';
      this.drawOffer = null;
      return { success: true, state: this.getState() };
    } else {
      this.drawOffer = null;
      return { success: true, state: this.getState() };
    }
  }

  // Smart Chess AI Bot
  getBotMove(difficulty = 'medium') {
    const moves = this.chess.moves({ verbose: true });
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
      // Pick random legal move
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // Medium / Hard: evaluate 1-2 plies ahead
    let bestMove = null;
    let bestScore = this.chess.turn() === 'w' ? -999999 : 999999;

    for (const move of moves) {
      this.chess.move(move);
      let score = this.evaluateBoard();

      // If opponent can checkmate on next move, penalize
      if (this.chess.isCheckmate()) {
        score = this.chess.turn() === 'w' ? 999999 : -999999;
      }

      this.chess.undo();

      if (this.chess.turn() === 'w') {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove || moves[0];
  }

  evaluateBoard() {
    let score = 0;
    const board = this.chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = PIECE_VALUES[piece.type] || 0;
          // Center control bonus
          let centerBonus = 0;
          if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
            centerBonus = 15;
          }
          if (piece.color === 'w') {
            score += val + centerBonus;
          } else {
            score -= val + centerBonus;
          }
        }
      }
    }

    return score;
  }

  getState() {
    return {
      roomId: this.roomId,
      gameType: 'chess',
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      whitePlayer: this.whitePlayer,
      blackPlayer: this.blackPlayer,
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      inCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      gameStatus: this.gameStatus,
      winner: this.winner,
      winReason: this.winReason,
      moveHistory: this.moveHistory,
      capturedWhite: this.capturedWhite,
      capturedBlack: this.capturedBlack,
      drawOffer: this.drawOffer,
    };
  }
}

module.exports = {
  ChessGame,
};
