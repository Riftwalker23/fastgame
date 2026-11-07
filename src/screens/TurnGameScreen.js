// Generic screen for 2-player turn-based games (Tic Tac Toe, Connect Four, Dots & Boxes).
// Modes: 'local' (pass & play), 'bot' (vs AI), 'online' (moves relayed through the server).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import GameTopBar from '../components/GameTopBar';
import GameOverModal from '../components/GameOverModal';
import ChatDrawer from '../components/ChatDrawer';
import { TicTacToeBoard, Connect4Board, DotsBoxesBoard, SEAT_COLORS } from '../components/TurnBoards';
import socketService from '../services/socket';
import soundService from '../services/soundService';
import { StorageService } from '../services/storage';
import { getGame } from '../games/catalog';
import tictactoe from '../games/logic/tictactoe';
import connect4 from '../games/logic/connect4';
import dotsboxes from '../games/logic/dotsboxes';

const LOGIC = { tictactoe, connect4, dotsboxes };
const BOARDS = { tictactoe: TicTacToeBoard, connect4: Connect4Board, dotsboxes: DotsBoxesBoard };

function replay(logic, moves = []) {
  let st = logic.createState();
  for (const { seat, move } of moves) {
    st = logic.applyMove(st, move, seat) || st;
  }
  return st;
}

export default function TurnGameScreen({
  gameId,
  mode = 'local',
  room,
  initialGameState,
  currentUserId,
  userProfile,
  onExit,
}) {
  const logic = LOGIC[gameId];
  const Board = BOARDS[gameId];
  const meta = getGame(gameId);
  const colors = SEAT_COLORS[gameId];

  const players = useMemo(() => {
    if (mode === 'online') return initialGameState?.players || room?.players || [];
    if (mode === 'bot')
      return [
        userProfile || { id: 'me', username: 'You', avatar: '🙂' },
        { id: 'bot', username: 'CyberBot', avatar: '🤖', isBot: true },
      ];
    return [
      { id: 'p1', username: 'Player 1', avatar: '🟣' },
      { id: 'p2', username: 'Player 2', avatar: '🟠' },
    ];
  }, [mode, initialGameState, room, userProfile]);

  const mySeat = mode === 'online' ? players.findIndex((p) => p.id === currentUserId) : mode === 'bot' ? 0 : -1;

  const [state, setState] = useState(() =>
    mode === 'online' ? replay(logic, initialGameState?.moves) : logic.createState()
  );
  const [series, setSeries] = useState([0, 0]);
  const [starter, setStarter] = useState(0);
  const [showOver, setShowOver] = useState(false);
  const [messages, setMessages] = useState(room?.messages || []);
  const [chatVisible, setChatVisible] = useState(false);
  const recorded = useRef(false);

  const over = state.winner !== null || state.draw;

  // Online: listen for relayed moves / rematches / reconnect syncs.
  useEffect(() => {
    if (mode !== 'online') return undefined;
    const onMove = ({ seat, move }) => {
      setState((prev) => {
        const next = logic.applyMove(prev, move, seat);
        if (next) soundService.playMove();
        return next || prev;
      });
    };
    const onSync = ({ moves }) => setState(replay(logic, moves));
    const onRestart = () => {
      recorded.current = false;
      setShowOver(false);
      setState(logic.createState());
    };
    const onMsg = (msg) => setMessages((prev) => [...prev, msg]);

    socketService.on('turn:move', onMove);
    socketService.on('turn:sync', onSync);
    socketService.on('turn:start', onRestart);
    socketService.on('room:new_message', onMsg);
    return () => {
      socketService.off('turn:move', onMove);
      socketService.off('turn:sync', onSync);
      socketService.off('turn:start', onRestart);
      socketService.off('room:new_message', onMsg);
    };
  }, [mode, logic]);

  // Bot plays seat 1.
  useEffect(() => {
    if (mode !== 'bot' || over || state.turn !== 1) return undefined;
    const t = setTimeout(() => {
      const move = logic.getBotMove(state);
      if (!move) return;
      const next = logic.applyMove(state, move, 1);
      if (next) {
        soundService.playMove();
        setState(next);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [mode, state, over, logic]);

  // Game over handling.
  useEffect(() => {
    if (!over || recorded.current) return undefined;
    recorded.current = true;
    if (state.winner !== null) {
      setSeries((s) => {
        const n = [...s];
        n[state.winner] += 1;
        return n;
      });
    }
    if (mode !== 'local') {
      StorageService.updateStats(
        gameId,
        state.draw ? 'draw' : state.winner === mySeat ? 'win' : 'loss'
      );
    }
    soundService.playVictory();
    const t = setTimeout(() => setShowOver(true), 700);
    return () => clearTimeout(t);
  }, [over]);

  const handleMove = (move) => {
    if (over) return;
    if (mode === 'online') {
      if (state.turn !== mySeat) return;
      socketService.emit('turn:move', { roomId: room?.id, playerId: currentUserId, move });
      return;
    }
    const seat = state.turn;
    if (mode === 'bot' && seat !== 0) return;
    const next = logic.applyMove(state, move, seat);
    if (next) {
      soundService.playMove();
      setState(next);
    }
  };

  const restart = () => {
    setShowOver(false);
    recorded.current = false;
    if (mode === 'online') {
      socketService.emit('turn:rematch', { roomId: room?.id });
      return;
    }
    // Alternate who goes first each round.
    const nextStarter = 1 - starter;
    setStarter(nextStarter);
    setState({ ...logic.createState(), turn: nextStarter });
  };

  const nameOf = (seat) => {
    const p = players[seat];
    if (!p) return `Player ${seat + 1}`;
    if (mode !== 'local' && seat === mySeat) return 'You';
    return p.username;
  };

  let status;
  if (state.winner !== null) status = `${nameOf(state.winner)} ${nameOf(state.winner) === 'You' ? 'win' : 'wins'}! 🎉`;
  else if (state.draw) status = "It's a draw!";
  else if (mode === 'local') status = `${nameOf(state.turn)}'s turn`;
  else status = state.turn === mySeat ? 'Your turn' : `${nameOf(state.turn)} is thinking…`;

  const boardDisabled =
    over || (mode === 'bot' && state.turn !== 0) || (mode === 'online' && state.turn !== mySeat);

  const winnerPlayer = state.winner !== null ? players[state.winner] : null;
  const overTitle = state.draw
    ? "It's a Draw!"
    : mode === 'local'
    ? `${nameOf(state.winner)} Wins!`
    : state.winner === mySeat
    ? 'Victory!'
    : 'Defeat';

  return (
    <SafeAreaView style={styles.container}>
      <GameTopBar
        title={`${meta.emoji} ${meta.name.toUpperCase()}`}
        color={meta.color}
        onBack={onExit}
        right={
          mode === 'online' ? (
            <TouchableOpacity onPress={() => setChatVisible(true)}>
              <Ionicons name="chatbubble-ellipses" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Player cards */}
        <View style={styles.playersRow}>
          {[0, 1].map((seat) => {
            const active = !over && state.turn === seat;
            return (
              <View
                key={seat}
                style={[styles.playerCard, active && { borderColor: colors[seat] }]}
              >
                <Text style={styles.playerAvatar}>{players[seat]?.avatar || '🎮'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {nameOf(seat)}
                  </Text>
                  <View style={styles.markRow}>
                    <View style={[styles.markDot, { backgroundColor: colors[seat] }]} />
                    <Text style={styles.playerSub}>
                      {gameId === 'dotsboxes' ? `${state.scores[seat]} box${state.scores[seat] === 1 ? '' : 'es'}` : `${series[seat]} win${series[seat] === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.statusPill, { borderColor: over ? COLORS.accent : colors[state.turn] }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <Board state={state} onMove={handleMove} disabled={boardDisabled} />

        {mode === 'local' && !over && (
          <Text style={styles.hint}>Pass the phone to {nameOf(state.turn)} 📱</Text>
        )}

        {over && (
          <TouchableOpacity style={[styles.againBtn, { backgroundColor: meta.color }]} onPress={restart}>
            <Ionicons name="refresh" size={18} color="#000" />
            <Text style={styles.againText}>{mode === 'online' ? 'Rematch' : 'Play Again'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {mode === 'online' && (
        <ChatDrawer
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          messages={messages}
          onSendMessage={(text) =>
            socketService.emit('room:chat', { roomId: room?.id, user: userProfile, text })
          }
          currentUserId={currentUserId}
        />
      )}

      <GameOverModal
        visible={showOver}
        winner={winnerPlayer}
        gameType={gameId}
        currentUserId={mode === 'local' ? null : currentUserId}
        title={overTitle}
        emoji={state.draw ? '🤝' : mode === 'local' || state.winner === mySeat ? '🏆' : '🎖️'}
        reason={
          gameId === 'dotsboxes'
            ? `Final score ${state.scores[0]} – ${state.scores[1]}`
            : undefined
        }
        showRewards={mode !== 'local'}
        onPlayAgain={restart}
        onExit={onExit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, alignItems: 'center', paddingBottom: 40 },
  playersRow: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 440 },
  playerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  playerAvatar: { fontSize: 24 },
  playerName: { color: COLORS.text, fontWeight: '800', fontSize: 13 },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  markDot: { width: 8, height: 8, borderRadius: 4 },
  playerSub: { color: COLORS.textSecondary, fontSize: 11 },
  statusPill: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  statusText: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  hint: { color: COLORS.textMuted, fontSize: 12 },
  againBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  againText: { color: '#000', fontWeight: '900', fontSize: 15 },
});
