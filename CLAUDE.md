# PokéTactics - Project Guidelines

## Documentation Requirements

### GDD.md as Source of Truth
**CRITICAL**: The `GDD.md` file must be the single source of truth for all game mechanics and systems.

Every time you implement, modify, or remove a feature:
1. **Update GDD.md FIRST** before marking the task as complete
2. Document the mechanic with full technical details
3. Include formulas, constants, and edge cases
4. Update the Version History section

### What to Document in GDD.md
- All game mechanics with exact formulas
- All constants and their values
- UI components and their purpose
- State machine transitions
- Data structures and interfaces
- Balance considerations
- Any assumptions or edge cases

## Project Structure

```
src/
├── components/       # React UI components
│   ├── GameBoard/    # Board + Tile components
│   └── overlays/     # Modal overlays
├── constants/        # Game data (types, terrain, pokemon)
├── hooks/            # React hooks (useGameState)
├── types/            # TypeScript definitions
└── utils/            # Game logic (combat, pathfinding, capture)
```

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Sprites**: PokeAPI (Gen 5 animated, Gen 8 icons)

## Code Conventions

### State Management
- All game state lives in `useGameState` hook
- Use immutable updates (spread operators, map/filter)
- Callbacks wrapped in `useCallback` with proper dependencies

### Component Guidelines
- Functional components only
- Props interfaces defined inline or in types/game.ts
- Mobile-first responsive design
- Touch-friendly interactions (min 44px tap targets)

### Game Logic
- Pure functions in utils/ folder
- Constants in constants/ folder
- No side effects in calculation functions

## Current Game Systems

### Implemented
- Turn-based hot-seat multiplayer
- 17-type effectiveness system
- Terrain with defense bonuses and type synergies
- Movement with Dijkstra pathfinding
- Combat with counter-attacks and critical hits
- Capture system in tall grass
- Battle cinematics

### Planned/In Development
- Action menu system (Move/Attack/Capture/Wait)
- Evolution system (2 kills to evolve)
- Pokémon Center buildings (healing)
- Fog of War (3-tile vision radius)
- Online multiplayer (WebSocket server)

## Multiplayer Architecture (Planned)

### Server
- Node.js + Express + Socket.io
- Deployed on Render
- Room-based matchmaking
- State synchronization

### Client
- Socket.io-client
- Optimistic updates with server reconciliation
- Reconnection handling

## Testing Checklist
Before marking a feature complete:
- [ ] Works on desktop (mouse)
- [ ] Works on mobile (touch)
- [ ] State updates correctly
- [ ] No TypeScript errors
- [ ] GDD.md updated
