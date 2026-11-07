import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import LudoBoard from '../components/LudoBoard';
import ChatDrawer from '../components/ChatDrawer';
import GameOverModal from '../components/GameOverModal';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

export default function LudoGameScreen({
  mode = 'online', // 'online' | 'local' | 'bot'
  room,
  initialGameState,
  currentUserId,
  userProfile,
  onExit,
}) {
  const [gameState, setGameState] = useState(initialGameState);
  const [messages, setMessages] = useState(room?.messages || []);
  const [chatVisible, setChatVisible] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Online socket listeners
  useEffect(() => {
    if (mode !== 'online') {
      if (!gameState) {
        initLocalGame();
      }
      return;
    }

    const handleUpdate = (state) => {
      setGameState(state);
      if (state.gameStatus === 'finished' || state.winner) {
        setWinner(state.winner);
        setGameOver(true);
        soundService.playVictory();
        if (state.winner?.id === currentUserId) {
          StorageService.updateStats('ludo', 'win');
        } else {
          StorageService.updateStats('ludo', 'loss');
        }
      }
    };

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      soundService.playNotification();
    };

    socketService.on('ludo:update', handleUpdate);
    socketService.on('room:new_message', handleNewMessage);

    return () => {
      socketService.off('ludo:update', handleUpdate);
      socketService.off('room:new_message', handleNewMessage);
    };
  }, [mode, currentUserId]);

  // Local game engine fallback for offline / pass & play / vs bot
  const initLocalGame = () => {
    const players =
      mode === 'bot'
        ? [
            userProfile,
            { id: 'bot_1', username: 'CyberBot 🤖', avatar: '🤖', isBot: true },
          ]
        : [
            { id: 'p1', username: 'Player 1 (Red)', avatar: '🔴' },
            { id: 'p2', username: 'Player 2 (Yellow)', avatar: '🟡' },
          ];

    const state = {
      roomId: 'LOCAL',
      gameType: 'ludo',
      players,
      colorAssignments: [0, 2], // Red and Yellow
      tokens: {
        0: [-1, -1, -1, -1],
        2: [-1, -1, -1, -1],
      },
      currentTurnIndex: 0,
      currentColor: 0,
      currentPlayer: players[0],
      currentDice: null,
      diceRolled: false,
      legalMoves: [],
      winner: null,
      rankings: [],
      gameStatus: 'in_progress',
      lastAction: { message: 'Local match started!' },
    };

    setGameState(state);
  };

  const handleRollDice = () => {
    if (mode === 'online') {
      socketService.emit('ludo:roll_dice', {
        roomId: room.id,
        playerId: currentUserId,
      });
      return;
    }

    // Local Roll Logic
    if (!gameState || gameState.diceRolled) return;
    if (mode === 'bot' && gameState.currentPlayer?.isBot) return;
    const dice = Math.floor(Math.random() * 6) + 1;
    const currentColor = gameState.currentColor;
    const tokens = gameState.tokens[currentColor];

    const legal = [];
    tokens.forEach((step, idx) => {
      if (step === -1 && dice === 6) {
        legal.push({ tokenIndex: idx, fromStep: -1, toStep: 0, type: 'spawn' });
      } else if (step >= 0 && step + dice <= 56) {
        legal.push({
          tokenIndex: idx,
          fromStep: step,
          toStep: step + dice,
          type: step + dice === 56 ? 'reach_home' : 'move',
        });
      }
    });

    const isTurnPassed = legal.length === 0;
    const nextTurnIdx = isTurnPassed
      ? (gameState.currentTurnIndex + 1) % gameState.colorAssignments.length
      : gameState.currentTurnIndex;

    const newState = {
      ...gameState,
      currentDice: dice,
      diceRolled: !isTurnPassed,
      legalMoves: legal,
      currentTurnIndex: nextTurnIdx,
      currentColor: gameState.colorAssignments[nextTurnIdx],
      currentPlayer: gameState.players[nextTurnIdx],
      lastAction: {
        message: `${gameState.currentPlayer.username} rolled a ${dice}! ${
          isTurnPassed ? 'No legal moves.' : ''
        }`,
      },
    };

    setGameState(newState);
  };

  const handleMoveToken = (tokenIndex) => {
    if (mode === 'online') {
      socketService.emit('ludo:move_token', {
        roomId: room.id,
        playerId: currentUserId,
        tokenIndex,
      });
      return;
    }

    // Local Move Logic
    if (!gameState || !gameState.diceRolled) return;
    if (mode === 'bot' && gameState.currentPlayer?.isBot) return;
    const move = gameState.legalMoves.find((m) => m.tokenIndex === tokenIndex);
    if (!move) return;

    soundService.playMove();

    const currentColor = gameState.currentColor;
    const newTokens = { ...gameState.tokens };
    newTokens[currentColor] = [...newTokens[currentColor]];
    newTokens[currentColor][tokenIndex] = move.toStep;

    let bonus = gameState.currentDice === 6 || move.toStep === 56;

    // Check win condition
    const hasWon = newTokens[currentColor].every((s) => s === 56);
    if (hasWon) {
      soundService.playVictory();
      setWinner(gameState.currentPlayer);
      setGameOver(true);
      return;
    }

    const nextTurnIdx = bonus
      ? gameState.currentTurnIndex
      : (gameState.currentTurnIndex + 1) % gameState.colorAssignments.length;

    const newState = {
      ...gameState,
      tokens: newTokens,
      diceRolled: false,
      currentDice: null,
      legalMoves: [],
      currentTurnIndex: nextTurnIdx,
      currentColor: gameState.colorAssignments[nextTurnIdx],
      currentPlayer: gameState.players[nextTurnIdx],
      lastAction: {
        message: `${gameState.currentPlayer.username} moved token #${tokenIndex + 1}! ${
          bonus ? '🎲 Extra roll!' : ''
        }`,
      },
    };

    setGameState(newState);
  };

  // Local Bot Driver: whenever it's the bot's turn (including extra rolls
  // after a 6 or reaching home), schedule its next roll or move.
  useEffect(() => {
    if (mode !== 'bot' || !gameState || gameOver) return;
    if (gameState.gameStatus !== 'in_progress' || !gameState.currentPlayer?.isBot) return;

    const timer = setTimeout(
      () => {
        if (!gameState.diceRolled) {
          botRoll(gameState);
        } else {
          botMove(gameState);
        }
      },
      gameState.diceRolled ? 800 : 1000
    );

    return () => clearTimeout(timer);
  }, [gameState, mode, gameOver]);

  const botRoll = (st) => {
    soundService.playDiceRoll();
    const dice = Math.floor(Math.random() * 6) + 1;
    const legal = [];
    st.tokens[st.currentColor].forEach((step, idx) => {
      if (step === -1 && dice === 6) {
        legal.push({ tokenIndex: idx, fromStep: -1, toStep: 0, type: 'spawn' });
      } else if (step >= 0 && step + dice <= 56) {
        legal.push({ tokenIndex: idx, fromStep: step, toStep: step + dice });
      }
    });

    if (legal.length === 0) {
      // Pass
      const nextTurnIdx = (st.currentTurnIndex + 1) % st.colorAssignments.length;
      setGameState({
        ...st,
        currentDice: dice,
        diceRolled: false,
        legalMoves: [],
        currentTurnIndex: nextTurnIdx,
        currentColor: st.colorAssignments[nextTurnIdx],
        currentPlayer: st.players[nextTurnIdx],
        lastAction: { message: `CyberBot 🤖 rolled a ${dice} (no legal moves)` },
      });
      return;
    }

    setGameState({
      ...st,
      currentDice: dice,
      diceRolled: true,
      legalMoves: legal,
      lastAction: { message: `CyberBot 🤖 rolled a ${dice}!` },
    });
  };

  const botMove = (st) => {
    // Pick best move (spawn first, otherwise first legal)
    const chosenMove = st.legalMoves.find((m) => m.type === 'spawn') || st.legalMoves[0];
    if (!chosenMove) return;

    soundService.playMove();
    const bColor = st.currentColor;
    const bTokens = { ...st.tokens };
    bTokens[bColor] = [...bTokens[bColor]];
    bTokens[bColor][chosenMove.tokenIndex] = chosenMove.toStep;

    if (bTokens[bColor].every((s) => s === 56)) {
      setGameState({ ...st, tokens: bTokens, diceRolled: false, legalMoves: [] });
      soundService.playVictory();
      setWinner(st.currentPlayer);
      setGameOver(true);
      return;
    }

    const bonus = st.currentDice === 6 || chosenMove.toStep === 56;
    const nextTurn = bonus
      ? st.currentTurnIndex
      : (st.currentTurnIndex + 1) % st.colorAssignments.length;

    setGameState({
      ...st,
      tokens: bTokens,
      diceRolled: false,
      currentDice: null,
      legalMoves: [],
      currentTurnIndex: nextTurn,
      currentColor: st.colorAssignments[nextTurn],
      currentPlayer: st.players[nextTurn],
      lastAction: {
        message: `CyberBot 🤖 moved token #${chosenMove.tokenIndex + 1}${
          bonus ? ' 🎲 Extra roll!' : ''
        }`,
      },
    });
  };

  const handleSendMessage = (text) => {
    if (mode === 'online' && room) {
      socketService.emit('room:chat', {
        roomId: room.id,
        user: userProfile,
        text,
      });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          user: userProfile,
          text,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navBtn} onPress={onExit}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.navBtnText}>Leave</Text>
        </TouchableOpacity>

        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>
            {mode === 'online'
              ? `🎲 ROOM: ${room?.id || 'ONLINE'}`
              : mode === 'bot'
              ? '🎲 LUDO VS BOT'
              : '🎲 PASS & PLAY'}
          </Text>
        </View>

        {mode === 'online' ? (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => setChatVisible(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            {messages.length > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{messages.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LudoBoard
          gameState={gameState}
          currentUserId={currentUserId}
          onRollDice={handleRollDice}
          onMoveToken={handleMoveToken}
        />
      </ScrollView>

      {/* In-Game Chat Drawer */}
      <ChatDrawer
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUserId={currentUserId}
      />

      {/* Game Over Modal */}
      <GameOverModal
        visible={gameOver}
        winner={winner}
        gameType="ludo"
        currentUserId={currentUserId}
        onPlayAgain={() => {
          setGameOver(false);
          initLocalGame();
        }}
        onExit={onExit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  navBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modeBadge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chatBtn: {
    padding: 8,
    position: 'relative',
  },
  chatBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  chatBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
