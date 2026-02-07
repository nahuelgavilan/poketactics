import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Player, PokemonTemplate, StatusEffect } from '../types/game';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type RoomStatus = 'none' | 'creating' | 'joining' | 'waiting' | 'ready' | 'playing';

// Types matching server definitions
export interface ClientUnit {
  uid: string;
  owner: Player;
  templateId: number;
  template: PokemonTemplate;
  x: number;
  y: number;
  currentHp: number;
  hasMoved: boolean;
  kills: number;
  pp?: number[];
  status?: StatusEffect | null;
  statusTurns?: number;
}

export interface ClientGameState {
  map: number[][];
  units: ClientUnit[];
  turn: number;
  currentPlayer: Player;
  myPlayer: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  visibility: {
    visible: boolean[][];
    explored: boolean[][];
  };
}

export type ActionResult =
  | { type: 'move'; unitId: string; x: number; y: number; success: boolean; encounter?: { pokemon: PokemonTemplate; spawnPos: { x: number; y: number } } }
  | { type: 'attack'; attackerId: string; defenderId: string; damage: number; counterDamage: number; attackerDied: boolean; defenderDied: boolean; evolution?: { unitId: string; newTemplate: PokemonTemplate } }
  | { type: 'capture'; unitId: string; success: boolean; newUnit?: ClientUnit; pokemon?: PokemonTemplate }
  | { type: 'wait'; unitId: string }
  | { type: 'turn-end'; nextPlayer: Player; turn: number };

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
  createRoom: (gameMode: 'quick' | 'draft') => void;
  joinRoom: (code: string) => void;
  startGame: () => void;

  // Game actions (server-authoritative)
  sendMove: (unitId: string, x: number, y: number) => void;
  sendAttack: (attackerId: string, defenderId: string) => void;
  sendWait: (unitId: string) => void;
  sendCapture: (unitId: string, success?: boolean) => void;
  sendEndTurn: () => void;
  requestState: () => void;

  // Event handlers (set these to receive game events)
  onGameStarted: React.MutableRefObject<((state: ClientGameState) => void) | null>;
  onStateUpdate: React.MutableRefObject<((state: ClientGameState) => void) | null>;
  onActionResult: React.MutableRefObject<((result: ActionResult) => void) | null>;
  onPlayerJoined: React.MutableRefObject<(() => void) | null>;
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
  const onGameStarted = useRef<((state: ClientGameState) => void) | null>(null);
  const onStateUpdate = useRef<((state: ClientGameState) => void) | null>(null);
  const onActionResult = useRef<((result: ActionResult) => void) | null>(null);
  const onPlayerJoined = useRef<(() => void) | null>(null);
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

    // Room events
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
      if (onPlayerJoined.current) {
        onPlayerJoined.current();
      }
    });

    socket.on('player-left', () => {
      setRoomStatus('waiting');
      if (onPlayerLeft.current) {
        onPlayerLeft.current();
      }
    });

    // Game events (server-authoritative)
    socket.on('game-started', (state: ClientGameState) => {
      setRoomStatus('playing');
      if (onGameStarted.current) {
        onGameStarted.current(state);
      }
    });

    socket.on('state-update', (state: ClientGameState) => {
      if (onStateUpdate.current) {
        onStateUpdate.current(state);
      }
    });

    socket.on('action-result', (result: ActionResult) => {
      if (onActionResult.current) {
        onActionResult.current(result);
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

  const createRoom = useCallback((gameMode: 'quick' | 'draft') => {
    if (!socketRef.current?.connected) {
      setError('No conectado al servidor');
      return;
    }
    setRoomStatus('creating');
    socketRef.current.emit('create-room', { gameMode });
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

  // Server-authoritative game actions
  const sendMove = useCallback((unitId: string, x: number, y: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('action-move', { unitId, x, y });
  }, []);

  const sendAttack = useCallback((attackerId: string, defenderId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('action-attack', { attackerId, defenderId });
  }, []);

  const sendWait = useCallback((unitId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('action-wait', { unitId });
  }, []);

  const sendCapture = useCallback((unitId: string, success?: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('action-capture', { unitId, success });
  }, []);

  // End turn - tells server player is done (even if units haven't all moved)
  const sendEndTurn = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('action-end-turn');
  }, []);

  const requestState = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('request-state');
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
    sendMove,
    sendAttack,
    sendWait,
    sendCapture,
    sendEndTurn,
    requestState,
    onGameStarted,
    onStateUpdate,
    onActionResult,
    onPlayerJoined,
    onPlayerLeft
  };
}
