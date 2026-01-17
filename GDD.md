# PokéTactics - Game Design Document

## Overview

**PokéTactics** is a turn-based tactical RPG inspired by Advance Wars and Fire Emblem, featuring Pokémon combat mechanics. Two players compete on a procedurally generated battlefield with fog of war, evolution mechanics, and strategic terrain control.

- **Genre**: Turn-Based Tactics / Strategy RPG
- **Platform**: Web (Mobile-first responsive)
- **Players**: 2 (Hot-seat or Online multiplayer)
- **Tech Stack**: React, TypeScript, Tailwind CSS, Vite, Socket.IO
- **Current Version**: 0.20.0 (Alpha)

---

## Core Gameplay Loop

1. **Select unit** → see movement range (blue overlay)
2. **Click destination** → preview path with red arrow, see attack range from that position
3. **Action Menu appears** → next to the destination tile (Fire Emblem style)
4. **Choose action**: Atacar (if enemies in range), Esperar (confirm move), Cancelar (go back)
5. **Combat** → if attacking, battle cinematic plays
6. **Random encounter** → 30% chance on tall grass triggers capture minigame
7. **Turn auto-ends** when all units have acted
8. **Repeat** until one team is eliminated

### Fire Emblem Style Preview System

The game uses a **preview-then-confirm** flow like Fire Emblem:

| Phase | What Happens |
|-------|--------------|
| **SELECT** | Click your unit to see movement range (blue tiles) |
| **MOVING** | Click destination to preview path (red arrow shows route) |
| **ACTION_MENU** | Contextual menu appears next to tile with options |
| **ATTACKING** | If "Atacar" chosen, click red tile to select target |
| **WAITING** | Unit's turn ends, marked as moved |

### Contextual Action Menu

When you select a destination, a **Fire Emblem style menu** appears next to the tile:

- **Position**: Appears to the LEFT of tile if on right half of board, otherwise RIGHT
- **Notch pointer**: Small arrow connecting menu to the tile
- **Options**:
  - **Atacar** (red) - Only shown if enemies in attack range
  - **Esperar** (green) - Confirm move and end unit's turn
  - **Cancelar** (gray) - Go back to movement selection
- **Change destination**: During ACTION_MENU, click another valid tile to change destination

### Random Encounters

When moving to **Tall Grass**, there's a **30% chance** of triggering a wild Pokémon encounter. If triggered, the capture minigame starts automatically.

---

## Game States

| State | Description |
|-------|-------------|
| `menu` | Start screen / Main menu |
| `playing` | Active gameplay, player selecting/moving units |
| `battle` | Combat cinematic playing |
| `capture_minigame` | Wild Pokémon capture minigame |
| `capture_result` | Capture result modal |
| `evolution` | Evolution cinematic playing |
| `transition` | Turn change animation |
| `victory` | Game over, winner announced |

### Game Phases (within `playing`)

| Phase | Description |
|-------|-------------|
| `SELECT` | Player selecting a unit |
| `MOVING` | Player selecting move destination (shows blue tiles) |
| `ACTION_MENU` | Contextual menu shown, player chooses action |
| `ATTACKING` | Player selecting attack target (shows red tiles) |
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

- **Width**: 6 tiles
- **Height**: 8 tiles

### Terrain Types

| Terrain | Defense | Move Cost | Type Bonus | Notes |
|---------|---------|-----------|------------|-------|
| Grass (Llanura) | 0% | 1 | Normal, Fighting | Default terrain |
| Forest (Bosque) | +20% | 2 | Grass, Bug, Poison | Defensive position |
| Water (Agua) | 0% | 99 | Water, Ice | Impassable (except Flying) |
| Mountain (Montaña) | +40% | 3 | Rock, Ground, Steel | High ground, +2 vision range |
| Tall Grass (Hierba Alta) | +5% | 1 | Bug, Grass | Can trigger capture |
| Base | +10% | 1 | None | Spawn points |
| Pokémon Center | +15% | 1 | None | Heals 20% HP per turn |

### Terrain Info Panel

Clicking an **empty tile** (no unit) during the SELECT phase shows a **Terrain Info Panel** at the bottom of the screen with:
- Terrain name and icon
- Defense bonus (%)
- Movement cost
- Special properties (capture chance, healing, vision bonus)
- Type attack bonuses

**UX**: Click anywhere to dismiss (tap same tile to toggle, tap panel, or tap any other tile/unit). Shows "Toca para cerrar" hint.

### Terrain Visual Distinctions

Each terrain has unique visual elements (no icons, CSS-only decorations):

| Terrain | Color | Visual Elements |
|---------|-------|-----------------|
| **Plains** | Light green (lime → green) | Subtle horizontal mowed grass lines |
| **Tall Grass** | Medium green | Vertical grass blade shapes with jagged tips |
| **Forest** | Dark green (emerald) | Tree canopy circles with dappled light |
| **Water** | Cyan → blue | Animated wave pattern + shimmer |
| **Mountain** | Amber → stone | Triangle peaks with snow caps |
| **Pokémon Center** | Pink/rose | Pulsing healing glow + white cross |
| **Base** | Slate gray | Tech grid pattern + corner markers |

### Mountain Vision Bonus

Units standing on mountains gain **+2 vision range** (total 5 tiles instead of 3). This makes mountains strategic scouting positions despite the high movement cost.

### Pokémon Center

- **1-2 centers** spawn per map in the middle area
- Units on a Pokémon Center heal **20% of max HP** at the start of their owner's turn
- Visually marked with pink/rose gradient, white cross pattern, and pulsing healing glow
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

### Overview

The capture system uses a **probability-based formula** with a **3-ring timing minigame**. Players can optionally attack once to weaken the wild Pokémon before attempting capture.

### Trigger Conditions

When a unit moves to **Tall Grass**, there's a **30% chance** of triggering a wild Pokémon encounter. The capture minigame then begins.

### Capture Minigame Phases

#### Phase 1: Dramatic Intro
1. **Flash** (150ms) - White screen flash
2. **Alert** (550ms) - Giant "!" appears with shake animation
3. **Silhouette** (700ms) - Mystery dark silhouette with type-colored glow
4. **Reveal** (800ms) - Pokémon revealed with brightness flash and name

#### Phase 2: Battle Menu
Player sees the wild Pokémon with:
- **Name and type badges**
- **HP bar** (GBA-style with gradient colors)
- **Current capture chance** percentage

**Action Buttons** (premium GBA-style with 3D depth):
- **ATACAR** (red) - Attack once to weaken (only usable once)
- **CAPTURAR** (amber) - Start ring timing minigame
- **HUIR** (gray) - Flee from encounter

#### Phase 3: Attack Cinematic (if chosen)
When player chooses to attack:
1. **Intro** - Player's Pokémon slides in from left
2. **Execute** - Attack hits, damage number flies up, wild Pokémon flashes
3. **Counter** - Wild Pokémon counter-attacks, player's Pokémon takes damage
4. **Outro** - Player's Pokémon slides out, returns to battle menu

**Note**: Only the wild Pokémon is visible normally. The player's Pokémon only appears during the attack cinematic.

#### Phase 4: Ring Timing Minigame
Three consecutive ring challenges, each faster than the last:

| Ring | Speed | Duration |
|------|-------|----------|
| Ring 1 | Slow | 1800ms |
| Ring 2 | Medium | 1400ms |
| Ring 3 | Fast | 1000ms |

**Visual Elements**:
- Target ring with type-colored border and glow
- Zone indicators (green/blue/yellow circles)
- 12 orbiting particles around the ring
- Pokéball in center
- Shrinking ring that changes color based on timing zone

**Timing Zones**:
| Ring Size | Rating | Bonus |
|-----------|--------|-------|
| ≤20% | PERFECTO | +10% |
| ≤40% | GENIAL | +6% |
| ≤65% | BIEN | +3% |
| >65% | Fallaste | +0% |

**Tap Feedback**: Burst particles on tap, ring result message with bounce animation

#### Phase 5: Pokéball Throw & Shake
1. **Throw** - Pokéball flies up from bottom with spin
2. **Shake** - 3 shakes with wobble animation
3. **Stars** - Each shake lights up a star indicator
4. **Sparkle particles** on each shake

#### Phase 6: Result
- **Success**: Confetti rain, "¡CAPTURADO!" message, Pokémon joins team
- **Failure**: "¡ESCAPÓ!" message, Pokémon flees

### Capture Probability Formula

```
Capture Chance = Base Rate + HP Bonus + Ring Bonus
```

**Capped between 5% and 95%** (never guaranteed, never impossible)

#### Base Rate (based on Pokémon stats)

```typescript
statTotal = hp + atk + def

if (statTotal < 100) baseRate = 45%
if (statTotal < 150) baseRate = 35%
if (statTotal < 200) baseRate = 25%
else baseRate = 15%
```

#### HP Bonus (from weakening)

```
HP Bonus = (1 - currentHP/maxHP) × 40%
```

| Wild HP | HP Bonus |
|---------|----------|
| 100% | +0% |
| 75% | +10% |
| 50% | +20% |
| 25% | +30% |
| 1 HP | +40% |

#### Ring Bonus (from timing)

Sum of all 3 ring results:
- Perfect: +10% each (max +30%)
- Great: +6% each (max +18%)
- Good: +3% each (max +9%)
- Miss: +0%

### Example Calculation

| Factor | Value |
|--------|-------|
| Base Rate (weak Pokémon) | 35% |
| HP Bonus (hit down to 50%) | +20% |
| Ring 1: Perfect | +10% |
| Ring 2: Great | +6% |
| Ring 3: Good | +3% |
| **Total** | **74%** |

### Spawn Position

The captured Pokémon spawns in the first available adjacent tile (checking cardinal + diagonal directions).

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
| **Explored** | Grayscale (70%), dimmed | Terrain only |
| **Hidden** | Dark grayscale (100%), very dim | Nothing |

The fog effect is applied directly to tiles (grayscale filter) rather than an overlay, making it cleaner and more integrated with the game visuals.

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

### Premium Start Screen (v0.18.0)

GBA-inspired boot sequence with premium animations:

#### Boot Sequence Phases
1. **Boot** (2000ms) - GBA-style loading bar with "INICIANDO..." text
2. **Title** (variable) - Letter-by-letter reveal of "POKÉTACTICS" with glow effects
3. **Ready** - Full menu with team showcase

#### Visual Elements
- **Layered background**: Diagonal split (blue/red), gradient orbs, particle effects
- **Team Showcase**:
  - P1 (Blue): Pikachu, Dragonite, Lucario with blue glow
  - P2 (Red): Charizard, Gengar, Gyarados with red glow
- **Signature Pokémon**: Largest sprite in front with pulsing glow
- **Version badge**: "v{VERSION} ALPHA" at bottom
- **Menu buttons**: "JUGAR" (primary), "CÓMO JUGAR" (secondary)

### Premium Victory Screen (v0.18.0)

Celebration screen with GBA-style effects:

#### Victory Sequence Phases
1. **Flash** (200ms) - White flash
2. **Reveal** (600ms) - Background and trophy appear
3. **Celebrate** (700ms) - Confetti and effects begin
4. **Ready** - Buttons appear

#### Visual Elements
- **Team-colored gradient background** (blue for P1, red for P2)
- **Animated glow orbs** with pulse effect
- **Crown** above trophy with golden glow
- **Trophy** with team-colored circle and ping animation
- **"VICTORIA"** text with golden glow
- **Team name** ("AZUL" or "ROJO") with 3D text shadow
- **Confetti rain** (50 particles) in team colors + gold
- **Twinkling stars** (15 stars) with twinkle animation
- **Version badge** at bottom
- **Action buttons**: "Revancha", "Menú"

### Desktop Layout

```
┌─────────────────────────────────────────────┐
│                   Header                     │
├─────────────────────────────────────────────┤
│  ┌──────────┐                               │
│  │Unit Info │     ┌─────────────────────┐   │
│  └──────────┘     │                     │   │
│                   │    Game Board       │   │
│                   │      (6×8 grid)     │   │
│                   │                     │   │
│                   └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────┐
│        Header           │
├─────────────────────────┤
│                         │
│       Game Board        │
│     (fills screen)      │
│                         │
├─────────────────────────┤
│  Selected Unit Stats    │
└─────────────────────────┘
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `StartScreen` | GBA boot sequence, letter-by-letter title, team showcase, version badge |
| `HowToPlay` | 5-slide tutorial modal |
| `GameBoard` | Interactive tile grid with units |
| `Header` | Turn/player info, dropdown menu with actions |
| `UnitActionMenu` | Fire Emblem style contextual menu (appears next to tile) |
| `BattleCinematic` | GBA-style combat animation with VS intro, segmented HP bars |
| `CaptureMinigame` | Probability-based capture with ring timing, attack option |
| `CaptureModal` | Capture result with stat bars and type badges |
| `EvolutionCinematic` | Evolution animation with stat comparison |
| `TurnTransition` | Fire Emblem style turn change: diagonal slash, shield emblem |
| `VictoryScreen` | Confetti celebration with crown/trophy animation |
| `MultiplayerLobby` | Room creation/joining UI |

---

## Visual Indicators

### Tile Highlighting (Fire Emblem Style)

Clean semi-transparent overlays without animation clutter:

| Color | Style | Meaning |
|-------|-------|---------|
| Blue overlay | `rgba(100,180,255,0.35)` + inset border | Valid movement tiles |
| Red overlay | `rgba(255,80,80,0.5)` + inset border | Attackable enemy tiles |
| Yellow ring | 3px solid `#fbbf24` | Selected unit position |

### Pathfinding Arrows

When hovering over a valid move tile, a continuous RED arrow path shows the route:

| Element | Visual |
|---------|--------|
| **Start** | Red circle (`r=14`) at unit position |
| **Path** | Red line (`strokeWidth=18`) with smooth curved corners |
| **End** | Diamond arrow pointing in travel direction, animated bounce |

Features:
- **Gap bridging**: Lines extend 25% beyond tile boundaries for seamless connections
- **Smooth curves**: Quadratic bezier curves (`r=25`) at corner tiles
- **Red glow effect**: `drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))`
- Arrow head points in **direction of travel** (opposite of entry direction)
- Path tiles **lift up** with `translate-y-[-2px] brightness-110`

### 3D Tile Style

Tiles use a Nintendo-quality 3D raised effect:

| Property | Value |
|----------|-------|
| **Shape** | `rounded-2xl` |
| **3D Edge** | `border-b-[6px]` with darker color |
| **Gradient** | `bg-gradient-to-br` Tailwind classes |
| **Textures** | Grid (grass), stripes (tall grass), dots (base) |
| **Selection** | `border-4 border-yellow-400` with glow shadow |

### HP Bar Colors

| Percentage | Color |
|------------|-------|
| > 50% | Green gradient |
| 25-50% | Yellow/Amber gradient |
| < 25% | Red/Orange gradient |

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

### GBA-Style Battle (v0.15.0)

Premium battle cinematic with Fire Emblem / Pokémon GBA aesthetics:

#### VS Intro Sequence
1. **Diagonal split** - Screen splits diagonally
2. **VS emblem** - "VS" appears with glow
3. **Stat panels** - Both Pokémon stats slide in
4. **Particles** - Type-colored particles

#### Combat Sequence

1. `intro` (800ms) - "X attacks!"
2. `charge` (800ms) - Power-up animation
3. `lunge` (400ms) - Attack motion
4. `impact` (600ms) - Hit flash, screen shake
5. `result` (1500ms) - Damage numbers, effectiveness text

#### Counter-Attack Sequence

If defender survives and can counter:

6. `counter_intro` (800ms) - "Y counter-attacks!"
7. `counter_charge` (800ms) - Power-up
8. `counter_lunge` (400ms) - Attack motion
9. `counter_impact` (600ms) - Hit flash
10. `counter_result` (1500ms) - Damage display

#### End Phase

11. `end` (500ms) - "Combat ends"

#### Visual Features
- **Segmented HP bars** (10 segments like GBA games)
- **Stat panels** with ATK/DEF display
- **Type-colored backgrounds** and glows
- **Typewriter text** animation
- **Particle effects** throughout

---

## Audio

### Music System (useAudio hook)

**Implemented Tracks:**
- **Menu Theme** - Orchestral adventure theme, plays on start screen (looped at 50% volume)
- **Board Theme** - Strategic gameplay music, plays during normal turn-based play (looped at 30% volume)
- **Battle Theme** - Intense tactical combat music, plays during attack phase and battles (looped at 50% volume)

**Technical Details:**
- `useAudio.ts` hook manages audio playback
- Supports loop, volume control, and fade-out transitions
- Audio files stored in `public/audio/music/`
- Automatic track switching based on game state

### Sound Effects (useSFX hook)

**Implemented SFX:**

*UI Sounds:*
- **Unit Select** - Tactical unit selection with subtle chime (50% volume)
- **Unit Deselect** - Soft deselection sound (40% volume)
- **Unit Move** - Unit movement confirmation sound (50% volume)
- **Menu Open** - Action menu/dropdown appearing (40% volume)
- **Menu Close** - Action menu/dropdown closing (40% volume)
- **Button Click** - UI button press feedback (50% volume)

*Capture Minigame Sounds:*
- **Wild Encounter** - Surprise encounter alert (60% volume)
- **Ring Hit Perfect** - Perfect timing reward chime (60% volume)
- **Ring Hit Good** - Good timing confirmation (50% volume)
- **Ring Miss** - Timing miss feedback (40% volume)
- **Pokeball Throw** - Pokeball launch sound (60% volume)
- **Pokeball Shake** - Tense wobble sound, plays 3 times (50% volume)
- **Pokeball Open** - Pokemon breaks free (60% volume)
- **Capture Fail** - Escape sound after pokeball opens (50% volume)
- **Flee Success** - Successful retreat from encounter (60% volume)

**Technical Details:**
- `useSFX.ts` hook manages one-shot sound effects
- Simple audio playback with volume control
- SFX files stored in `public/audio/sfx/`
- Integrated in Game.tsx, Header.tsx, StartScreen.tsx, and CaptureMinigame.tsx

**Planned SFX:**
- Attack hits (normal, critical, super effective, not effective)
- Evolution sounds
- Turn transition effects
- Healing and level-up sounds

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
├── constants/        # Game data (types, terrain, pokemon, version)
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

### Capture Strategy

Capture probability formula encourages:
- **Risk vs Reward**: Attack to weaken (but take damage) for higher capture chance
- **Skill reward**: Perfect ring timing gives significant bonus (+30% max)
- **Never guaranteed**: Even 95% can fail, adding tension
- **Never impossible**: Even tough Pokémon have 5% minimum chance

---

## Multiplayer System

### Overview

Online multiplayer uses a **server-authoritative** model where all game logic runs on the server. Each player only sees their own fog of war, and the server validates all actions to prevent cheating.

### Connection Flow

1. **Connect** to WebSocket server
2. **Create Room** → receive room code (e.g., "ABC123")
3. **Share Code** with opponent
4. **Join Room** → enter room code
5. **Start Game** → host initiates when both connected
6. **Server** generates game state and sends filtered views to each player

### Room System

- **6-character room codes** (e.g., "ABC123")
- Host creates room and waits
- Guest joins with room code
- Only host can start the game
- Room auto-deletes after 1 hour of inactivity

### Server-Authoritative Model

The server handles all game logic:

| Feature | Server Responsibility |
|---------|----------------------|
| **Game State** | Server stores full state, clients receive filtered views |
| **Fog of War** | Each player sees only their own visibility (3-tile range) |
| **Turn Validation** | Server validates it's the player's turn before accepting actions |
| **Action Execution** | Move, attack, wait, capture all run on server |
| **State Updates** | After each action, server broadcasts filtered state to both players |

### True Multiplayer (v0.14.0)

Each player experience:
- **Own perspective**: P1 always sees themselves as "blue team"
- **Own fog of war**: Independent visibility calculation
- **No turn screen**: Game flows naturally without blocking transition
- **Real-time sync**: Actions immediately visible to opponent

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

## Versioning

This project uses **Semantic Versioning** (semver) with **Conventional Commits**.

### Version Format: `MAJOR.MINOR.PATCH`

| Bump | When | Commit Type |
|------|------|-------------|
| **PATCH** | Bug fixes, minor improvements | `fix:` |
| **MINOR** | New features | `feat:` |
| **MAJOR** | Breaking changes | `feat!:` or `BREAKING CHANGE:` |

### Alpha Phase (v0.x.x)

Currently in alpha - major version stays at 0 until core features complete.

### Version Source
- Version defined in `src/constants/version.ts`
- Displayed in Start Screen and Victory Screen

---

## Version History (Alpha)

| Version | Changes |
|---------|---------|
| **0.27.3** | Audio fixes: prevent multiple audio instances, improve playback stability, lower board_theme volume (50%→30%), lower battle_theme (60%→50%) |
| **0.27.2** | Capture minigame SFX: wild encounter, ring hits (perfect/good/miss), pokeball throw/shake/open, capture fail, flee success |
| **0.27.1** | Sound effects system: unit select/deselect/move, menu open/close, button clicks with useSFX hook |
| **0.27.0** | Music system: menu theme (start screen), board theme (gameplay), battle theme (combat) with automatic transitions |
| **0.20.0** | Ultra-premium capture: cinematic attack (slide-in/out), juicy ring with orbiting particles, GBA-style 3D buttons |
| **0.19.0** | GBA-style capture: mini battle with attack/capture/flee, HP weakening, probability-based formula, ring timing |
| **0.18.0** | Premium screens: GBA boot sequence, letter-by-letter title, team showcase, confetti victory, version badges |
| **0.17.0** | Micro-combat capture: type-specific attack patterns, swipe controls, combo system, flee mechanic |
| **0.16.1** | Challenging capture: will bar, multiple attempts, Pokemon movement, escalating difficulty |
| **0.16.0** | Premium capture system: dramatic encounter intro, ring-based minigame, Pokeball physics |
| **0.15.0** | Premium GBA-style battle cinematic: VS intro, segmented HP bars, stat panels, particles, typewriter text |
| **0.14.0** | True multiplayer: each player is P1/P2, own fog of war, no turn transition screen, server-authoritative |
| **0.13.1** | Refined main menu: layered backgrounds, ambient particles, signature Pokemon glows, premium buttons |
| **0.13.0** | Premium GBA-style main menu: diagonal split design, rotating Pokemon, tactical aesthetic |
| **0.12.1** | Fix: turn transition fully blocks game view, smooth dropdown menu animation |
| **0.12.0** | Header dropdown menu: end turn + actions in compact GBA-style menu |
| **0.11.0** | GBA-style turn controls: always-visible end turn button, progress bar, fully opaque transition |
| **0.10.3** | Fire Emblem style turn transition: diagonal slash, shield emblem, GBA-era button panel |
| **0.10.2** | Tutorial uses actual game Tile component - identical graphics, real PathSegment arrows |
| **0.10.1** | Fix: terrain panel UX - click anywhere to close |
| **0.10.0** | Terrain info panel (click empty tile), updated tutorial with action menu graphics |
| **0.9.1** | Distinctive terrain visuals: grass blades, tree canopies, mountain peaks, water waves, healing cross |
| **0.9.0** | Fire Emblem style contextual action menu: appears next to unit with notch pointer |
| **0.8.1** | Fix: click other tiles during ACTION_MENU to change destination |
| **0.8.0** | Fire Emblem style preview: click destination → preview path + attack range → confirm |
| **0.7.0** | Action menu after moving: Atacar/Esperar buttons, fixed path arrows clipping |
| **0.6.0** | Multiplayer perspective: each player sees own fog/turn |
| **0.5.0** | Fire Emblem style pathfinding arrows with gap bridging, smooth curves |
| **0.4.0** | Server-authoritative multiplayer: fog of war per player, validated turns |
| **0.3.0** | Remove action menu, Advance Wars style direct flow, random encounters (30%) |
| **0.2.2** | Professional Nintendo-style tiles, Fire Emblem movement/attack overlays |
| **0.2.1** | Fix auto-wait bug, capture on tall grass, cleaner tile indicators |
| **0.2.0** | Redesigned tiles with rich gradients, mobile stats panel |
| **0.1.0** | SPA layout fix, mobile improvements, visual polish |
| **0.0.1** | Initial alpha: Action Menu, Fog of War, Evolution, Capture, Pokémon Centers, Multiplayer |

---

## Credits

- **Pokémon sprites**: PokeAPI / Nintendo / Game Freak
- **Game concept**: Inspired by Advance Wars, Fire Emblem
- **Development**: Built with Claude AI assistance

---

*This document describes PokéTactics as of v0.20.0 (Alpha). Features marked as "planned" or in the roadmap are not yet implemented.*
