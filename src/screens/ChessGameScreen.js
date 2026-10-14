import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chess } from 'chess.js';
import { COLORS } from '../theme/colors';
import ChessBoard from '../components/ChessBoard';
import ChatDrawer from '../components/ChatDrawer';
import GameOverModal from '../components/GameOverModal';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';

export default function ChessGameScreen({
  mode = 'online', // 'online' | 'local' | 'bot'
  room,
  initialGameState,
  currentUserId,
  userProfile,
  onExit,
}) {
  const chessRef = useRef(new Chess());
  const [gameState, setGameState] = useState(initialGameState);
  const [messages, setMessages] = useState(room?.messages || []);
  const [chatVisible, setChatVisible] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState('');

  // Determine player's color
  let playerColor = 'both';
  if (mode === 'online' && room) {
    playerColor = room.players[0]?.id === currentUserId ? 'w' : 'b';
  } else if (mode === 'bot') {
    playerColor = 'w'; // User is White against bot
  }

  // Socket online listeners
  useEffect(() => {
    if (mode !== 'online') {
      initLocalGame();
      return;
    }

    const handleUpdate = (state) => {
      setGameState(state);
      if (state.fen) {
        chessRef.current.load(state.fen);
      }
      if (state.gameStatus !== 'in_progress') {
        setWinner(state.winner);
        setWinReason(state.winReason);
        setGameOver(true);
        if (state.winner?.id === currentUserId) {
          soundService.playVictory();
          StorageService.updateStats('chess', 'win');
        } else {
          StorageService.updateStats('chess', 'loss');
        }
      }
    };

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      soundService.playNotification();
    };

    socketService.on('chess:update', handleUpdate);
    socketService.on('room:new_message', handleNewMessage);

    return () => {
      socketService.off('chess:update', handleUpdate);
      socketService.off('room:new_message', handleNewMessage);
    };
  }, [mode, currentUserId]);

  const initLocalGame = () => {
    chessRef.current = new Chess();
    const whiteP = userProfile;
    const blackP =
      mode === 'bot'
        ? { id: 'bot_chess', username: 'DeepMind Alpha 🤖', avatar: '🧠', isBot: true }
        : { id: 'p2_local', username: 'Black Player', avatar: '👤' };

    setGameState({
      roomId: 'LOCAL_CHESS',
      gameType: 'chess',
      fen: chessRef.current.fen(),
      turn: 'w',
      whitePlayer: whiteP,
      blackPlayer: blackP,
      whiteTime: 600,
      blackTime: 600,
      inCheck: false,
      isCheckmate: false,
      isDraw: false,
      gameStatus: 'in_progress',
      moveHistory: [],
      capturedWhite: [],
      capturedBlack: [],
    });
  };

  const handleMakeMove = (moveData) => {
    if (mode === 'online') {
      socketService.emit('chess:move', {
        roomId: room.id,
        playerId: currentUserId,
        move: moveData,
      });
      return;
    }

    // Local / Bot move execution
    try {
      const move = chessRef.current.move(moveData);
      if (!move) return;

      const inCheck = chessRef.current.inCheck();
      const isCheckmate = chessRef.current.isCheckmate();
      const isDraw = chessRef.current.isDraw();

      const newHistory = [...(gameState?.moveHistory || []), move];
      const newCapturedWhite = [...(gameState?.capturedWhite || [])];
      const newCapturedBlack = [...(gameState?.capturedBlack || [])];

      if (move.captured) {
        if (move.color === 'w') newCapturedBlack.push(move.captured);
        else newCapturedWhite.push(move.captured);
      }

      let st = 'in_progress';
      let winObj = null;
      let reason = '';

      if (isCheckmate) {
        st = 'checkmate';
        winObj = move.color === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
        reason = `Checkmate! ${winObj.username} wins!`;
        soundService.playVictory();
        setGameOver(true);
      } else if (isDraw) {
        st = 'draw';
        reason = 'Draw by stalemate or insufficient material!';
        setGameOver(true);
      }

      setWinner(winObj);
      setWinReason(reason);

      const updatedState = {
        ...gameState,
        fen: chessRef.current.fen(),
        turn: chessRef.current.turn(),
        inCheck,
        isCheckmate,
        isDraw,
        gameStatus: st,
        moveHistory: newHistory,
        capturedWhite: newCapturedWhite,
        capturedBlack: newCapturedBlack,
      };

      setGameState(updatedState);

      // If playing vs Bot and it's Black's turn
      if (mode === 'bot' && st === 'in_progress' && chessRef.current.turn() === 'b') {
        setTimeout(runBotChessMove, 600);
      }
    } catch (e) {
      console.warn('Move error:', e);
    }
  };

  // Bot Chess AI
  const runBotChessMove = () => {
    const moves = chessRef.current.moves({ verbose: true });
    if (moves.length === 0) return;

    // Pick capture move if available, otherwise random/center move
    let bestMove = moves.find((m) => m.captured);
    if (!bestMove) {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
    }

    soundService.playMove();
    if (bestMove.captured) soundService.playCapture();

    chessRef.current.move(bestMove);

    const inCheck = chessRef.current.inCheck();
    const isCheckmate = chessRef.current.isCheckmate();
    const isDraw = chessRef.current.isDraw();

    let st = 'in_progress';
    let winObj = null;
    let reason = '';

    if (isCheckmate) {
      st = 'checkmate';
      winObj = gameState.blackPlayer;
      reason = 'Checkmate! Bot wins!';
      setGameOver(true);
    } else if (isDraw) {
      st = 'draw';
      reason = 'Match ended in a draw!';
      setGameOver(true);
    }

    setWinner(winObj);
    setWinReason(reason);

    setGameState((prev) => ({
      ...prev,
      fen: chessRef.current.fen(),
      turn: chessRef.current.turn(),
      inCheck,
      isCheckmate,
      isDraw,
      gameStatus: st,
      moveHistory: [...prev.moveHistory, bestMove],
    }));
  };

  const handleResign = () => {
    if (mode === 'online') {
      socketService.emit('chess:resign', {
        roomId: room.id,
        playerId: currentUserId,
      });
    } else {
      setWinner(gameState.blackPlayer);
      setWinReason('You resigned.');
      setGameOver(true);
    }
  };

  const handleOfferDraw = () => {
    if (mode === 'online') {
      socketService.emit('chess:draw_offer', {
        roomId: room.id,
        playerId: currentUserId,
      });
    } else {
      setWinner(null);
      setWinReason('Draw agreed.');
      setGameOver(true);
    }
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
        { id: Date.now().toString(), user: userProfile, text },
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
              ? `♟️ ROOM: ${room?.id || 'ONLINE'}`
              : mode === 'bot'
              ? '♟️ CHESS VS BOT'
              : '♟️ PASS & PLAY'}
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
        <ChessBoard
          gameState={gameState}
          chessEngine={chessRef.current}
          currentUserId={currentUserId}
          playerColor={playerColor}
          onMakeMove={handleMakeMove}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
        />
      </ScrollView>

      {/* Chat Drawer */}
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
        reason={winReason}
        gameType="chess"
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
