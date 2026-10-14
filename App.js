import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/theme/colors';

// Services
import socketService from './src/services/socket';
import soundService from './src/services/soundService';
import { StorageService } from './src/services/storage';

// Components & Modals
import Header from './src/components/Header';
import FriendModal from './src/components/FriendModal';
import ChallengeModal from './src/components/ChallengeModal';
import RoomLobbyModal from './src/components/RoomLobbyModal';
import DownloadModal from './src/components/DownloadModal';
import LeaderboardModal from './src/screens/LeaderboardModal';
import ProfileScreen from './src/screens/ProfileScreen';

// Game Screens
import HomeScreen from './src/screens/HomeScreen';
import LudoGameScreen from './src/screens/LudoGameScreen';
import ChessGameScreen from './src/screens/ChessGameScreen';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Social & Friends state
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  // Navigation & Game State
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'ludo' | 'chess'
  const [gameMode, setGameMode] = useState('online'); // 'online' | 'local' | 'bot'
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeGameState, setActiveGameState] = useState(null);

  // Modals visibility
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [lobbyGameType, setLobbyGameType] = useState('ludo');
  const [roomLobbyVisible, setRoomLobbyVisible] = useState(false);

  // 1. Initialize Profile & Socket Connection
  useEffect(() => {
    async function init() {
      const user = await StorageService.getProfile();
      setProfile(user);

      // Connect to multiplayer Socket.IO backend
      socketService.connect(user);

      // Listen for local connection status
      const unsubStatus = socketService.subscribe('connection_status', ({ connected }) => {
        setIsConnected(connected);
      });

      // Socket Events
      socketService.on('friend:list_update', ({ friends: fList, incomingRequests: reqList }) => {
        if (fList) setFriends(fList);
        if (reqList) setIncomingRequests(reqList);
      });

      socketService.on('friend:search_results', (results) => {
        setSearchResults(results || []);
      });

      socketService.on('friend:incoming_request', ({ fromUser }) => {
        soundService.playNotification();
        setIncomingRequests((prev) => [...prev, fromUser]);
      });

      socketService.on('friend:request_accepted', ({ friend }) => {
        soundService.playNotification();
        setFriends((prev) => [...prev.filter((f) => f.id !== friend.id), friend]);
      });

      socketService.on('friend:status_changed', ({ userId, online }) => {
        setFriends((prev) =>
          prev.map((f) => (f.id === userId ? { ...f, online } : f))
        );
      });

      // Friend challenge notifications
      socketService.on('challenge:received', (challenge) => {
        soundService.playNotification();
        setIncomingChallenge(challenge);
      });

      socketService.on('challenge:matched', ({ room, gameState }) => {
        soundService.playVictory();
        setActiveRoom(room);
        setActiveGameState(gameState);
        setIncomingChallenge(null);
        setRoomLobbyVisible(false);
        setFriendsModalVisible(false);
        setCurrentScreen(room.gameType);
        setGameMode('online');
      });

      socketService.on('challenge:declined', ({ message }) => {
        if (Platform.OS === 'web') {
          window.alert(message || 'Friend declined challenge.');
        } else {
          Alert.alert('Challenge', message || 'Friend declined challenge.');
        }
      });

      // Room & Matchmaking Events
      socketService.on('room:created', ({ room }) => {
        setActiveRoom(room);
      });

      socketService.on('room:joined', ({ room }) => {
        setActiveRoom(room);
      });

      socketService.on('room:updated', ({ room }) => {
        setActiveRoom(room);
      });

      socketService.on('ludo:start', (gameState) => {
        setActiveGameState(gameState);
        setRoomLobbyVisible(false);
        setCurrentScreen('ludo');
        setGameMode('online');
      });

      socketService.on('chess:start', (gameState) => {
        setActiveGameState(gameState);
        setRoomLobbyVisible(false);
        setCurrentScreen('chess');
        setGameMode('online');
      });

      socketService.on('matchmaking:found', ({ room, gameState }) => {
        soundService.playVictory();
        setActiveRoom(room);
        setActiveGameState(gameState);
        setCurrentScreen(room.gameType);
        setGameMode('online');
      });

      return () => {
        unsubStatus();
      };
    }

    init();
  }, []);

  // Handlers for Friends
  const handleSearchFriend = (query) => {
    socketService.emit('friend:search', { query, userId: profile?.id });
  };

  const handleSendFriendRequest = (targetQuery) => {
    socketService.emit('friend:request', {
      fromUserId: profile?.id,
      targetQuery,
    });
  };

  const handleRespondFriendRequest = (fromUserId, accept) => {
    socketService.emit('friend:respond', {
      userId: profile?.id,
      fromUserId,
      accept,
    });
    setIncomingRequests((prev) => prev.filter((r) => r.id !== fromUserId));
  };

  const handleRemoveFriend = (friendId) => {
    socketService.emit('friend:remove', {
      userId: profile?.id,
      friendId,
    });
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const handleChallengeFriend = (friendId, gameType) => {
    socketService.emit('challenge:send', {
      fromUser: profile,
      toUserId: friendId,
      gameType,
    });
    if (Platform.OS === 'web') {
      window.alert(`Challenge sent for ${gameType === 'ludo' ? 'Ludo' : 'Chess'}! Waiting for friend...`);
    } else {
      Alert.alert('Challenge Sent', `Waiting for friend to accept...`);
    }
  };

  // Challenge Response
  const handleAcceptChallenge = (challengeId) => {
    socketService.emit('challenge:respond', {
      challengeId,
      accept: true,
    });
    setIncomingChallenge(null);
  };

  const handleDeclineChallenge = (challengeId) => {
    socketService.emit('challenge:respond', {
      challengeId,
      accept: false,
    });
    setIncomingChallenge(null);
  };

  // Room Lobby Handlers
  const handleOpenLobby = (gameType) => {
    setLobbyGameType(gameType);
    setRoomLobbyVisible(true);
  };

  const handleCreateRoom = ({ gameType, maxPlayers, isPrivate }) => {
    socketService.emit('room:create', {
      hostUser: profile,
      gameType,
      maxPlayers,
      isPrivate,
    });
  };

  const handleJoinRoom = (roomCode) => {
    socketService.emit('room:join', {
      roomId: roomCode,
      user: profile,
    });
  };

  const handleAddBot = () => {
    if (activeRoom) {
      socketService.emit('room:add_bot', { roomId: activeRoom.id });
    }
  };

  const handleStartGame = (roomId) => {
    socketService.emit('room:start', { roomId });
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      socketService.emit('room:leave', { userId: profile?.id });
      setActiveRoom(null);
      setActiveGameState(null);
    }
  };

  // Quick Matchmaking
  const handleQuickMatch = (gameType) => {
    socketService.emit('matchmaking:queue', {
      player: profile,
      gameType,
      maxPlayers: 2,
    });
    if (Platform.OS === 'web') {
      window.alert(`Searching for online ${gameType} match...`);
    } else {
      Alert.alert('Matchmaking', `Searching for player...`);
    }
  };

  // Save profile
  const handleSaveProfile = async (updated) => {
    setProfile(updated);
    await StorageService.saveProfile(updated);
    if (socketService.isConnected) {
      socketService.emit('user:login', {
        userId: updated.id,
        username: updated.username,
        avatar: updated.avatar,
      });
    }
  };

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleExitGame = () => {
    handleLeaveRoom();
    setCurrentScreen('home');
  };

  return (
    <SafeAreaView style={styles.root}>
      <RNStatusBar barStyle="light-content" backgroundColor={COLORS.surface} />
      <StatusBar style="light" />

      {/* Main Container */}
      <View style={styles.appContainer}>
        {/* Top Navbar */}
        <Header
          profile={profile}
          isConnected={isConnected}
          pendingRequestsCount={incomingRequests.length}
          onOpenFriends={() => setFriendsModalVisible(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          onOpenLeaderboard={() => setLeaderboardModalVisible(true)}
          onOpenDownload={() => setDownloadModalVisible(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />

        {/* Current Active Screen */}
        {currentScreen === 'home' && (
          <HomeScreen
            profile={profile}
            friends={friends}
            onOpenLudoLobby={() => handleOpenLobby('ludo')}
            onOpenChessLobby={() => handleOpenLobby('chess')}
            onStartLocalLudo={() => {
              setCurrentScreen('ludo');
              setGameMode('local');
            }}
            onStartBotLudo={() => {
              setCurrentScreen('ludo');
              setGameMode('bot');
            }}
            onStartLocalChess={() => {
              setCurrentScreen('chess');
              setGameMode('local');
            }}
            onStartBotChess={() => {
              setCurrentScreen('chess');
              setGameMode('bot');
            }}
            onQuickMatch={handleQuickMatch}
            onOpenFriends={() => setFriendsModalVisible(true)}
            onChallengeFriend={handleChallengeFriend}
            onOpenDownload={() => setDownloadModalVisible(true)}
          />
        )}

        {currentScreen === 'ludo' && (
          <LudoGameScreen
            mode={gameMode}
            room={activeRoom}
            initialGameState={activeGameState}
            currentUserId={profile?.id}
            userProfile={profile}
            onExit={handleExitGame}
          />
        )}

        {currentScreen === 'chess' && (
          <ChessGameScreen
            mode={gameMode}
            room={activeRoom}
            initialGameState={activeGameState}
            currentUserId={profile?.id}
            userProfile={profile}
            onExit={handleExitGame}
          />
        )}

        {/* Friends & Social Modal */}
        <FriendModal
          visible={friendsModalVisible}
          onClose={() => setFriendsModalVisible(false)}
          friends={friends}
          incomingRequests={incomingRequests}
          searchResults={searchResults}
          onSearch={handleSearchFriend}
          onSendRequest={handleSendFriendRequest}
          onRespondRequest={handleRespondFriendRequest}
          onRemoveFriend={handleRemoveFriend}
          onChallengeFriend={handleChallengeFriend}
          userProfile={profile}
        />

        {/* Incoming Challenge Real-Time Modal */}
        <ChallengeModal
          challenge={incomingChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
        />

        {/* Room / Lobby Modal */}
        <RoomLobbyModal
          visible={roomLobbyVisible}
          onClose={() => setRoomLobbyVisible(false)}
          gameType={lobbyGameType}
          room={activeRoom}
          currentUserId={profile?.id}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onAddBot={handleAddBot}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />

        {/* Leaderboard Modal */}
        <LeaderboardModal
          visible={leaderboardModalVisible}
          onClose={() => setLeaderboardModalVisible(false)}
        />

        {/* Profile Customization Modal */}
        <ProfileScreen
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          profile={profile}
          onSaveProfile={handleSaveProfile}
        />

        {/* Download & Mobile Install Modal */}
        <DownloadModal
          visible={downloadModalVisible}
          onClose={() => setDownloadModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    ...(Platform.OS === 'web'
      ? {
          height: '100vh',
          overflow: 'hidden',
        }
      : {}),
  },
});
