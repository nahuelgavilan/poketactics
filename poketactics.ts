import React, { useState, useEffect, useRef } from 'react';
import { Sword, Shield, Zap, Skull, Flame, Droplets, Mountain, Trees, RefreshCw, HandMetal, PlayCircle, Sparkles, Sprout } from 'lucide-react';

/**
 * --- CONFIGURACIÓN & DATOS ---
 */

const BOARD_W = 6;
const BOARD_H = 8;

const TYPES = {
  NORMAL: 'normal', FIRE: 'fire', WATER: 'water', GRASS: 'grass',
  ELECTRIC: 'electric', ICE: 'ice', FIGHTING: 'fighting', POISON: 'poison',
  GROUND: 'ground', FLYING: 'flying', PSYCHIC: 'psychic', BUG: 'bug',
  ROCK: 'rock', GHOST: 'ghost', DRAGON: 'dragon', STEEL: 'steel', FAIRY: 'fairy'
};

const TYPE_COLORS = {
  normal: 'bg-stone-400', fire: 'bg-orange-500', water: 'bg-blue-500', grass: 'bg-green-500',
  electric: 'bg-yellow-400', ice: 'bg-cyan-300', fighting: 'bg-red-700', poison: 'bg-purple-500',
  ground: 'bg-amber-600', flying: 'bg-indigo-300', psychic: 'bg-pink-500', bug: 'bg-lime-500',
  rock: 'bg-stone-600', ghost: 'bg-purple-800', dragon: 'bg-indigo-600', steel: 'bg-slate-400', fairy: 'bg-pink-300'
};

// Matriz de efectividad simplificada
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, steel: 0.5 }
};

const getEffectiveness = (moveType, defenderType) => {
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  return chart[defenderType] !== undefined ? chart[defenderType] : 1;
};

// Pool de Pokémon
const POKEMON_POOL = [
  { id: 6, name: 'Charizard', types: [TYPES.FIRE, TYPES.FLYING], hp: 100, atk: 35, def: 10, mov: 4, rng: 1, moveName: 'Flamethrower', moveType: TYPES.FIRE },
  { id: 9, name: 'Blastoise', types: [TYPES.WATER], hp: 120, atk: 28, def: 20, mov: 3, rng: 2, moveName: 'Hydro Pump', moveType: TYPES.WATER },
  { id: 3, name: 'Venusaur', types: [TYPES.GRASS, TYPES.POISON], hp: 130, atk: 25, def: 15, mov: 3, rng: 1, moveName: 'Solar Beam', moveType: TYPES.GRASS },
  { id: 25, name: 'Pikachu', types: [TYPES.ELECTRIC], hp: 60, atk: 40, def: 5, mov: 5, rng: 2, moveName: 'Thunderbolt', moveType: TYPES.ELECTRIC },
  { id: 68, name: 'Machamp', types: [TYPES.FIGHTING], hp: 110, atk: 45, def: 15, mov: 3, rng: 1, moveName: 'Dynamic Punch', moveType: TYPES.FIGHTING },
  { id: 94, name: 'Gengar', types: [TYPES.GHOST, TYPES.POISON], hp: 70, atk: 45, def: 5, mov: 5, rng: 1, moveName: 'Shadow Ball', moveType: TYPES.GHOST },
  { id: 149, name: 'Dragonite', types: [TYPES.DRAGON, TYPES.FLYING], hp: 120, atk: 40, def: 15, mov: 5, rng: 1, moveName: 'Dragon Claw', moveType: TYPES.DRAGON },
  { id: 130, name: 'Gyarados', types: [TYPES.WATER, TYPES.FLYING], hp: 110, atk: 38, def: 12, mov: 4, rng: 1, moveName: 'Aqua Tail', moveType: TYPES.WATER },
  { id: 76, name: 'Golem', types: [TYPES.ROCK, TYPES.GROUND], hp: 100, atk: 30, def: 35, mov: 2, rng: 1, moveName: 'Rock Slide', moveType: TYPES.ROCK },
  { id: 65, name: 'Alakazam', types: [TYPES.PSYCHIC], hp: 60, atk: 50, def: 5, mov: 4, rng: 2, moveName: 'Psychic', moveType: TYPES.PSYCHIC },
  { id: 143, name: 'Snorlax', types: [TYPES.NORMAL], hp: 160, atk: 30, def: 10, mov: 2, rng: 1, moveName: 'Body Slam', moveType: TYPES.NORMAL },
  { id: 212, name: 'Scizor', types: [TYPES.BUG, TYPES.STEEL], hp: 90, atk: 42, def: 25, mov: 4, rng: 1, moveName: 'Bullet Punch', moveType: TYPES.STEEL },
  { id: 248, name: 'Tyranitar', types: [TYPES.ROCK, TYPES.DARK], hp: 130, atk: 40, def: 20, mov: 3, rng: 1, moveName: 'Stone Edge', moveType: TYPES.ROCK },
  { id: 376, name: 'Metagross', types: [TYPES.STEEL, TYPES.PSYCHIC], hp: 110, atk: 38, def: 30, mov: 3, rng: 1, moveName: 'Meteor Mash', moveType: TYPES.STEEL },
  { id: 448, name: 'Lucario', types: [TYPES.FIGHTING, TYPES.STEEL], hp: 80, atk: 38, def: 10, mov: 5, rng: 1, moveName: 'Aura Sphere', moveType: TYPES.FIGHTING },
  { id: 475, name: 'Gallade', types: [TYPES.PSYCHIC, TYPES.FIGHTING], hp: 80, atk: 40, def: 10, mov: 4, rng: 1, moveName: 'Psycho Cut', moveType: TYPES.PSYCHIC },
  { id: 392, name: 'Infernape', types: [TYPES.FIRE, TYPES.FIGHTING], hp: 75, atk: 38, def: 8, mov: 5, rng: 1, moveName: 'Flare Blitz', moveType: TYPES.FIRE },
  { id: 330, name: 'Flygon', types: [TYPES.GROUND, TYPES.DRAGON], hp: 90, atk: 35, def: 12, mov: 4, rng: 2, moveName: 'Earth Power', moveType: TYPES.GROUND },
];

const TERRAIN = { GRASS: 0, FOREST: 1, WATER: 2, MOUNTAIN: 3, BASE: 4, TALL_GRASS: 5 };

const TERRAIN_PROPS = {
  [TERRAIN.GRASS]: { def: 0, moveCost: 1, name: 'Llanura', bg: 'from-green-800 to-green-950' },
  [TERRAIN.FOREST]: { def: 20, moveCost: 2, name: 'Bosque', bg: 'from-emerald-900 to-black' },
  [TERRAIN.WATER]: { def: 0, moveCost: 99, name: 'Agua', bg: 'from-blue-900 to-slate-900' },
  [TERRAIN.MOUNTAIN]: { def: 40, moveCost: 99, name: 'Montaña', bg: 'from-stone-800 to-black' },
  [TERRAIN.BASE]: { def: 10, moveCost: 1, name: 'Base', bg: 'from-gray-800 to-gray-950' },
  [TERRAIN.TALL_GRASS]: { def: 5, moveCost: 1, name: 'Hierba Alta', bg: 'from-teal-900 to-black', capture: true }
};

/**
 * --- COMPONENTE DE BATALLA (CINEMÁTICA) ---
 */
const BattleCinematic = ({ attacker, defender, damage, effectiveness, terrainType, onComplete }) => {
  const [phase, setPhase] = useState('intro'); // intro -> charge -> lunge -> impact -> result
  
  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setPhase('charge'), 1000));
    timers.push(setTimeout(() => setPhase('lunge'), 2000));
    timers.push(setTimeout(() => setPhase('impact'), 2400));
    timers.push(setTimeout(() => setPhase('result'), 3200));
    timers.push(setTimeout(onComplete, 5500));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const atkSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/back/${attacker.template.id}.gif`;
  const defSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${defender.template.id}.gif`;

  const maxHpAtk = attacker.template.hp;
  const curHpAtk = attacker.currentHp;
  const maxHpDef = defender.template.hp;
  const curHpDef = defender.currentHp;
  const finalHpDef = Math.max(0, curHpDef - damage);

  const defPercent = (phase === 'result' || phase === 'impact') ? (finalHpDef / maxHpDef) * 100 : (curHpDef / maxHpDef) * 100;
  
  let impactColor = "bg-white";
  if (attacker.template.moveType === TYPES.FIRE) impactColor = "bg-orange-500 mix-blend-overlay";
  if (attacker.template.moveType === TYPES.WATER) impactColor = "bg-blue-500 mix-blend-overlay";
  if (attacker.template.moveType === TYPES.ELECTRIC) impactColor = "bg-yellow-400 mix-blend-overlay";
  if (attacker.template.moveType === TYPES.GRASS) impactColor = "bg-green-500 mix-blend-overlay";

  let effText = "";
  if (effectiveness >= 2) effText = "¡ES SUPER EFICAZ!";
  else if (effectiveness <= 0.5 && effectiveness > 0) effText = "No es muy eficaz...";
  else if (effectiveness === 0) effText = "¡No afecta!";

  const bgGradient = TERRAIN_PROPS[terrainType]?.bg || 'from-slate-800 to-black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className={`relative w-full max-w-4xl h-[60vh] md:h-[500px] overflow-hidden rounded-xl border-4 border-slate-700 bg-gradient-to-b ${bgGradient} shadow-2xl`}>
        
        <div className={`absolute inset-0 z-20 transition-opacity duration-100 ${phase === 'impact' ? `opacity-60 ${impactColor}` : 'opacity-0'}`}></div>
        
        <div className={`w-full h-full relative ${phase === 'impact' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            
            <div className="absolute bottom-0 w-full h-1/2 opacity-20" style={{ 
                background: 'linear-gradient(transparent 5%, #000 5%), linear-gradient(90deg, transparent 5%, #000 5%)', 
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg)'
            }}></div>

            {/* UI DEFENSOR */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
                <div className="bg-gray-900/80 backdrop-blur border-l-4 border-red-500 p-3 rounded-br-2xl shadow-lg w-64 transform skew-x-[-10deg]">
                    <div className="skew-x-[10deg]">
                        <div className="flex justify-between text-white font-bold uppercase text-sm mb-1">
                            <span>{defender.template.name}</span>
                            <span className="text-red-400">P{defender.owner === 'P1' ? '1' : '2'}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                            <div className="h-full bg-green-500 transition-all duration-700 ease-out" style={{ width: `${defPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UI ATACANTE */}
            <div className="absolute bottom-24 right-6 z-10">
                 <div className="bg-gray-900/80 backdrop-blur border-r-4 border-blue-500 p-3 rounded-tl-2xl shadow-lg w-64 transform skew-x-[-10deg]">
                    <div className="skew-x-[10deg]">
                        <div className="flex justify-between text-white font-bold uppercase text-sm mb-1">
                            <span>{attacker.template.name}</span>
                            <span className="text-blue-400">P{attacker.owner === 'P1' ? '1' : '2'}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                            <div className="h-full bg-green-500" style={{ width: `${(curHpAtk / maxHpAtk) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SPRITES */}
            <div className={`absolute top-16 right-16 md:right-32 transition-all duration-200 
                ${phase === 'impact' ? 'brightness-200 opacity-80 translate-x-2' : ''}
                ${phase === 'result' && finalHpDef === 0 ? 'translate-y-10 opacity-0 grayscale duration-1000' : ''}
            `}>
                <img src={defSprite} className="w-32 h-32 md:w-48 md:h-48 object-contain rendering-pixelated scale-150" alt="Defensor" />
                {phase === 'result' && (
                    <div className="absolute -top-10 left-0 w-full text-center">
                         <span className="text-5xl font-black text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce block">-{damage}</span>
                    </div>
                )}
            </div>

            <div className={`absolute bottom-8 left-16 md:left-32 transition-all duration-300
                ${phase === 'charge' ? 'brightness-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}
                ${phase === 'lunge' ? 'translate-x-32 -translate-y-10 scale-110' : ''}
                ${phase === 'impact' ? 'translate-x-20' : ''}
                ${phase === 'result' ? 'translate-x-0 translate-y-0' : ''}
            `}>
                <img src={atkSprite} className="w-40 h-40 md:w-56 md:h-56 object-contain rendering-pixelated scale-150" alt="Atacante" />
                {phase === 'charge' && <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping"></div>}
            </div>
        </div>

        <div className="absolute bottom-0 w-full h-24 bg-slate-900 border-t-4 border-slate-600 p-4 flex items-center justify-center z-30">
            <p className="text-white font-mono text-lg md:text-xl text-center leading-tight">
                {phase === 'intro' && `¡${attacker.template.name} ataca!`}
                {(phase === 'charge' || phase === 'lunge') && <span className="text-yellow-300">¡{attacker.template.name} usó {attacker.template.moveName}!</span>}
                {phase === 'impact' && "..."}
                {phase === 'result' && (effText || (damage > 0 ? "¡Golpe directo!" : "¡Falló!"))}
            </p>
        </div>
      </div>
    </div>
  );
};

/**
 * --- MODAL DE CAPTURA ---
 */
const CaptureModal = ({ pokemon, player, onComplete }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
            <div className="bg-slate-800 border-4 border-yellow-500 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`} 
                            className="w-32 h-32 object-contain rendering-pixelated relative z-10"
                        />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white mb-2">¡POKÉMON CAPTURADO!</h2>
                <p className="text-slate-300 mb-6">
                    Un <span className="text-yellow-400 font-bold">{pokemon.name}</span> salvaje se ha unido al equipo <span className={player === 'P1' ? 'text-blue-400' : 'text-red-500'}>{player === 'P1' ? 'AZUL' : 'ROJO'}</span>.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-6 bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex justify-between"><span>ATK</span> <span className="text-white">{pokemon.atk}</span></div>
                    <div className="flex justify-between"><span>DEF</span> <span className="text-white">{pokemon.def}</span></div>
                    <div className="flex justify-between"><span>MOV</span> <span className="text-white">{pokemon.mov}</span></div>
                    <div className="flex justify-between"><span>HP</span> <span className="text-white">{pokemon.hp}</span></div>
                </div>
                <button 
                    onClick={onComplete}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-transform hover:scale-105"
                >
                    ¡A Luchar!
                </button>
            </div>
        </div>
    );
};

/**
 * --- MOTOR PRINCIPAL ---
 */
export default function PokeWarCapture() {
  const [map, setMap] = useState([]);
  const [units, setUnits] = useState([]);
  const [turn, setTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState('P1');
  const [gameState, setGameState] = useState('setup'); // setup, transition, playing, battle, victory, capture
  
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [moveRange, setMoveRange] = useState([]);
  const [attackRange, setAttackRange] = useState([]);
  
  const [battleData, setBattleData] = useState(null);
  const [captureData, setCaptureData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    // 1. Mapa con Hierba Alta
    const newMap = Array(BOARD_H).fill(0).map(() => Array(BOARD_W).fill(TERRAIN.GRASS));
    for(let y=0; y<BOARD_H; y++) {
      for(let x=0; x<BOARD_W; x++) {
        const r = Math.random();
        if (r > 0.88) newMap[y][x] = TERRAIN.MOUNTAIN;
        else if (r > 0.80) newMap[y][x] = TERRAIN.WATER;
        else if (r > 0.65) newMap[y][x] = TERRAIN.FOREST;
        else if (r > 0.45) newMap[y][x] = TERRAIN.TALL_GRASS; // 20% Mapa es hierba alta
      }
    }
    newMap[0][0] = TERRAIN.BASE; newMap[0][1] = TERRAIN.GRASS; newMap[1][0] = TERRAIN.GRASS;
    newMap[BOARD_H-1][BOARD_W-1] = TERRAIN.BASE; newMap[BOARD_H-1][BOARD_W-2] = TERRAIN.GRASS; newMap[BOARD_H-2][BOARD_W-1] = TERRAIN.GRASS;
    setMap(newMap);

    // 2. Equipos
    const createTeam = (owner, startY) => {
      const team = [];
      const usedIds = new Set();
      for(let i=0; i<3; i++) { // Empezamos con 3 para dejar espacio a capturas
        let temp;
        do {
           temp = POKEMON_POOL[Math.floor(Math.random() * POKEMON_POOL.length)];
        } while(usedIds.has(temp.id));
        usedIds.add(temp.id);
        
        team.push({
          uid: Math.random().toString(36).substring(7),
          owner,
          template: temp,
          x: i % BOARD_W,
          y: startY + (Math.floor(i / BOARD_W) * (owner === 'P2' ? 1 : -1)),
          currentHp: temp.hp,
          hasMoved: false
        });
      }
      return team;
    };

    const p1 = createTeam('P1', BOARD_H - 1);
    const p2 = createTeam('P2', 0);
    
    p1.forEach((u, i) => { u.y = BOARD_H - 1 - Math.floor(i/BOARD_W); u.x = i % BOARD_W });
    p2.forEach((u, i) => { u.y = 0 + Math.floor(i/BOARD_W); u.x = BOARD_W - 1 - (i % BOARD_W) });

    setUnits([...p1, ...p2]);
    setTurn(1);
    setCurrentPlayer('P1');
    setGameState('playing');
    setLogs(["¡Empieza el combate!", "¡Usa la Hierba Alta para capturar!"]);
    setWinner(null);
  };

  const getDistance = (u1, u2) => Math.abs(u1.x - u2.x) + Math.abs(u1.y - u2.y);

  const calculateMoveRange = (unit) => {
    if (unit.hasMoved) return [];
    let costs = {};
    let queue = [{x: unit.x, y: unit.y, cost: 0}];
    costs[`${unit.x},${unit.y}`] = 0;
    let validMoves = [];

    while(queue.length > 0) {
      queue.sort((a,b) => a.cost - b.cost);
      let curr = queue.shift();

      if (curr.cost < unit.template.mov) {
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
            let nx = curr.x + dx, ny = curr.y + dy;
            if (nx >= 0 && nx < BOARD_W && ny >= 0 && ny < BOARD_H) {
                const t = map[ny][nx];
                const props = TERRAIN_PROPS[t];
                const isFlying = unit.template.types.includes(TYPES.FLYING);
                const cost = isFlying ? 1 : props.moveCost;
                
                if (cost > 10) return; 

                const occ = units.find(u => u.x === nx && u.y === ny);
                if (occ && occ.owner !== unit.owner) return; 

                const newCost = curr.cost + cost;
                if (newCost <= unit.template.mov) {
                    const key = `${nx},${ny}`;
                    if (costs[key] === undefined || newCost < costs[key]) {
                        costs[key] = newCost;
                        queue.push({x: nx, y: ny, cost: newCost});
                        if (!occ || occ.uid === unit.uid) validMoves.push({x: nx, y: ny});
                    }
                }
            }
        });
      }
    }
    return validMoves;
  };

  const calculateAttackRange = (unit, currentUnits = units) => {
    return currentUnits
      .filter(u => u.owner !== unit.owner)
      .filter(u => getDistance(unit, u) <= unit.template.rng)
      .map(u => ({ x: u.x, y: u.y, uid: u.uid }));
  };

  const handleTileClick = (x, y) => {
    if (gameState !== 'playing') return;

    const clickedUnit = units.find(u => u.x === x && u.y === y);

    // 1. SELECCIONAR
    if (clickedUnit && clickedUnit.owner === currentPlayer && !clickedUnit.hasMoved) {
      setSelectedUnit(clickedUnit);
      setMoveRange(calculateMoveRange(clickedUnit));
      setAttackRange(calculateAttackRange(clickedUnit)); 
      return;
    }

    // 2. MOVER
    if (selectedUnit && moveRange.some(m => m.x === x && m.y === y)) {
      const movedUnit = { ...selectedUnit, x, y };
      // Actualizamos unidades antes de chequear captura para que la posición sea correcta
      const nextUnits = units.map(u => u.uid === selectedUnit.uid ? movedUnit : u);
      setUnits(nextUnits);
      setSelectedUnit(movedUnit);
      setMoveRange([]);
      
      // CHEQUEO DE CAPTURA EN HIERBA ALTA
      if (map[y][x] === TERRAIN.TALL_GRASS) {
          // 30% Chance
          if (Math.random() < 0.3) {
              triggerCapture(movedUnit, nextUnits);
              return; // Detenemos flujo normal hasta resolver captura
          }
      }

      // Flujo normal si no hay captura
      const newAttacks = calculateAttackRange(movedUnit, nextUnits);
      setAttackRange(newAttacks);
      
      if (newAttacks.length === 0) waitUnit(movedUnit.uid, nextUnits);
      return;
    }

    // 3. ATACAR
    if (selectedUnit && attackRange.some(a => a.x === x && a.y === y)) {
      const target = units.find(u => u.x === x && u.y === y);
      if (target) startBattle(selectedUnit, target);
    }
  };

  // --- LÓGICA DE CAPTURA ---
  const triggerCapture = (capturer, currentUnits) => {
      // Elegir pokemon random
      const wildMon = POKEMON_POOL[Math.floor(Math.random() * POKEMON_POOL.length)];
      
      // Buscar espacio libre adyacente
      const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]; // 8 direcciones
      let spawnX = -1, spawnY = -1;

      for (let d of dirs) {
          let nx = capturer.x + d[0];
          let ny = capturer.y + d[1];
          if (nx>=0 && nx<BOARD_W && ny>=0 && ny<BOARD_H) {
              // Terreno transitable y sin unidades
              if (map[ny][nx] !== TERRAIN.WATER && map[ny][nx] !== TERRAIN.MOUNTAIN) {
                  if (!currentUnits.some(u => u.x === nx && u.y === ny)) {
                      spawnX = nx; spawnY = ny;
                      break;
                  }
              }
          }
      }

      if (spawnX !== -1) {
          // Success
          setGameState('capture');
          setCaptureData({ 
              pokemon: wildMon, 
              player: capturer.owner,
              spawnPos: {x: spawnX, y: spawnY}
          });
      } else {
          // No space, sad trombone
          setLogs(l => ["¡Hierba alta se movió, pero no hay espacio!", ...l]);
          waitUnit(capturer.uid, currentUnits);
      }
  };

  const confirmCapture = () => {
      if (!captureData) return;
      const { pokemon, player, spawnPos } = captureData;
      
      const newUnit = {
          uid: Math.random().toString(36).substring(7),
          owner: player,
          template: pokemon,
          x: spawnPos.x,
          y: spawnPos.y,
          currentHp: pokemon.hp,
          hasMoved: true // Entra cansado
      };

      const nextUnits = [...units, newUnit];
      setUnits(nextUnits);
      setLogs(l => [`¡${player === 'P1' ? 'Azul' : 'Rojo'} capturó un ${pokemon.name}!`, ...l]);
      
      setCaptureData(null);
      setGameState('playing');
      
      // El capturador termina su turno automáticamente tras la emoción
      // selectedUnit sigue apuntando al capturador en el closure actual, lo buscamos en el nuevo array
      // En realidad, units ya tiene al capturador movido desde handleTileClick
      // Simplemente terminamos su turno
      waitUnit(selectedUnit.uid, nextUnits); 
  };


  const waitUnit = (uid, currentUnits) => {
    const nextUnits = currentUnits.map(u => u.uid === uid ? { ...u, hasMoved: true } : u);
    setUnits(nextUnits);
    setSelectedUnit(null);
    setMoveRange([]);
    setAttackRange([]);
    
    if (!nextUnits.some(u => u.owner === currentPlayer && !u.hasMoved)) {
        setTimeout(() => triggerTurnTransition(), 1000);
    }
  };

  const triggerTurnTransition = () => {
      setGameState('transition');
  };

  const confirmTurnChange = () => {
      const nextPlayer = currentPlayer === 'P1' ? 'P2' : 'P1';
      setUnits(units.map(u => ({ ...u, hasMoved: false }))); 
      setCurrentPlayer(nextPlayer);
      if (nextPlayer === 'P1') setTurn(t => t + 1);
      setLogs(l => [`Turno ${nextPlayer === 'P1' ? turn + 1 : turn}: Jugador ${nextPlayer === 'P1' ? '1' : '2'}`, ...l]);
      setGameState('playing');
  };

  const startBattle = (attacker, defender) => {
    setGameState('battle');
    const eff = getEffectiveness(attacker.template.moveType, defender.template.types[0]);
    const terrainDef = TERRAIN_PROPS[map[defender.y][defender.x]].def;
    const rawDmg = (attacker.template.atk * eff) - (defender.template.def * (1 + terrainDef/100));
    const damage = Math.max(1, Math.floor(rawDmg * (0.9 + Math.random() * 0.2)));

    setBattleData({ 
        attacker, 
        defender, 
        damage, 
        effectiveness: eff, 
        terrainType: map[defender.y][defender.x] 
    });
  };

  const endBattle = () => {
    const { defender, damage, attacker } = battleData;
    const nextUnits = units.map(u => {
        if (u.uid === defender.uid) return { ...u, currentHp: u.currentHp - damage };
        return u;
    }).filter(u => u.currentHp > 0);
    
    setUnits(nextUnits);
    setBattleData(null);
    setGameState('playing');
    
    if (!nextUnits.some(u => u.owner === 'P1')) { setWinner('P2'); setGameState('victory'); }
    else if (!nextUnits.some(u => u.owner === 'P2')) { setWinner('P1'); setGameState('victory'); }
    else {
        waitUnit(attacker.uid, nextUnits);
    }
  };

  const getTileColor = (t) => {
      if (t === TERRAIN.GRASS) return 'bg-emerald-200 border-emerald-300';
      if (t === TERRAIN.FOREST) return 'bg-emerald-700 border-emerald-800';
      if (t === TERRAIN.WATER) return 'bg-blue-400 border-blue-500';
      if (t === TERRAIN.MOUNTAIN) return 'bg-stone-600 border-stone-700';
      if (t === TERRAIN.TALL_GRASS) return 'bg-teal-700 border-teal-800 shadow-inner'; // Hierba Alta visualmente distinta
      return 'bg-gray-300';
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col items-center select-none overflow-hidden">
      
      {/* HEADER */}
      <header className="w-full bg-slate-800 border-b border-slate-700 p-4 shadow-lg z-40">
         <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                <Sword className="text-red-500" /> 
                POKÉWAR <span className="text-yellow-400">CAPTURE</span>
            </h1>
            
            <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full font-bold text-sm border transition-all duration-300
                    ${currentPlayer === 'P1' ? 'bg-blue-600 border-blue-400 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-700 border-slate-600 text-slate-400 scale-90'}
                `}>P1 AZUL</div>
                <div className="text-slate-500 font-mono text-xs">VS</div>
                <div className={`px-4 py-1.5 rounded-full font-bold text-sm border transition-all duration-300
                    ${currentPlayer === 'P2' ? 'bg-red-600 border-red-400 shadow-[0_0_10px_#ef4444]' : 'bg-slate-700 border-slate-600 text-slate-400 scale-90'}
                `}>P2 ROJO</div>
            </div>

            <button onClick={initGame} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
                <RefreshCw size={16} />
            </button>
         </div>
      </header>

      {/* --- OVERLAYS --- */}
      {gameState === 'transition' && (
          <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
              <HandMetal size={64} className="text-yellow-400 mb-6 animate-pulse" />
              <h2 className="text-4xl font-black text-white mb-2">CAMBIO DE TURNO</h2>
              <p className="text-slate-400 mb-8 max-w-md">
                  Turno del <span className={`font-bold mx-2 ${currentPlayer === 'P1' ? 'text-red-500' : 'text-blue-400'}`}>JUGADOR {currentPlayer === 'P1' ? '2' : '1'}</span>
              </p>
              <button 
                onClick={confirmTurnChange}
                className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-full overflow-hidden hover:scale-105 transition-transform"
              >
                  <span className="relative z-10 flex items-center gap-2"><PlayCircle /> LISTO</span>
              </button>
          </div>
      )}

      {gameState === 'battle' && battleData && <BattleCinematic {...battleData} onComplete={endBattle} />}
      
      {gameState === 'capture' && captureData && <CaptureModal {...captureData} onComplete={confirmCapture} />}

      {gameState === 'victory' && (
           <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300">
               <h1 className={`text-7xl font-black mb-4 ${winner === 'P1' ? 'text-blue-500' : 'text-red-500'}`}>{winner === 'P1' ? 'AZUL' : 'ROJO'} GANA</h1>
               <button onClick={initGame} className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">Jugar Otra Vez</button>
           </div>
      )}

      {/* --- MAIN GAME --- */}
      <main className="flex-1 w-full max-w-6xl p-4 flex flex-col md:flex-row gap-6 items-start justify-center pt-8">
         
         {/* TABLERO */}
         <div className="relative bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-600 mx-auto select-none">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${BOARD_W}, minmax(3.5rem, 5rem))` }}>
                {map.map((row, y) => row.map((t, x) => {
                    const unit = units.find(u => u.x === x && u.y === y);
                    const isSelected = selectedUnit && selectedUnit.x === x && selectedUnit.y === y;
                    const canMove = moveRange.some(m => m.x === x && m.y === y);
                    const canAttack = attackRange.some(a => a.x === x && a.y === y);

                    return (
                        <div 
                           key={`${x}-${y}`}
                           onClick={() => handleTileClick(x, y)}
                           className={`
                             aspect-square rounded-lg border-b-4 relative cursor-pointer transition-all duration-100 overflow-hidden
                             ${getTileColor(t)}
                             ${canMove ? 'ring-4 ring-blue-400/60 z-10 scale-95' : ''}
                             ${canAttack ? 'ring-4 ring-red-500/80 z-10 scale-95 bg-red-900/50' : ''}
                             ${isSelected ? 'ring-2 ring-white z-20' : ''}
                             hover:brightness-110
                           `}
                        >
                             {/* Icons */}
                             {t === TERRAIN.FOREST && <Trees className="absolute inset-0 m-auto text-emerald-900 opacity-40 w-8 h-8 pointer-events-none" />}
                             {t === TERRAIN.MOUNTAIN && <Mountain className="absolute inset-0 m-auto text-stone-800 opacity-40 w-8 h-8 pointer-events-none" />}
                             {t === TERRAIN.WATER && <Droplets className="absolute inset-0 m-auto text-blue-800 opacity-30 w-6 h-6 pointer-events-none" />}
                             {t === TERRAIN.TALL_GRASS && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                    <Sprout size={24} className="text-teal-900 animate-pulse" />
                                </div>
                             )}

                             {/* Unit */}
                             {unit && (
                                 <div className={`absolute inset-0 flex items-center justify-center z-20 ${unit.hasMoved ? 'grayscale opacity-60' : ''}`}>
                                     <img 
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${unit.template.id}.png`}
                                        className={`w-[90%] h-[90%] object-contain rendering-pixelated drop-shadow-md ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''} ${isSelected ? 'animate-bounce' : ''}`}
                                        draggable="false"
                                     />
                                     <div className="absolute top-1 w-8 h-1 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm">
                                         <div className={`h-full ${unit.owner === 'P1' ? 'bg-blue-400' : 'bg-red-500'}`} style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}></div>
                                     </div>
                                     <div className={`absolute -bottom-1 w-4 h-1.5 rounded-full blur-[2px] ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                 </div>
                             )}
                        </div>
                    );
                }))}
            </div>
         </div>

         {/* SIDEBAR INFO */}
         <div className="w-full md:w-80 flex flex-col gap-4">
             {selectedUnit ? (
                 <div className={`p-5 rounded-xl border-l-4 shadow-xl ${selectedUnit.owner === 'P1' ? 'bg-slate-800 border-blue-500' : 'bg-slate-800 border-red-500'}`}>
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <h3 className="text-xl font-bold">{selectedUnit.template.name}</h3>
                             <div className="flex gap-1 mt-1">
                                 {selectedUnit.template.types.map(type => (
                                     <span key={type} className={`text-[10px] px-2 py-0.5 rounded text-white uppercase font-bold shadow-sm ${TYPE_COLORS[type] || 'bg-gray-500'}`}>{type}</span>
                                 ))}
                             </div>
                         </div>
                         <div className="text-right">
                             <span className="text-2xl font-mono font-bold">{selectedUnit.currentHp}</span>
                             <span className="text-xs text-slate-400 block">HP</span>
                         </div>
                     </div>
                     
                     <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                         <div className="flex items-center gap-2 mb-1">
                             <Sword size={16} className="text-orange-400" />
                             <span className="font-bold text-sm">{selectedUnit.template.moveName}</span>
                         </div>
                         <div className="text-xs text-slate-400 flex justify-between">
                             <span>Poder: {selectedUnit.template.atk}</span>
                             <span>Rango: {selectedUnit.template.rng}</span>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                         <div className="flex justify-between bg-slate-700/30 p-2 rounded"><span>MOV</span><span className="text-white font-bold">{selectedUnit.template.mov}</span></div>
                         <div className="flex justify-between bg-slate-700/30 p-2 rounded"><span>DEF</span><span className="text-white font-bold">{selectedUnit.template.def}</span></div>
                     </div>
                 </div>
             ) : (
                 <div className="bg-slate-800/50 rounded-xl border border-dashed border-slate-600 p-8 text-center text-slate-500 flex flex-col items-center">
                     <HandMetal className="mb-2 opacity-50" />
                     <p>Selecciona una unidad<br/>para ver sus estadísticas</p>
                 </div>
             )}

             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <Sprout className="text-teal-400" size={16} />
                    <h4 className="text-xs font-bold text-teal-400 uppercase">Hierba Alta</h4>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                    Mueve una unidad a las casillas de hierba oscura para tener oportunidad de capturar refuerzos.
                </p>
                <div className="h-1 w-full bg-slate-700 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-teal-500 w-1/3"></div>
                </div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Registro de Batalla</h4>
                 <div className="h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                     {logs.map((log, i) => (
                         <div key={i} className="text-xs text-slate-300 border-l-2 border-slate-600 pl-2 py-1">{log}</div>
                     ))}
                 </div>
             </div>

             <button onClick={triggerTurnTransition} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-colors">Pasar Turno</button>
         </div>
      </main>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}
