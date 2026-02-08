import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Users, Wifi, WifiOff, Loader2, Play, CheckCircle, Shield, Radio } from 'lucide-react';
import type { ConnectionStatus, RoomStatus } from '../hooks/useMultiplayer';
import type { Player } from '../types/game';
import {
  StartMenuShell,
  MenuActionButton,
  MenuBadge,
  MenuPanel,
  MenuStatRow,
} from './menu/StartMenuTheme';

interface MultiplayerLobbyProps {
  onBack: () => void;
  gameMode: 'quick' | 'draft';
  connectionStatus: ConnectionStatus;
  roomStatus: RoomStatus;
  roomId: string | null;
  myPlayer: Player | null;
  error: string | null;
  connect: () => void;
  createRoom: (gameMode: 'quick' | 'draft') => void;
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
  startGame,
}: MultiplayerLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect();
    }
  }, [connect, connectionStatus]);

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = connectionStatus === 'connected';
  const isHost = myPlayer === 'P1';
  const hasOpponent = roomStatus === 'ready';

  return (
    <StartMenuShell>
      <div className="h-full flex items-center justify-center p-3 md:p-6">
        <div className="w-full max-w-5xl flex flex-col gap-3 md:gap-4 animate-start-menu-slide-up">
          <button
            type="button"
            onClick={onBack}
            className="self-start inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-slate-600 bg-slate-900/80 hover:bg-slate-800/95 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-100" />
            <span className="text-[9px] uppercase tracking-[0.12em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              Volver
            </span>
          </button>

          <MenuPanel
            title="Multijugador"
            subtitle="Create room or join with code"
            accent="blue"
            rightSlot={
              <MenuBadge
                label={gameMode === 'quick' ? 'Quick mode' : 'Draft mode'}
                accent={gameMode === 'quick' ? 'green' : 'violet'}
              />
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-3 md:gap-4">
              <div className="space-y-3">
                {error && (
                  <div className="border border-red-500/70 bg-red-950/45 rounded-sm p-3">
                    <p
                      className="text-[9px] uppercase tracking-[0.11em] text-red-200"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                {roomStatus === 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-slate-700 bg-slate-950/70 rounded-sm p-3 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Host lobby
                      </p>
                      <p className="text-[8px] uppercase tracking-[0.11em] text-slate-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Create a room and share the code.
                      </p>
                      <MenuActionButton
                        label="Crear Sala"
                        icon={Shield}
                        color="blue"
                        onClick={() => createRoom(gameMode)}
                        disabled={!isConnected}
                        subtitle={gameMode === 'quick' ? 'Quick battle' : 'Draft battle'}
                      />
                    </div>

                    <div className="border border-slate-700 bg-slate-950/70 rounded-sm p-3 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Join lobby
                      </p>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-slate-600 rounded-sm bg-slate-900/90 text-center text-sm text-white tracking-[0.45em] font-mono uppercase placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
                      />
                      <MenuActionButton
                        label="Unirse"
                        icon={Users}
                        color="green"
                        onClick={() => joinRoom(joinCode)}
                        disabled={!isConnected || joinCode.length !== 6}
                        subtitle="Needs 6-char code"
                      />
                    </div>
                  </div>
                )}

                {(roomStatus === 'waiting' || roomStatus === 'ready') && roomId && (
                  <div className="space-y-3">
                    <div className="border border-slate-700 bg-slate-950/75 rounded-sm p-3">
                      <p className="text-[8px] uppercase tracking-[0.12em] text-slate-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Codigo de Sala
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 px-3 py-2 border border-amber-400/70 bg-slate-900 rounded-sm text-center text-2xl text-amber-200 tracking-[0.35em] font-mono">
                          {roomId}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-3 py-2 border border-slate-600 rounded-sm bg-slate-900 hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-slate-200" />}
                          <span className="text-[8px] uppercase tracking-[0.1em] text-slate-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                            {copied ? 'Copiado' : 'Copiar'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-700 bg-slate-950/75 rounded-sm p-3 space-y-2">
                      <div className={`flex items-center gap-2 px-2 py-2 rounded-sm border ${
                        isHost ? 'border-blue-400/60 bg-blue-900/35' : 'border-slate-600 bg-slate-900/60'
                      }`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Jugador 1 {isHost ? '(tu host)' : ''}
                        </p>
                        <CheckCircle className="w-4 h-4 text-emerald-300 ml-auto" />
                      </div>

                      <div className={`flex items-center gap-2 px-2 py-2 rounded-sm border ${
                        hasOpponent ? 'border-red-400/60 bg-red-900/35' : 'border-slate-600 bg-slate-900/60'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${hasOpponent ? 'bg-red-400' : 'bg-slate-500'}`} />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Jugador 2 {!isHost && hasOpponent ? '(tu)' : hasOpponent ? '' : '(esperando)'}
                        </p>
                        {hasOpponent ? (
                          <CheckCircle className="w-4 h-4 text-emerald-300 ml-auto" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin ml-auto" />
                        )}
                      </div>
                    </div>

                    {isHost ? (
                      <MenuActionButton
                        label={hasOpponent ? 'Iniciar Partida' : 'Esperando Rival'}
                        icon={Play}
                        color="green"
                        onClick={startGame}
                        disabled={!hasOpponent}
                        subtitle={hasOpponent ? 'Launch battle now' : 'Need second player'}
                      />
                    ) : (
                      <div className="border border-slate-700 bg-slate-950/75 rounded-sm p-3 text-center">
                        <Loader2 className="w-5 h-5 text-blue-300 animate-spin mx-auto mb-2" />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-300" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Waiting host to start
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(roomStatus === 'creating' || roomStatus === 'joining') && (
                  <div className="border border-slate-700 bg-slate-950/75 rounded-sm p-5 text-center">
                    <Loader2 className="w-8 h-8 text-blue-300 animate-spin mx-auto mb-3" />
                    <p className="text-[9px] uppercase tracking-[0.12em] text-slate-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {roomStatus === 'creating' ? 'Creando sala' : 'Uniendo jugador'}
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-slate-700 bg-slate-950/70 rounded-sm p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-300" />
                  <p className="text-[9px] uppercase tracking-[0.12em] text-amber-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Network State
                  </p>
                </div>

                <div className="flex items-center gap-2 px-2 py-2 rounded-sm border border-slate-600 bg-slate-900/70">
                  {connectionStatus === 'connecting' && <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />}
                  {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-emerald-300" />}
                  {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-300" />}
                  <p className="text-[8px] uppercase tracking-[0.1em] text-slate-100" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {connectionStatus}
                  </p>
                </div>

                <MenuStatRow label="Lobby" value={roomStatus} />
                <MenuStatRow label="Role" value={isHost ? 'Host' : myPlayer ? 'Guest' : 'Unassigned'} />
                <MenuStatRow label="Mode" value={gameMode === 'quick' ? 'Quick battle' : 'Draft battle'} />

                {!isConnected && (
                  <MenuActionButton
                    label="Reconectar"
                    icon={Wifi}
                    color="amber"
                    onClick={connect}
                  />
                )}
              </div>
            </div>
          </MenuPanel>
        </div>
      </div>
    </StartMenuShell>
  );
}
