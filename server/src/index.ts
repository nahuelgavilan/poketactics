import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms';
import {
  createGameState,
  getClientState,
  executeMove,
  executeAttack,
  executeWait,
  executeCapture,
  checkTurnEnd,
  executeEndTurn
} from './gameLogic';
import type { ClientToServerEvents, ServerToClientEvents, Player } from './types';

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

/**
 * Send game state to a specific player (filtered by fog of war)
 */
function sendStateToPlayer(socket: Socket<ClientToServerEvents, ServerToClientEvents>, roomId: string, player: Player) {
  const room = roomManager.getRoom(roomId);
  if (!room?.game) return;

  const clientState = getClientState(room.game, player);
  socket.emit('state-update', clientState);
}

/**
 * Send state updates to both players
 */
function broadcastStateUpdate(roomId: string) {
  const room = roomManager.getRoom(roomId);
  if (!room?.game) return;

  // Send P1's view to host
  if (room.hostId) {
    const hostSocket = io.sockets.sockets.get(room.hostId);
    if (hostSocket) {
      const p1State = getClientState(room.game, 'P1');
      hostSocket.emit('state-update', p1State);
    }
  }

  // Send P2's view to guest
  if (room.guestId) {
    const guestSocket = io.sockets.sockets.get(room.guestId);
    if (guestSocket) {
      const p2State = getClientState(room.game, 'P2');
      guestSocket.emit('state-update', p2State);
    }
  }
}

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

    // Create game state on server
    const gameState = createGameState();
    roomManager.setGameState(room.id, gameState);

    // Send initial state to each player (filtered by fog of war)
    const p1State = getClientState(gameState, 'P1');
    const p2State = getClientState(gameState, 'P2');

    io.to(room.hostId).emit('game-started', p1State);
    if (room.guestId) {
      io.to(room.guestId).emit('game-started', p2State);
    }

    console.log(`Game started in room ${room.id}`);
  });

  // Handle move action
  socket.on('action-move', ({ unitId, x, y }) => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    const result = executeMove(room.game, player, unitId, x, y);

    if (!result.success) {
      socket.emit('error', result.error || 'Movimiento inválido');
      return;
    }

    // Send move result to both players
    io.to(room.id).emit('action-result', {
      type: 'move',
      unitId,
      x,
      y,
      success: true
    });

    // Broadcast updated state
    broadcastStateUpdate(room.id);

    console.log(`Move: ${unitId} to (${x}, ${y}) in room ${room.id}`);
  });

  // Handle attack action
  socket.on('action-attack', ({ attackerId, defenderId }) => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    const result = executeAttack(room.game, player, attackerId, defenderId);

    if (!result.success) {
      socket.emit('error', result.error || 'Ataque inválido');
      return;
    }

    // Send attack result to both players
    io.to(room.id).emit('action-result', {
      type: 'attack',
      attackerId,
      defenderId,
      damage: result.damage,
      counterDamage: result.counterDamage,
      attackerDied: result.attackerDied,
      defenderDied: result.defenderDied,
      evolution: result.evolution
    });

    // Check turn end
    const turnResult = checkTurnEnd(room.game);
    if (turnResult.turnEnded) {
      io.to(room.id).emit('action-result', {
        type: 'turn-end',
        nextPlayer: turnResult.nextPlayer,
        turn: turnResult.turn
      });
    }

    // Broadcast updated state
    broadcastStateUpdate(room.id);

    console.log(`Attack: ${attackerId} -> ${defenderId}, damage: ${result.damage}, counter: ${result.counterDamage}`);
  });

  // Handle wait action
  socket.on('action-wait', ({ unitId }) => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    const result = executeWait(room.game, player, unitId);

    if (!result.success) {
      socket.emit('error', result.error || 'Acción inválida');
      return;
    }

    // Send wait result
    io.to(room.id).emit('action-result', {
      type: 'wait',
      unitId
    });

    // Check turn end
    const turnResult = checkTurnEnd(room.game);
    if (turnResult.turnEnded) {
      io.to(room.id).emit('action-result', {
        type: 'turn-end',
        nextPlayer: turnResult.nextPlayer,
        turn: turnResult.turn
      });
    }

    // Broadcast updated state
    broadcastStateUpdate(room.id);

    console.log(`Wait: ${unitId} in room ${room.id}`);
  });

  // Handle capture action
  socket.on('action-capture', ({ unitId }) => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    const result = executeCapture(room.game, player, unitId);

    if (!result.success) {
      socket.emit('error', result.error || 'Captura inválida');
      return;
    }

    // Send capture result
    io.to(room.id).emit('action-result', {
      type: 'capture',
      unitId,
      success: result.captured,
      newUnit: result.newUnit ? {
        uid: result.newUnit.uid,
        owner: result.newUnit.owner,
        templateId: result.newUnit.templateId,
        template: result.newUnit.template,
        x: result.newUnit.x,
        y: result.newUnit.y,
        currentHp: result.newUnit.currentHp,
        hasMoved: result.newUnit.hasMoved,
        kills: result.newUnit.kills
      } : undefined,
      pokemon: result.pokemon
    });

    // Check turn end
    const turnResult = checkTurnEnd(room.game);
    if (turnResult.turnEnded) {
      io.to(room.id).emit('action-result', {
        type: 'turn-end',
        nextPlayer: turnResult.nextPlayer,
        turn: turnResult.turn
      });
    }

    // Broadcast updated state
    broadcastStateUpdate(room.id);

    console.log(`Capture attempt by ${unitId}: ${result.captured ? 'SUCCESS' : 'FAILED'}`);
  });

  // Handle manual end turn (player clicks "End Turn" button)
  socket.on('action-end-turn', () => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    const result = executeEndTurn(room.game, player);

    if (!result.success) {
      socket.emit('error', result.error || 'No puedes terminar el turno');
      return;
    }

    // Send turn-end result to both players
    io.to(room.id).emit('action-result', {
      type: 'turn-end',
      nextPlayer: result.nextPlayer,
      turn: result.turn
    });

    // Broadcast updated state
    broadcastStateUpdate(room.id);

    console.log(`End turn: ${player} -> ${result.nextPlayer} (turn ${result.turn}) in room ${room.id}`);
  });

  // Request current state (for reconnection or sync)
  socket.on('request-state', () => {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room?.game) {
      socket.emit('error', 'No hay juego activo');
      return;
    }

    const player = roomManager.getPlayerRole(socket.id);
    if (!player) {
      socket.emit('error', 'No eres un jugador válido');
      return;
    }

    sendStateToPlayer(socket, room.id, player);
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
  res.json({ status: 'ok', rooms: roomManager.getRoomCount() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`PokéTactics server running on port ${PORT}`);
  console.log(`Server-authoritative multiplayer with fog of war`);
});
