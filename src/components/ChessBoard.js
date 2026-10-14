import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { COLORS } from '../theme/colors';
import soundService from '../services/soundService';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Unicode symbols for chess pieces
const CHESS_SYMBOLS = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

export default function ChessBoard({
  gameState, // from chess.js
  chessEngine, // local chess.js instance
  currentUserId,
  playerColor = 'w', // 'w' or 'b'
  onMakeMove,
  onResign,
  onOfferDraw,
}) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 24, 440);
  const squareSize = boardSize / 8;

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [promotionPending, setPromotionPending] = useState(null); // { from, to }

  const turn = gameState?.turn || chessEngine?.turn() || 'w';
  const isMyTurn = (playerColor === 'both') || (turn === playerColor);
  const inCheck = gameState?.inCheck || chessEngine?.inCheck();
  const moveHistory = gameState?.moveHistory || [];
  const lastMove = moveHistory[moveHistory.length - 1];

  // Parse FEN or board matrix from engine
  const board = chessEngine ? chessEngine.board() : [];

  const handleSquarePress = (file, rank, squareKey) => {
    if (!isMyTurn) return;

    // If already selected and clicked another square
    if (selectedSquare) {
      if (selectedSquare === squareKey) {
        // Deselect
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicked square is a legal destination
      const validMove = legalMoves.find((m) => m.to === squareKey);
      if (validMove) {
        // Check for pawn promotion (pawn reaching 8th rank for white or 1st for black)
        const piece = chessEngine?.get(selectedSquare);
        if (
          piece?.type === 'p' &&
          ((piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1'))
        ) {
          setPromotionPending({ from: selectedSquare, to: squareKey });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        executeMove(selectedSquare, squareKey, 'q');
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Select piece
    const piece = chessEngine?.get(squareKey);
    if (piece && (playerColor === 'both' || piece.color === playerColor)) {
      setSelectedSquare(squareKey);
      // Calculate legal moves for this piece
      const moves = chessEngine.moves({ square: squareKey, verbose: true });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const executeMove = (from, to, promotion = 'q') => {
    const isCapture = !!chessEngine?.get(to);
    soundService.playMove();
    if (isCapture) soundService.playCapture();

    onMakeMove({ from, to, promotion });

    if (inCheck) {
      soundService.playCheck();
    }
  };

  const handlePromotionSelect = (promoPiece) => {
    if (!promotionPending) return;
    executeMove(promotionPending.from, promotionPending.to, promoPiece);
    setPromotionPending(null);
  };

  // Format time (seconds -> MM:SS)
  const formatTime = (secs) => {
    if (secs == null) return '10:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Top Player (Black by default if user is White) */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerAvatar}>
            {playerColor === 'w' ? gameState?.blackPlayer?.avatar || '🤖' : gameState?.whitePlayer?.avatar || '👤'}
          </Text>
          <View>
            <Text style={styles.playerName}>
              {playerColor === 'w'
                ? gameState?.blackPlayer?.username || 'Black'
                : gameState?.whitePlayer?.username || 'White'}
            </Text>
            <Text style={styles.playerPieces}>
              {(playerColor === 'w' ? gameState?.capturedBlack : gameState?.capturedWhite)?.join(' ') || ''}
            </Text>
          </View>
        </View>

        {/* Clock */}
        <View
          style={[
            styles.clockBadge,
            turn === (playerColor === 'w' ? 'b' : 'w') && styles.clockBadgeActive,
          ]}
        >
          <Text style={styles.clockText}>
            {formatTime(playerColor === 'w' ? gameState?.blackTime : gameState?.whiteTime)}
          </Text>
        </View>
      </View>

      {/* CHESS BOARD 8x8 */}
      <View style={[styles.boardWrapper, { width: boardSize, height: boardSize }]}>
        {RANKS.map((rank, rIdx) => {
          return (
            <View key={rank} style={styles.boardRow}>
              {FILES.map((file, cIdx) => {
                const squareKey = `${file}${rank}`;
                const isLight = (rIdx + cIdx) % 2 === 0;
                const piece = chessEngine?.get(squareKey);
                const isSelected = selectedSquare === squareKey;
                const isLegalDest = legalMoves.some((m) => m.to === squareKey);
                const isLastMoveSquare =
                  lastMove && (lastMove.from === squareKey || lastMove.to === squareKey);
                const isKingInCheck =
                  inCheck && piece?.type === 'k' && piece?.color === turn;

                return (
                  <TouchableOpacity
                    key={squareKey}
                    style={[
                      styles.square,
                      {
                        width: squareSize,
                        height: squareSize,
                        backgroundColor: isLight ? '#CBD5E1' : '#475569',
                      },
                      isLastMoveSquare && { backgroundColor: '#A78BFA' },
                      isSelected && { backgroundColor: '#F59E0B' },
                      isKingInCheck && { backgroundColor: '#EF4444' },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSquarePress(file, rank, squareKey)}
                  >
                    {/* Rank / File notations */}
                    {cIdx === 0 && (
                      <Text
                        style={[
                          styles.rankLabel,
                          { color: isLight ? '#64748B' : '#E2E8F0' },
                        ]}
                      >
                        {rank}
                      </Text>
                    )}
                    {rIdx === 7 && (
                      <Text
                        style={[
                          styles.fileLabel,
                          { color: isLight ? '#64748B' : '#E2E8F0' },
                        ]}
                      >
                        {file}
                      </Text>
                    )}

                    {/* Chess Piece Symbol */}
                    {piece && (
                      <Text
                        style={[
                          styles.pieceText,
                          {
                            fontSize: squareSize * 0.72,
                            color: piece.color === 'w' ? '#FFFFFF' : '#111827',
                            textShadowColor:
                              piece.color === 'w' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.4)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                          },
                        ]}
                      >
                        {CHESS_SYMBOLS[piece.color][piece.type]}
                      </Text>
                    )}

                    {/* Legal Move Indicator Dot */}
                    {isLegalDest && !piece && <View style={styles.legalDot} />}
                    {isLegalDest && piece && <View style={styles.captureRing} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>

      {/* Bottom Player (White by default) */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerAvatar}>
            {playerColor === 'w' ? gameState?.whitePlayer?.avatar || '👤' : gameState?.blackPlayer?.avatar || '👤'}
          </Text>
          <View>
            <Text style={styles.playerName}>
              {playerColor === 'w'
                ? gameState?.whitePlayer?.username || 'You (White)'
                : gameState?.blackPlayer?.username || 'You (Black)'}
            </Text>
            <Text style={styles.playerPieces}>
              {(playerColor === 'w' ? gameState?.capturedWhite : gameState?.capturedBlack)?.join(' ') || ''}
            </Text>
          </View>
        </View>

        {/* Clock */}
        <View
          style={[
            styles.clockBadge,
            turn === (playerColor === 'w' ? 'w' : 'b') && styles.clockBadgeActive,
          ]}
        >
          <Text style={styles.clockText}>
            {formatTime(playerColor === 'w' ? gameState?.whiteTime : gameState?.blackTime)}
          </Text>
        </View>
      </View>

      {/* Match Actions (Resign, Draw Offer) */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onOfferDraw}>
          <Text style={styles.actionBtnText}>🤝 Offer Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.resignBtn]} onPress={onResign}>
          <Text style={[styles.actionBtnText, styles.resignText]}>🏳️ Resign</Text>
        </TouchableOpacity>
      </View>

      {/* Pawn Promotion Dialog */}
      <Modal visible={!!promotionPending} transparent animationType="fade">
        <View style={styles.promoOverlay}>
          <View style={styles.promoCard}>
            <Text style={styles.promoTitle}>Promote Pawn</Text>
            <Text style={styles.promoSub}>Select a piece to promote to:</Text>
            <View style={styles.promoRow}>
              {['q', 'r', 'b', 'n'].map((pType) => (
                <TouchableOpacity
                  key={pType}
                  style={styles.promoOption}
                  onPress={() => handlePromotionSelect(pType)}
                >
                  <Text style={styles.promoPieceText}>
                    {CHESS_SYMBOLS[turn][pType]}
                  </Text>
                  <Text style={styles.promoPieceName}>
                    {pType === 'q' ? 'Queen' : pType === 'r' ? 'Rook' : pType === 'b' ? 'Bishop' : 'Knight'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 440,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatar: {
    fontSize: 24,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  playerPieces: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  clockBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clockBadgeActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  clockText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  boardWrapper: {
    borderRadius: 14,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  boardRow: {
    flexDirection: 'row',
    flex: 1,
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  fileLabel: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  pieceText: {
    fontWeight: '900',
    userSelect: 'none',
  },
  legalDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(6, 182, 212, 0.75)',
  },
  captureRing: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.danger,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 440,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  resignBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resignText: {
    color: COLORS.danger,
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
  },
  promoTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  promoSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  promoOption: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: 70,
  },
  promoPieceText: {
    fontSize: 34,
    color: COLORS.text,
  },
  promoPieceName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: 'bold',
  },
});
