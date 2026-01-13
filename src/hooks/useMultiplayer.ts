import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Player } from '../types/game';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type RoomStatus = 'none' | 'creating' | 'joining' | 'waiting' | 'ready' | 'playing';

export type GameAction =
  | { type: 'move'; unitId: string; x: number; y: number }
  | { type: 'attack'; attackerId: string; defenderId: string; damage: number; counterDamage: number }
  | { type: 'capture'; unitId: string; newUnit: unknown }
  | { type: 'evolve'; unitId: string; newTemplateId: number; newHp: number }
  | { type: 'wait'; unitId: string };

interface UseMultiplayerReturn {
  // Connection state
  connectionStatus: ConnectionStatus;
  roomStatus: RoomStatus;
  roomId: string | null;
  myPlayer: Player | null;
  error: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
  sendAction: (action: GameAction) => void;
  endTurn: () => void;

  // Event handlers (set these to receive game events)
  onGameStarted: React.MutableRefObject<(() => void) | null>;
  onGameAction: React.MutableRefObject<((action: GameAction) => void) | null>;
  onTurnChanged: React.MutableRefObject<((data: { currentPlayer: Player; turn: number }) => void) | null>;
  onPlayerLeft: React.MutableRefObject<(() => void) | null>;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useMultiplayer(): UseMultiplayerReturn {
  const socketRef = useRef<Socket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('none');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Event handler refs
  const onGameStarted = useRef<(() => void) | null>(null);
  const onGameAction = useRef<((action: GameAction) => void) | null>(null);
  const onTurnChanged = useRef<((data: { currentPlayer: Player; turn: number }) => void) | null>(null);
  const onPlayerLeft = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setConnectionStatus('connecting');
    setError(null);

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setRoomStatus('none');
      setRoomId(null);
      setMyPlayer(null);
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
      setError('No se pudo conectar al servidor');
    });

    socket.on('room-created', (id: string) => {
      setRoomId(id);
      setRoomStatus('waiting');
      setMyPlayer('P1');
    });

    socket.on('room-joined', (data: { roomId: string; player: Player }) => {
      setRoomId(data.roomId);
      setRoomStatus('ready');
      setMyPlayer(data.player);
    });

    socket.on('player-joined', () => {
      setRoomStatus('ready');
    });

    socket.on('player-left', () => {
      setRoomStatus('waiting');
      if (onPlayerLeft.current) {
        onPlayerLeft.current();
      }
    });

    socket.on('game-started', () => {
      setRoomStatus('playing');
      if (onGameStarted.current) {
        onGameStarted.current();
      }
    });

    socket.on('game-action', (action: GameAction) => {
      if (onGameAction.current) {
        onGameAction.current(action);
      }
    });

    socket.on('turn-changed', (data: { currentPlayer: Player; turn: number }) => {
      if (onTurnChanged.current) {
        onTurnChanged.current(data);
      }
    });

    socket.on('error', (message: string) => {
      setError(message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
    setRoomStatus('none');
    setRoomId(null);
    setMyPlayer(null);
    setError(null);
  }, []);

  const createRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      setError('No conectado al servidor');
      return;
    }
    setRoomStatus('creating');
    socketRef.current.emit('create-room');
  }, []);

  const joinRoom = useCallback((code: string) => {
    if (!socketRef.current?.connected) {
      setError('No conectado al servidor');
      return;
    }
    if (!code || code.length !== 6) {
      setError('Código inválido');
      return;
    }
    setRoomStatus('joining');
    socketRef.current.emit('join-room', code.toUpperCase());
  }, []);

  const startGame = useCallback(() => {
    if (!socketRef.current?.connected) {
      setError('No conectado al servidor');
      return;
    }
    socketRef.current.emit('start-game');
  }, []);

  const sendAction = useCallback((action: GameAction) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('game-action', action);
  }, []);

  const endTurn = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('end-turn');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    connectionStatus,
    roomStatus,
    roomId,
    myPlayer,
    error,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startGame,
    sendAction,
    endTurn,
    onGameStarted,
    onGameAction,
    onTurnChanged,
    onPlayerLeft
  };
}
