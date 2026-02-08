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
            className="self-start inline-flex items-center gap-2 px-3 py-2 rounded-sm border-[2px] border-amber-600/70 bg-[#f8efd9] hover:bg-[#f2e4c5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
            <span className="text-[9px] uppercase tracking-[0.12em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
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
                  <div className="border-[2px] border-rose-500/70 bg-rose-100 rounded-sm p-3">
                    <p
                      className="text-[9px] uppercase tracking-[0.11em] text-rose-900"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                {roomStatus === 'none' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-amber-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Host lobby
                      </p>
                      <p className="text-[12px] tracking-[0.02em] text-slate-700 font-ui">
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

                    <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-amber-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Join lobby
                      </p>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-amber-700/55 rounded-sm bg-[#fffaf0] text-center text-sm text-slate-800 tracking-[0.45em] font-mono uppercase placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
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
                    <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3">
                      <p className="text-[8px] uppercase tracking-[0.12em] text-amber-900/80 mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Codigo de Sala
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 px-3 py-2 border border-amber-500/65 bg-[#fffaf0] rounded-sm text-center text-2xl text-amber-800 tracking-[0.35em] font-mono">
                          {roomId}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-3 py-2 border border-amber-700/60 rounded-sm bg-[#f4e7ca] hover:bg-[#ecd9b4] transition-colors inline-flex items-center justify-center gap-2"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-slate-700" />}
                          <span className="text-[8px] uppercase tracking-[0.1em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                            {copied ? 'Copiado' : 'Copiar'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3 space-y-2">
                      <div className={`flex items-center gap-2 px-2 py-2 rounded-sm border ${
                        isHost ? 'border-sky-500/55 bg-sky-100' : 'border-amber-700/40 bg-[#fff7e8]'
                      }`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-800" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Jugador 1 {isHost ? '(tu host)' : ''}
                        </p>
                        <CheckCircle className="w-4 h-4 text-emerald-700 ml-auto" />
                      </div>

                      <div className={`flex items-center gap-2 px-2 py-2 rounded-sm border ${
                        hasOpponent ? 'border-rose-500/55 bg-rose-100' : 'border-amber-700/40 bg-[#fff7e8]'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${hasOpponent ? 'bg-rose-400' : 'bg-amber-100/35'}`} />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-800" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Jugador 2 {!isHost && hasOpponent ? '(tu)' : hasOpponent ? '' : '(esperando)'}
                        </p>
                        {hasOpponent ? (
                          <CheckCircle className="w-4 h-4 text-emerald-700 ml-auto" />
                        ) : (
                          <Loader2 className="w-4 h-4 text-slate-500 animate-spin ml-auto" />
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
                      <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3 text-center">
                        <Loader2 className="w-5 h-5 text-blue-300 animate-spin mx-auto mb-2" />
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          Waiting host to start
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(roomStatus === 'creating' || roomStatus === 'joining') && (
                  <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-5 text-center">
                    <Loader2 className="w-8 h-8 text-blue-300 animate-spin mx-auto mb-3" />
                    <p className="text-[9px] uppercase tracking-[0.12em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {roomStatus === 'creating' ? 'Creando sala' : 'Uniendo jugador'}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-[2px] border-amber-700/65 bg-[#f8efd9] rounded-sm p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-700" />
                  <p className="text-[9px] uppercase tracking-[0.12em] text-amber-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Network State
                  </p>
                </div>

                <div className="flex items-center gap-2 px-2 py-2 rounded-sm border border-amber-700/45 bg-[#fff7e8]">
                  {connectionStatus === 'connecting' && <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />}
                  {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-emerald-700" />}
                  {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-rose-700" />}
                  <p className="text-[8px] uppercase tracking-[0.1em] text-slate-700" style={{ fontFamily: '"Press Start 2P", monospace' }}>
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
