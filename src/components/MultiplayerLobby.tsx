import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Users, Wifi, WifiOff, Loader2, Play, CheckCircle } from 'lucide-react';
import type { ConnectionStatus, RoomStatus } from '../hooks/useMultiplayer';
import type { Player } from '../types/game';

interface MultiplayerLobbyProps {
  onBack: () => void;
  gameMode: 'quick' | 'draft';
  // Multiplayer connection props (passed from Game.tsx)
  connectionStatus: ConnectionStatus;
  roomStatus: RoomStatus;
  roomId: string | null;
  myPlayer: Player | null;
  error: string | null;
  connect: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
}

export function MultiplayerLobby({
  onBack,
  gameMode,
  connectionStatus,
  roomStatus,
  roomId,
  myPlayer,
  error,
  connect,
  createRoom,
  joinRoom,
  startGame
}: MultiplayerLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Connect on mount (but don't disconnect on unmount - Game needs connection)
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect();
    }
  }, [connect, connectionStatus]);

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isHost = myPlayer === 'P1';
  const hasOpponent = roomStatus === 'ready';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='white' stroke-width='2'/%3E%3Cline x1='10' y1='30' x2='50' y2='30' stroke='white' stroke-width='2'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute -top-12 left-0 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        {/* Main card */}
        <div className="bg-slate-800/90 backdrop-blur rounded-2xl border border-slate-700 p-6 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Multijugador</h2>
            </div>

            {/* Game mode badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                gameMode === 'quick'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
              }`}>
                {gameMode === 'quick' ? '⚡ Batalla Rápida' : '🎯 Draft Mode'}
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {connectionStatus === 'connecting' && (
                <>
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span className="text-yellow-400">Conectando...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Conectado</span>
                </>
              )}
              {connectionStatus === 'disconnected' && (
                <>
                  <WifiOff className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Desconectado</span>
                </>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Lobby states */}
          {roomStatus === 'none' && (
            <div className="space-y-4">
              {/* Create room */}
              <button
                onClick={createRoom}
                disabled={!isConnected}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all shadow-lg"
              >
                Crear Sala
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-sm">o</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Join room */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Código de sala"
                  maxLength={6}
                  className="w-full py-3 px-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-center text-xl font-mono tracking-widest placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={() => joinRoom(joinCode)}
                  disabled={!isConnected || joinCode.length !== 6}
                  className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-all shadow-lg"
                >
                  Unirse
                </button>
              </div>
            </div>
          )}

          {/* Waiting / Ready state */}
          {(roomStatus === 'waiting' || roomStatus === 'ready') && roomId && (
            <div className="space-y-6">
              {/* Room code display */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Código de sala</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl font-mono font-bold text-white tracking-[0.3em] bg-slate-900/50 px-6 py-3 rounded-xl border border-slate-600">
                    {roomId}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Player status */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-blue-300 font-medium">
                    Jugador 1 {isHost ? '(Tú - Anfitrión)' : ''}
                  </span>
                  <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  hasOpponent
                    ? 'bg-red-500/20 border border-red-500/30'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${hasOpponent ? 'bg-red-500' : 'bg-slate-500'}`} />
                  <span className={hasOpponent ? 'text-red-300 font-medium' : 'text-slate-400'}>
                    Jugador 2 {!isHost && hasOpponent ? '(Tú)' : ''}
                  </span>
                  {hasOpponent ? (
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin ml-auto" />
                  )}
                </div>
              </div>

              {/* Start game button (host only) */}
              {isHost && (
                <button
                  onClick={startGame}
                  disabled={!hasOpponent}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6" />
                  {hasOpponent ? 'Iniciar Partida' : 'Esperando jugador...'}
                </button>
              )}

              {!isHost && (
                <div className="text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Esperando que el anfitrión inicie...
                </div>
              )}
            </div>
          )}

          {/* Creating / Joining loading states */}
          {(roomStatus === 'creating' || roomStatus === 'joining') && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-300">
                {roomStatus === 'creating' ? 'Creando sala...' : 'Uniéndose...'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
