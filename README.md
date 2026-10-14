# 🎮 FastGame - Cross-Platform Multiplayer Gaming Hub

[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Chess.js](https://img.shields.io/badge/Chess.js-Standard%20FIDE-blue)](https://github.com/jhlywa/chess.js)

**FastGame** is a sleek, cyber-arcade cross-platform mobile and web application built with **React Native (Expo)** and powered by a real-time **Node.js + Socket.IO** backend. Players can add friends, track online presence, send 1-tap live game challenges, and play real-time multiplayer board games together with in-game chat and sound effects.

---

## 🌟 Key Features

### 👥 Social & Friends System
- **Add Friends:** Search and add friends by their Gamer Tag or unique Player ID.
- **Real-Time Presence:** Live green/gray indicators show which friends are online right now.
- **Instant Challenges:** Tap "Play Ludo" or "Play Chess" next to any online friend to send an immediate battle challenge with a 25-second countdown accept modal.
- **Friend Requests:** Easily accept or decline incoming friend invitations.

### 🎲 Game 1: Ludo Royale
- **Authentic 15x15 Ludo Board:** Standard track geometry (52 common track squares, 8 safe star cells, colored yards, and colored home stretches).
- **Classic Rules:**
  - Roll a **6** to spawn tokens out of base yard.
  - Rolling a **6** grants an extra roll.
  - Capturing opponent tokens sends them back to their base yard and rewards an extra bonus turn.
  - Reaching the central home pocket requires an exact roll and grants a bonus turn.
  - First player to escort all 4 tokens home wins!
- **Game Modes:**
  - **Online Multiplayer:** Play in 2-player (1v1) or 4-player (Classic) rooms with friends or via shareable 6-digit room codes.
  - **Vs AI Bot:** Play against intelligent computer bots anytime.
  - **Pass & Play:** Local turn-based multiplayer on a single screen.

### ♟️ Game 2: Chess Masters
- **Standard FIDE Engine:** Powered by `chess.js` for 100% legal, accurate move calculations.
- **Complete Rules:** Castling (kingside/queenside), En Passant, Pawn Promotion selector (Queen, Rook, Bishop, Knight), Check & Checkmate, and Stalemate/Draw detection.
- **Chess Clocks:** Live turn timers and match clocks for blitz and rapid games.
- **Piece Glyphs & Visual Indicators:** Square highlighting, legal destination dots, capture rings, and red check alert pulses.
- **Game Modes:**
  - **Online Multiplayer:** Live synchronized moves against friends or random opponents.
  - **Vs AI Bot:** Smart minimax chess engine with position evaluations.
  - **Pass & Play:** Local 2-player match on the same device.

### ⚡ Instant Matchmaking & Lobbies
- **Quick Match:** Tap ⚡ Quick Match to be automatically paired with an online player in seconds.
- **Private Rooms:** Create rooms with shareable codes (e.g. `LUDO-A4B2`, `CHESS-9K1L`) or join existing rooms.
- **Room Controls:** Room hosts can start matches or click `+ Add AI Bot` to fill open slots immediately.

### 💬 In-Game Match Chat & Emotes
- Real-time chat drawer accessible during matches.
- Quick 1-tap arcade emotes:
  - *"Good luck! 🍀"*, *"Well played! 👏"*, *"Oops! 😅"*, *"GG! 🔥"*, *"Nice move! 🎯"*, *"Thinking... 🧠"*

### 🏆 Hall of Champions & Profile
- **Custom Gamer Tag & Avatars:** Pick from a variety of gamer avatars (`🦁`, `⚡`, `👑`, `🔥`, `🚀`, `🤖`, `💎`, etc.).
- **Battle Records:** Tracks Chess wins, Chess losses, Ludo victories, and matches played.
- **Global Leaderboard:** Live ranking by win rates and rating XP points.

### 🔊 Cyber-Arcade Sound FX
- Synthesized Web Audio API sound effects: dice rolls, piece moves, captures, check alerts, and victory fanfare.

---

## 📁 Project Architecture

```
fastgame/
├── App.js                         # Main application root & navigation controller
├── app.json                       # Expo application metadata & dark theme config
├── package.json                   # Client dependencies and npm scripts
├── src/
│   ├── theme/
│   │   └── colors.js              # Cyber-arcade neon palette
│   ├── services/
│   │   ├── socket.js              # Socket.IO client manager
│   │   ├── soundService.js        # Web Audio API synthesizers
│   │   └── storage.js             # Local profile & stats persistence
│   ├── components/
│   │   ├── Header.js              # Top gamer navigation bar
│   │   ├── FriendModal.js         # Friends list, requests, search & challenge
│   │   ├── ChallengeModal.js      # Live challenge countdown notification
│   │   ├── RoomLobbyModal.js      # Room codes, matchmaking, AI bot fill
│   │   ├── ChatDrawer.js          # In-game real-time chat & emotes
│   │   ├── GameOverModal.js       # Victory/defeat screen & match rewards
│   │   ├── LudoBoard.js           # 15x15 authentic Ludo board with 3D dice
│   │   └── ChessBoard.js          # 8x8 standard FIDE chessboard
│   └── screens/
│       ├── HomeScreen.js          # Hub, quick matchmaking, game arenas
│       ├── LudoGameScreen.js      # Ludo screen (Online, Pass & Play, Vs Bot)
│       ├── ChessGameScreen.js     # Chess screen (Online, Pass & Play, Vs Bot)
│       ├── ProfileScreen.js       # Profile tag, avatar picker & battle stats
│       └── LeaderboardModal.js    # Hall of champions leaderboard
└── server/
    ├── package.json               # Backend server dependencies
    ├── server.js                  # Express & Socket.IO server on port 4000
    ├── friendManager.js           # Live presence, friends list & challenges
    ├── roomManager.js             # Room codes, queues & in-game chat
    ├── ludoServerLogic.js         # Server-side Ludo rules engine
    └── chessServerLogic.js        # Server-side Chess engine with AI bot
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### 1. Install Dependencies

In the project root:
```bash
npm install
```

In the server directory:
```bash
cd server
npm install
cd ..
```

### 2. Start the Multiplayer Server
Run the Node.js Socket.IO server:
```bash
npm run server
```
> Server runs on `http://localhost:4000` (Health check: `http://localhost:4000/health`).

### 3. Start the App (Web / Mobile)

#### Run on Web (Browser):
```bash
npm run web
```
The app will launch in your default browser at `http://localhost:8081` (or next available port). You can open multiple browser tabs or incognito windows to test multiplayer games and friend challenges against each other!

#### Run on Mobile (Android & iOS):
```bash
npm start
```
- **Android:** Press `a` to open in Android Emulator, or scan the QR code with the **Expo Go** app on your physical device.
- **iOS:** Press `i` to open in iOS Simulator (macOS), or scan the QR code with the Camera app using **Expo Go**.

---

## 📜 License
This project is open-source and available under the MIT License.