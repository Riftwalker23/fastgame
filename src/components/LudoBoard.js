import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import soundService from '../services/soundService';

// 52-cell track coordinates on 15x15 grid [row, col]
const TRACK_COORDS = [
  [6, 1],   // 0 (Red Start, Safe ★)
  [6, 2],   // 1
  [6, 3],   // 2
  [6, 4],   // 3
  [6, 5],   // 4
  [5, 6],   // 5
  [4, 6],   // 6
  [3, 6],   // 7
  [2, 6],   // 8 (Safe ★)
  [1, 6],   // 9
  [0, 6],   // 10
  [0, 7],   // 11
  [0, 8],   // 12
  [1, 8],   // 13 (Green Start, Safe ★)
  [2, 8],   // 14
  [3, 8],   // 15
  [4, 8],   // 16
  [5, 8],   // 17
  [6, 9],   // 18
  [6, 10],  // 19
  [6, 11],  // 20
  [6, 12],  // 21 (Safe ★)
  [6, 13],  // 22
  [6, 14],  // 23
  [7, 14],  // 24
  [8, 14],  // 25
  [8, 13],  // 26 (Yellow Start, Safe ★)
  [8, 12],  // 27
  [8, 11],  // 28
  [8, 10],  // 29
  [8, 9],   // 30
  [9, 8],   // 31
  [10, 8],  // 32
  [11, 8],  // 33
  [12, 8],  // 34 (Safe ★)
  [13, 8],  // 35
  [14, 8],  // 36
  [14, 7],  // 37
  [14, 6],  // 38
  [13, 6],  // 39 (Blue Start, Safe ★)
  [12, 6],  // 40
  [11, 6],  // 41
  [10, 6],  // 42
  [9, 6],   // 43
  [8, 5],   // 44
  [8, 4],   // 45
  [8, 3],   // 46
  [8, 2],   // 47 (Safe ★)
  [8, 1],   // 48
  [8, 0],   // 49
  [7, 0],   // 50
  [6, 0],   // 51
];

// Colored home columns: 5 steps leading to center
const HOME_COLUMNS = {
  0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], // Red
  1: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], // Green
  2: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // Yellow
  3: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // Blue
};

// Yard positions for 4 tokens in each 6x6 base
const YARD_OFFSETS = [
  { r: 2, c: 2 },
  { r: 2, c: 3 },
  { r: 3, c: 2 },
  { r: 3, c: 3 },
];

const YARD_BASES = {
  0: { r0: 0, c0: 0, color: COLORS.ludoRed, name: 'Red' }, // Top-Left
  1: { r0: 0, c0: 9, color: COLORS.ludoGreen, name: 'Green' }, // Top-Right
  2: { r0: 9, c0: 9, color: COLORS.ludoYellow, name: 'Yellow' }, // Bottom-Right
  3: { r0: 9, c0: 0, color: COLORS.ludoBlue, name: 'Blue' }, // Bottom-Left
};

const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export default function LudoBoard({
  gameState,
  currentUserId,
  onRollDice,
  onMoveToken,
}) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 24, 460);
  const cellSize = boardSize / 15;

  const [isRolling, setIsRolling] = useState(false);
  const diceAnim = useRef(new Animated.Value(0)).current;

  const currentColor = gameState?.currentColor ?? 0;
  const currentPlayer = gameState?.currentPlayer;
  const isMyTurn = currentPlayer?.id === currentUserId;
  const diceRolled = gameState?.diceRolled;
  const diceValue = gameState?.currentDice;
  const legalMoves = gameState?.legalMoves || [];

  // Dice roll animation
  const handleRollClick = () => {
    if (!isMyTurn || diceRolled || isRolling) return;

    setIsRolling(true);
    soundService.playDiceRoll();

    Animated.sequence([
      Animated.timing(diceAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(diceAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setIsRolling(false);
      onRollDice();
    });
  };

  const spin = diceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const scale = diceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1],
  });

  // Calculate tokens per cell
  // cellKey: 'yard-c-idx', 'main-idx', 'home-col-step', 'center-c'
  const tokenPlacements = {};

  if (gameState?.tokens) {
    Object.entries(gameState.tokens).forEach(([colorStr, tokenSteps]) => {
      const colorIdx = parseInt(colorStr, 10);
      tokenSteps.forEach((step, tokenIdx) => {
        let key = '';
        if (step === -1) {
          key = `yard-${colorIdx}-${tokenIdx}`;
        } else if (step === 56) {
          key = `center-${colorIdx}`;
        } else if (step >= 51 && step <= 55) {
          key = `home-${colorIdx}-${step - 51}`;
        } else if (step >= 0 && step <= 50) {
          const startCell = colorIdx * 13;
          const mainCellIdx = (startCell + step) % 52;
          key = `main-${mainCellIdx}`;
        }

        if (!tokenPlacements[key]) tokenPlacements[key] = [];
        tokenPlacements[key].push({
          colorIdx,
          tokenIdx,
          isLegal:
            isMyTurn &&
            colorIdx === currentColor &&
            legalMoves.some((m) => m.tokenIndex === tokenIdx),
        });
      });
    });
  }

  // Render dice pip faces
  const renderDiceFace = (val) => {
    if (!val) return <Ionicons name="help" size={28} color={COLORS.textMuted} />;
    const pips = [];
    // Positions 0 to 8 in a 3x3 dice face
    const pipMap = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const activeIndices = new Set(pipMap[val] || [4]);

    for (let i = 0; i < 9; i++) {
      pips.push(
        <View key={i} style={styles.pipCell}>
          {activeIndices.has(i) && <View style={styles.pipDot} />}
        </View>
      );
    }

    return <View style={styles.diceFaceGrid}>{pips}</View>;
  };

  return (
    <View style={styles.wrapper}>
      {/* Turn Banner */}
      <View style={styles.turnBanner}>
        <View style={styles.turnLeft}>
          <View
            style={[
              styles.colorPill,
              {
                backgroundColor:
                  currentColor === 0
                    ? COLORS.ludoRed
                    : currentColor === 1
                    ? COLORS.ludoGreen
                    : currentColor === 2
                    ? COLORS.ludoYellow
                    : COLORS.ludoBlue,
              },
            ]}
          />
          <View>
            <Text style={styles.turnTitle}>
              {isMyTurn ? "It's YOUR Turn!" : `${currentPlayer?.username || 'Opponent'}'s Turn`}
            </Text>
            <Text style={styles.turnSubtitle}>
              {isMyTurn
                ? !diceRolled
                  ? 'Tap the Dice to roll!'
                  : 'Select a highlighted token to move'
                : 'Waiting for move...'}
            </Text>
          </View>
        </View>

        {/* Dice Widget */}
        <Animated.View
          style={[
            styles.diceButtonWrap,
            {
              transform: [{ rotate: spin }, { scale: scale }],
              borderColor: isMyTurn && !diceRolled ? COLORS.accent : COLORS.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.diceButton,
              isMyTurn && !diceRolled && styles.diceButtonActive,
            ]}
            disabled={!isMyTurn || diceRolled || isRolling}
            onPress={handleRollClick}
          >
            {renderDiceFace(diceValue)}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action / Notification Banner */}
      {gameState?.lastAction?.message ? (
        <View style={styles.actionNote}>
          <Text style={styles.actionNoteText}>📢 {gameState.lastAction.message}</Text>
        </View>
      ) : null}

      {/* LUDO BOARD 15x15 */}
      <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
        {/* 4 YARD BASES */}
        {[0, 1, 2, 3].map((cIdx) => {
          const base = YARD_BASES[cIdx];
          const isBaseTurn = currentColor === cIdx;
          return (
            <View
              key={`base-${cIdx}`}
              style={[
                styles.yardBase,
                {
                  top: base.r0 * cellSize,
                  left: base.c0 * cellSize,
                  width: cellSize * 6,
                  height: cellSize * 6,
                  backgroundColor: base.color,
                  borderColor: isBaseTurn ? '#FFF' : 'transparent',
                  borderWidth: isBaseTurn ? 2 : 0,
                },
              ]}
            >
              <View style={styles.yardInner}>
                {YARD_OFFSETS.map((pos, tIdx) => {
                  const key = `yard-${cIdx}-${tIdx}`;
                  const tokensHere = tokenPlacements[key] || [];
                  const tokenInfo = tokensHere[0];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.yardSlot,
                        tokenInfo?.isLegal && styles.legalPulse,
                      ]}
                      disabled={!tokenInfo?.isLegal}
                      onPress={() => onMoveToken(tokenInfo.tokenIdx)}
                    >
                      {tokenInfo && (
                        <View
                          style={[
                            styles.tokenPiece,
                            {
                              backgroundColor: base.color,
                              borderColor: '#FFF',
                              transform: [{ scale: tokenInfo.isLegal ? 1.15 : 1 }],
                            },
                          ]}
                        >
                          <Text style={styles.tokenPip}>●</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* CENTER GOAL (3x3) */}
        <View
          style={[
            styles.centerGoal,
            {
              top: cellSize * 6,
              left: cellSize * 6,
              width: cellSize * 3,
              height: cellSize * 3,
            },
          ]}
        >
          <Text style={styles.centerTrophy}>🏆</Text>
          {/* Tokens reached home */}
          {[0, 1, 2, 3].map((cIdx) => {
            const key = `center-${cIdx}`;
            const count = tokenPlacements[key]?.length || 0;
            if (!count) return null;
            return (
              <View
                key={key}
                style={[
                  styles.homePill,
                  {
                    backgroundColor:
                      cIdx === 0
                        ? COLORS.ludoRed
                        : cIdx === 1
                        ? COLORS.ludoGreen
                        : cIdx === 2
                        ? COLORS.ludoYellow
                        : COLORS.ludoBlue,
                  },
                ]}
              >
                <Text style={styles.homePillText}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* 52 MAIN TRACK CELLS */}
        {TRACK_COORDS.map(([r, c], idx) => {
          const isSafe = SAFE_INDICES.has(idx);
          const key = `main-${idx}`;
          const tokensHere = tokenPlacements[key] || [];

          // Color for start squares
          let cellBg = COLORS.surface;
          if (idx === 0) cellBg = 'rgba(239, 68, 68, 0.35)'; // Red Start
          else if (idx === 13) cellBg = 'rgba(16, 185, 129, 0.35)'; // Green Start
          else if (idx === 26) cellBg = 'rgba(245, 158, 11, 0.35)'; // Yellow Start
          else if (idx === 39) cellBg = 'rgba(59, 130, 246, 0.35)'; // Blue Start

          return (
            <View
              key={key}
              style={[
                styles.trackCell,
                {
                  top: r * cellSize,
                  left: c * cellSize,
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cellBg,
                },
              ]}
            >
              {isSafe && <Text style={styles.starIcon}>★</Text>}

              {/* Render tokens on this cell */}
              {tokensHere.map((tok, tIdx) => (
                <TouchableOpacity
                  key={`${key}-${tIdx}`}
                  style={[
                    styles.tokenPiece,
                    {
                      backgroundColor:
                        tok.colorIdx === 0
                          ? COLORS.ludoRed
                          : tok.colorIdx === 1
                          ? COLORS.ludoGreen
                          : tok.colorIdx === 2
                          ? COLORS.ludoYellow
                          : COLORS.ludoBlue,
                      borderColor: '#FFF',
                      transform: [{ scale: tok.isLegal ? 1.2 : 0.95 }],
                    },
                    tok.isLegal && styles.legalPulse,
                  ]}
                  disabled={!tok.isLegal}
                  onPress={() => onMoveToken(tok.tokenIdx)}
                >
                  <Text style={styles.tokenPip}>●</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* HOME COLUMNS (5 colored cells each) */}
        {Object.entries(HOME_COLUMNS).map(([colorStr, coords]) => {
          const cIdx = parseInt(colorStr, 10);
          const colorHex =
            cIdx === 0
              ? COLORS.ludoRed
              : cIdx === 1
              ? COLORS.ludoGreen
              : cIdx === 2
              ? COLORS.ludoYellow
              : COLORS.ludoBlue;

          return coords.map(([r, c], stepIdx) => {
            const key = `home-${cIdx}-${stepIdx}`;
            const tokensHere = tokenPlacements[key] || [];

            return (
              <View
                key={key}
                style={[
                  styles.trackCell,
                  {
                    top: r * cellSize,
                    left: c * cellSize,
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: colorHex,
                    opacity: 0.85,
                  },
                ]}
              >
                {tokensHere.map((tok, tIdx) => (
                  <TouchableOpacity
                    key={`${key}-${tIdx}`}
                    style={[
                      styles.tokenPiece,
                      {
                        backgroundColor: colorHex,
                        borderColor: '#FFF',
                        transform: [{ scale: tok.isLegal ? 1.2 : 0.95 }],
                      },
                      tok.isLegal && styles.legalPulse,
                    ]}
                    disabled={!tok.isLegal}
                    onPress={() => onMoveToken(tok.tokenIdx)}
                  >
                    <Text style={styles.tokenPip}>●</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          });
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 460,
  },
  turnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorPill: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  turnTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
  },
  turnSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  diceButtonWrap: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 3,
  },
  diceButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  diceButtonActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  diceFaceGrid: {
    width: 36,
    height: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pipCell: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0F172A',
  },
  actionNote: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  actionNoteText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  boardContainer: {
    position: 'relative',
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  yardBase: {
    position: 'absolute',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yardInner: {
    width: '80%',
    height: '80%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  yardSlot: {
    width: '42%',
    height: '42%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerGoal: {
    position: 'absolute',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  centerTrophy: {
    fontSize: 22,
  },
  homePill: {
    position: 'absolute',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  homePillText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  trackCell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokenPiece: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  tokenPip: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  legalPulse: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    backgroundColor: '#F59E0B',
  },
});
