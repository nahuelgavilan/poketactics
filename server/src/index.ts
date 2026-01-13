import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms';
import type { ClientToServerEvents, ServerToClientEvents, GameAction } from './types';

const app = express();
const httpServer = createServer(app);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CLIENT_URL || ''
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Socket.IO server
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const roomManager = new RoomManager();

// Cleanup old rooms every 10 minutes
setInterval(() => {
  roomManager.cleanup();
}, 10 * 60 * 1000);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', () => {
    const roomId = roomManager.createRoom(socket.id);
    socket.join(roomId);
    socket.emit('room-created', roomId);
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  // Join an existing room
  socket.on('join-room', (roomId) => {
    const result = roomManager.joinRoom(roomId.toUpperCase(), socket.id);

    if (!result.success) {
      socket.emit('error', result.error || 'Error al unirse');
      return;
    }

    socket.join(roomId.toUpperCase());
    socket.emit('room-joined', { roomId: roomId.toUpperCase(), player: 'P2' });

    // Notify host that someone joined
    const room = roomManager.getRoom(roomId.toUpperCase());
    if (room) {
      io.to(room.hostId).emit('player-joined', socket.id);
    }

    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  // Start the game (host only)
  socket.on('start-game', () => {
    const room = roomManager.getPlayerRoom(socket.id);

    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }

    if (!roomManager.isHost(socket.id)) {
      socket.emit('error', 'Solo el anfitrión puede iniciar el juego');
      return;
    }

    if (!roomManager.isRoomFull(room.id)) {
      socket.emit('error', 'Esperando a otro jugador');
      return;
    }

    // Signal both players to start
    io.to(room.id).emit('game-started', {
      map: [],
      units: [],
      turn: 1,
      currentPlayer: 'P1',
      status: 'playing',
      winner: null
    });

    console.log(`Game started in room ${room.id}`);
  });

  // Handle game actions
  socket.on('game-action', (action: GameAction) => {
    const room = roomManager.getPlayerRoom(socket.id);

    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }

    // Broadcast action to the other player
    socket.to(room.id).emit('game-action', action);
  });

  // End turn
  socket.on('end-turn', () => {
    const room = roomManager.getPlayerRoom(socket.id);

    if (!room) {
      socket.emit('error', 'No estás en una sala');
      return;
    }

    const currentRole = roomManager.getPlayerRole(socket.id);
    const nextPlayer = currentRole === 'P1' ? 'P2' : 'P1';
    const newTurn = currentRole === 'P2'
      ? (room.gameState?.turn || 1) + 1
      : (room.gameState?.turn || 1);

    io.to(room.id).emit('turn-changed', {
      currentPlayer: nextPlayer,
      turn: newTurn
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    const roomId = roomManager.leaveRoom(socket.id);

    if (roomId) {
      // Notify other player in room
      io.to(roomId).emit('player-left');
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`PokéTactics server running on port ${PORT}`);
});
