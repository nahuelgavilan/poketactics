# PokéTactics - Game Design Document

## Overview

**PokéTactics** is a turn-based tactical RPG inspired by Advance Wars and Fire Emblem, featuring Pokémon combat mechanics. Two players compete on a procedurally generated battlefield with fog of war, evolution mechanics, and strategic terrain control.

- **Genre**: Turn-Based Tactics / Strategy RPG
- **Platform**: Web (Mobile-first responsive)
- **Players**: 2 (Hot-seat or Online multiplayer)
- **Tech Stack**: React, TypeScript, Tailwind CSS, Vite, Socket.IO

---

## Core Gameplay Loop

1. **Select** a unit from your team
2. **Open Action Menu** - choose your action
3. **Execute Action** - Move, Attack, Capture, or Wait
4. **End turn** when all units have acted (or manually end early)
5. **Repeat** until one team is eliminated

### Action Menu System

When a unit is selected, a bottom action menu appears with:

| Action | Description |
|--------|-------------|
| **Mover** | Select destination within movement range |
| **Atacar** | Select enemy within attack range |
| **Capturar** | Attempt wild Pokémon capture (tall grass only) |
| **Esperar** | End unit's turn without action |

After moving, the menu reopens without the Move/Capture options.

---

## Game States

| State | Description |
|-------|-------------|
| `menu` | Start screen / Main menu |
| `playing` | Active gameplay, player selecting/moving units |
| `battle` | Combat cinematic playing |
| `capture` | Wild Pokémon capture event |
| `evolution` | Evolution cinematic playing |
| `transition` | Turn change animation |
| `victory` | Game over, winner announced |

### Game Phases (within `playing`)

| Phase | Description |
|-------|-------------|
| `SELECT` | Player selecting a unit |
| `ACTION_MENU` | Unit selected, action menu visible |
| `MOVING` | Player selecting move destination |
| `ATTACKING` | Player selecting attack target |
| `WAITING` | Unit waiting (ending turn) |

---

## Units

### Unit Properties

```typescript
interface Unit {
  uid: string;           // Unique identifier
  owner: 'P1' | 'P2';    // Controlling player
  template: PokemonTemplate;
  x: number;             // Board position X
  y: number;             // Board position Y
  currentHp: number;     // Current health points
  hasMoved: boolean;     // Has acted this turn
  kills: number;         // Kill count for evolution
}
```

### Pokémon Template

Each Pokémon has base stats and typing:

| Stat | Description | Range |
|------|-------------|-------|
| `hp` | Health Points | 60-100 |
| `atk` | Attack Power | 35-60 |
| `def` | Defense | 25-50 |
| `mov` | Movement Range | 2-4 tiles |
| `rng` | Attack Range | 1-3 tiles |

### Starting Teams

- Each player starts with **3 random Pokémon**
- No duplicate Pokémon within a team
- P1 spawns at bottom-left corner
- P2 spawns at top-right corner

---

## Board & Terrain

### Board Dimensions

- **Width**: 8 tiles
- **Height**: 6 tiles

### Terrain Types

| Terrain | Defense | Move Cost | Type Bonus | Notes |
|---------|---------|-----------|------------|-------|
| Grass (Llanura) | 0% | 1 | Normal, Fighting | Default terrain |
| Forest (Bosque) | +20% | 2 | Grass, Bug, Poison | Defensive position |
| Water (Agua) | 0% | 99 | Water, Ice | Impassable (except Flying) |
| Mountain (Montaña) | +30% | 99 | Rock, Ground, Dragon | Impassable (except Flying) |
| Tall Grass (Hierba Alta) | +10% | 1 | Bug, Grass | Can trigger capture |
| Base | 0% | 1 | None | Spawn points |
| Pokémon Center | +15% | 1 | None | Heals 20% HP per turn |

### Pokémon Center

- **1-2 centers** spawn per map in the middle area
- Units on a Pokémon Center heal **20% of max HP** at the start of their owner's turn
- Marked with a red cross icon on the tile
- Provides light defensive bonus (+15%)

### Terrain Type Bonus

When a unit's type matches the terrain's type bonus list:
- **+25% Attack Power** while on that terrain

Example: A Water-type Pokémon on Water terrain deals 25% more damage.

### Flying Type

Flying-type Pokémon ignore terrain movement costs (always 1) and can traverse water/mountains.

---

## Combat System

### Damage Formula

```
Base Damage = (ATK × Effectiveness × TerrainBonus × CounterPenalty) - (DEF × DefenseMultiplier)
Final Damage = Base × CritMultiplier × Variance
```

### Combat Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CRIT_CHANCE` | 10% | Chance for critical hit |
| `CRIT_MULTIPLIER` | 1.5× | Critical hit damage bonus |
| `DAMAGE_VARIANCE` | ±10% | Random damage spread |
| `COUNTER_PENALTY` | 0.75× | Counter-attack deals 75% damage |

### Counter-Attack System

After the attacker strikes, the defender may counter-attack if:
1. Defender **survives** the initial attack (HP > 0)
2. Attacker is **within defender's attack range**

Counter-attacks:
- Deal **75% of normal damage**
- Can land critical hits
- Apply type effectiveness normally

### Type Effectiveness

Full 17-type Pokémon type chart implemented:

| Multiplier | Effect |
|------------|--------|
| 2.0× | Super Effective |
| 1.0× | Normal |
| 0.5× | Not Very Effective |
| 0.0× | Immune (No Damage) |

Dual-typed defenders multiply effectiveness (e.g., 2.0 × 2.0 = 4.0×)

### Attack Preview

Before confirming an attack, players see:
- **Damage range** (min-max with crit potential)
- **Type effectiveness** indicator
- **Counter-attack prediction** (if applicable)
- **Terrain bonuses** for both units
- **Critical hit chance**

---

## Capture System

### Trigger Conditions

When a unit moves onto **Tall Grass**:
- **30% chance** to encounter a wild Pokémon

### Capture Process

1. Wild Pokémon spawns adjacent to the capturer
2. Capture modal displays the Pokémon
3. New unit joins the capturer's team
4. Wild unit starts with `hasMoved: true`

### Spawn Position

The captured Pokémon spawns in the first available adjacent tile (checking in order: up, down, left, right).

---

## Evolution System

### Overview

Pokémon evolve based on **kill count**, gaining improved stats and new moves.

### Evolution Rules

- **2 kills** required per evolution stage
- Pokémon can evolve up to **2 times** (base → stage 1 → stage 2)
- Some Pokémon only have **1 evolution** (e.g., Magikarp → Gyarados)
- Upon evolution, **HP is fully restored**
- Evolution triggers **immediately after a kill** if threshold met

### Evolution Chains

Teams start with base forms that can evolve:

| Base | Stage 1 | Final | Kills |
|------|---------|-------|-------|
| Charmander | Charmeleon | Charizard | 0→2→4 |
| Squirtle | Wartortle | Blastoise | 0→2→4 |
| Bulbasaur | Ivysaur | Venusaur | 0→2→4 |
| Pichu | Pikachu | Raichu | 0→2→4 |
| Machop | Machoke | Machamp | 0→2→4 |
| Gastly | Haunter | Gengar | 0→2→4 |
| Dratini | Dragonair | Dragonite | 0→2→4 |
| Geodude | Graveler | Golem | 0→2→4 |
| Abra | Kadabra | Alakazam | 0→2→4 |
| Larvitar | Pupitar | Tyranitar | 0→2→4 |
| Riolu | Lucario | - | 0→2 |
| Magikarp | Gyarados | - | 0→2 |

### Evolution Cinematic

When evolution triggers, a cinematic plays showing:
1. **Intro** - "¡Está evolucionando!"
2. **Glow** - Particle effects and radial gradient
3. **Transform** - White silhouette transformation
4. **Reveal** - New Pokémon sprite revealed
5. **Stats** - Stat comparison showing improvements
6. **HP Restored** - Full health notification

---

## Fog of War

### Overview

Each player has limited visibility. Enemy units and terrain are hidden until explored.

### Vision Rules

- **Vision range**: 3 tiles (Manhattan distance) from each friendly unit
- **Explored terrain**: Once seen, terrain remains visible (revealed)
- **Enemy units**: Only visible when within current vision range
- **Own units**: Always visible regardless of position

### Visibility States

| State | Appearance | Info Shown |
|-------|------------|------------|
| **Visible** | Full color | Terrain + Units |
| **Explored** | Semi-transparent fog | Terrain only |
| **Hidden** | Black fog | Nothing |

### Strategic Impact

- Plan movements to reveal enemy positions
- Use high-mobility units for scouting
- Fog resets enemy visibility when they leave range

---

## Movement System

### Pathfinding Algorithm

Uses **Dijkstra's algorithm** considering:
- Terrain movement costs
- Enemy unit blocking
- Flying type ignoring terrain costs

### Movement Rules

1. Units can move **through** allied units
2. Units **cannot** move through enemy units
3. Units **cannot** stop on occupied tiles
4. Flying types pay **1 movement** for all terrain

---

## Win Condition

**Eliminate all enemy Pokémon** to win.

The game checks for victory after each combat resolution:
- If P1 has no units → P2 wins
- If P2 has no units → P1 wins

---

## Turn Structure

1. **Turn Start**: All units reset `hasMoved = false`
2. **Action Phase**: Player selects and moves units
3. **Auto End**: When all units have acted, turn ends automatically
4. **Transition**: Turn change animation plays
5. **Next Turn**: Control passes to opponent

Turn counter increments when P1's turn begins.

---

## User Interface

### Desktop Layout

```
┌─────────────────────────────────────────────┐
│                   Header                     │
├──────────────────────────┬──────────────────┤
│                          │                  │
│        Game Board        │     Sidebar      │
│         (8×6 grid)       │   (Team Info)    │
│                          │                  │
└──────────────────────────┴──────────────────┘
```

### Mobile Layout

```
┌─────────────────────────┐
│        Header           │
├─────────────────────────┤
│                         │
│       Game Board        │
│     (fullscreen)        │
│                         │
├─────────────────────────┤
│    Mobile Action Bar    │
└─────────────────────────┘
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `StartScreen` | Animated main menu |
| `HowToPlay` | 5-slide tutorial modal |
| `GameBoard` | Interactive tile grid |
| `Header` | Turn/player info, controls |
| `Sidebar` | Team roster, combat log |
| `GameHUD` | Team HP overview panel |
| `AttackPreview` | Damage prediction panel |
| `UnitTooltip` | Hover info for units |
| `BattleCinematic` | Combat animation sequence |
| `CaptureModal` | Wild Pokémon capture UI |
| `TurnTransition` | Turn change overlay |
| `VictoryScreen` | End game celebration |
| `MobileActionBar` | Touch action buttons |

---

## Visual Indicators

### Tile Highlighting

| Color | Meaning |
|-------|---------|
| Blue | Valid movement tiles |
| Red | Attackable enemy tiles |
| Yellow/Amber | Selected unit position |

### HP Bar Colors

| Percentage | Color |
|------------|-------|
| > 50% | Green |
| 25-50% | Yellow |
| < 25% | Red |

### Player Colors

- **P1 (Blue Team)**: Blue accents, blue indicators
- **P2 (Red Team)**: Red accents, red indicators

---

## Sprites & Assets

### Sprite Sources (PokeAPI)

| Type | URL Pattern |
|------|-------------|
| Icon (Map) | `sprites/pokemon/versions/generation-viii/icons/{id}.png` |
| Front (Battle) | `sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif` |
| Back (Battle) | `sprites/pokemon/versions/generation-v/black-white/animated/back/{id}.gif` |

### Fallbacks

If animated sprites unavailable:
- Static Gen 8 sprites used
- Icon sprites used for small displays

---

## Battle Cinematic Phases

### Attack Sequence

1. `intro` (800ms) - "X attacks!"
2. `charge` (800ms) - Power-up animation
3. `lunge` (400ms) - Attack motion
4. `impact` (600ms) - Hit flash, screen shake
5. `result` (1500ms) - Damage numbers, effectiveness text

### Counter-Attack Sequence

If defender survives and can counter:

6. `counter_intro` (800ms) - "Y counter-attacks!"
7. `counter_charge` (800ms) - Power-up
8. `counter_lunge` (400ms) - Attack motion
9. `counter_impact` (600ms) - Hit flash
10. `counter_result` (1500ms) - Damage display

### End Phase

11. `end` (500ms) - "Combat ends"

---

## Audio (Planned)

| Event | Sound |
|-------|-------|
| Unit Select | Click/tap feedback |
| Unit Move | Movement sound |
| Attack Hit | Impact based on type |
| Critical Hit | Enhanced impact |
| Capture | Pokéball shake + success |
| Victory | Fanfare |
| Turn Change | Transition chime |

---

## Accessibility

- High contrast color scheme
- Large touch targets (mobile)
- Keyboard navigation support (planned)
- Screen reader labels (planned)

---

## Technical Architecture

### Folder Structure

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

### State Management

Single `useGameState` hook manages all game state:
- Immutable state updates
- Callback-based actions
- Automatic turn progression

---

## Balance Considerations

### Intended Meta

- **Melee units** (rng: 1) deal higher damage but must close distance
- **Ranged units** (rng: 2-3) safer but lower damage
- **High mobility** trades for lower stats
- **Flying types** excel at mobility, vulnerable to specific types
- **Terrain control** rewards positioning

### Counter-Attack Balance

Counter-attacks at 75% damage encourage:
- Calculated aggression (overkill to prevent counter)
- Ranged unit value (attack without counter risk)
- Terrain positioning (defensive bonuses)

### Capture Gamble

30% capture chance in tall grass:
- Risk: Wasted turn if no capture
- Reward: Extra team member
- Strategy: Early captures most valuable

---

## Multiplayer System

### Overview

Online multiplayer allows two players to battle via WebSocket connection. Players create or join private rooms using 6-character codes.

### Connection Flow

1. **Connect** to WebSocket server
2. **Create Room** → receive room code (e.g., "ABC123")
3. **Share Code** with opponent
4. **Join Room** → enter room code
5. **Start Game** → host initiates when both connected

### Room System

- **6-character room codes** (e.g., "ABC123")
- Host creates room and waits
- Guest joins with room code
- Only host can start the game
- Room auto-deletes after 1 hour of inactivity

### Synchronization

Game actions are broadcast to opponent in real-time:
- Unit movements
- Attack results (damage, kills)
- Captures
- Evolutions
- Turn changes

### Server Architecture

```
server/
├── src/
│   ├── index.ts      # Express + Socket.IO server
│   ├── rooms.ts      # Room management
│   └── types.ts      # Server types
```

### Deployment

Server deployed to **Render.com** with `render.yaml` configuration.

---

## Future Features (Roadmap)

### High Priority
- [ ] AI opponent for single player
- [ ] Sound effects and music
- [ ] Unit abilities/special moves

### Medium Priority
- [ ] Map editor
- [ ] Campaign mode with progression
- [ ] Status effects (burn, paralysis, etc.)

### Low Priority
- [ ] Items and equipment
- [ ] Weather effects
- [ ] Day/night cycle

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | - | Initial release |
| 1.1.0 | - | Added counter-attacks, crits, terrain bonuses |
| 1.2.0 | - | Mobile UX overhaul, new UI components |
| 2.0.0 | - | Action Menu system, Pokémon Centers, Evolution system |
| 2.1.0 | - | Fog of War, Online Multiplayer |

---

## Credits

- **Pokémon sprites**: PokeAPI / Nintendo / Game Freak
- **Game concept**: Inspired by Advance Wars, Fire Emblem
- **Development**: Built with Claude AI assistance

---

*This document describes PokéTactics as of the current implementation. Features marked as "planned" or in the roadmap are not yet implemented.*
