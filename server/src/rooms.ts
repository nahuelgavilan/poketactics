import type { Room, ServerGameState, Player } from './types';

/**
 * Room manager for multiplayer games
 */
export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  /**
   * Generate a unique 6-character room code
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Make sure it's unique
    if (this.rooms.has(result)) {
      return this.generateRoomId();
    }
    return result;
  }

  /**
   * Create a new room
   */
  createRoom(hostId: string, gameMode: 'quick' | 'draft' = 'quick'): string {
    // Clean up any existing room for this player
    this.leaveRoom(hostId);

    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      hostId,
      guestId: null,
      gameMode,
      draftState: null,
      game: null,
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);

    return roomId;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomId: string, guestId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Sala no encontrada' };
    }

    if (room.guestId) {
      return { success: false, error: 'La sala está llena' };
    }

    if (room.hostId === guestId) {
      return { success: false, error: 'No puedes unirte a tu propia sala' };
    }

    // Clean up any existing room for this player
    this.leaveRoom(guestId);

    room.guestId = guestId;
    this.playerRooms.set(guestId, roomId);

    return { success: true };
  }

  /**
   * Leave current room
   */
  leaveRoom(playerId: string): string | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    // If host leaves, destroy room
    if (room.hostId === playerId) {
      // Remove guest from mapping
      if (room.guestId) {
        this.playerRooms.delete(room.guestId);
      }
      this.rooms.delete(roomId);
    } else {
      // Guest leaves
      room.guestId = null;
    }

    this.playerRooms.delete(playerId);
    return roomId;
  }

  /**
   * Get room for a player
   */
  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Check if player is host
   */
  isHost(playerId: string): boolean {
    const room = this.getPlayerRoom(playerId);
    return room?.hostId === playerId;
  }

  /**
   * Get player role in room
   */
  getPlayerRole(playerId: string): Player | null {
    const room = this.getPlayerRoom(playerId);
    if (!room) return null;
    if (room.hostId === playerId) return 'P1';
    if (room.guestId === playerId) return 'P2';
    return null;
  }

  /**
   * Set game state for a room
   */
  setGameState(roomId: string, gameState: ServerGameState): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.game = gameState;
    }
  }

  /**
   * Get room count (for health check)
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get other player ID in room
   */
  getOtherPlayer(playerId: string): string | null {
    const room = this.getPlayerRoom(playerId);
    if (!room) return null;
    if (room.hostId === playerId) return room.guestId;
    if (room.guestId === playerId) return room.hostId;
    return null;
  }

  /**
   * Check if room is full (both players present)
   */
  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return !!room && !!room.hostId && !!room.guestId;
  }

  /**
   * Clean up old rooms (older than 1 hour)
   */
  cleanup(): void {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    for (const [roomId, room] of this.rooms) {
      if (now.getTime() - room.createdAt.getTime() > oneHour) {
        if (room.hostId) this.playerRooms.delete(room.hostId);
        if (room.guestId) this.playerRooms.delete(room.guestId);
        this.rooms.delete(roomId);
      }
    }
  }
}
