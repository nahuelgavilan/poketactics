# PokéTactics - Audio Prompts

## Estilo General
- Orquestal moderno con toques épicos
- Inspiración: Pokemon Sword/Shield, Fire Emblem Three Houses
- Profesional, cinematográfico, emotivo

---

## MÚSICA (Suno.ai)

### 1. Menu Theme - `menu_theme.mp3`
**Duración:** 1:30 loop

```
Orchestral adventure theme, heroic and hopeful.
Strings, brass, soft piano melody. 120 BPM.
Video game main menu style. Loopable.
```

**Tags:** `orchestral, adventure, heroic, video game, rpg, instrumental`

---

### 2. Battle Theme - `battle_theme.mp3`
**Duración:** 1:30 loop

```
Intense orchestral battle music, strategic combat feel.
Driving strings, percussion, brass hits. 140 BPM.
Tactical RPG style. Loopable.
```

**Tags:** `battle, orchestral, intense, tactical, video game, action`

---

### 3. Victory - `victory.mp3`
**Duración:** 12 segundos

```
Short victory fanfare, triumphant brass and strings.
Celebratory, heroic resolution. 12 seconds only.
```

**Tags:** `victory, fanfare, short, triumphant, orchestral`

---

### 4. Defeat - `defeat.mp3`
**Duración:** 10 segundos

```
Short melancholic theme, sad strings descending.
Game over feeling, reflective. 10 seconds only.
```

**Tags:** `defeat, sad, short, melancholic, strings`

---

### 5. VS Theme - `vs_theme.mp3`
**Duración:** 4 segundos

```
Epic confrontation sting, dramatic orchestral hit.
Two rivals facing off moment. 4 seconds only.
```

**Tags:** `vs, epic, dramatic, short, confrontation, orchestral`

---

### 6. Evolution - `evolution.mp3`
**Duración:** 5 segundos

```
Magical transformation jingle, shimmering and powerful.
Rising intensity, triumphant reveal. 5 seconds only.
```

**Tags:** `evolution, magic, transformation, short, epic`

---

### 7. Capture Success - `capture_success.mp3`
**Duración:** 3 segundos

```
Quick celebration jingle, bright and rewarding.
"Got it!" feeling. 3 seconds only.
```

**Tags:** `capture, success, jingle, short, happy`

---

## EFECTOS DE SONIDO (ElevenLabs)

Usa este prefijo para todos:
```
Video game sound effect, clean, professional quality.
```

---

### Battle Transition

**8. board_zoom.mp3** (0.5s)
```
Dramatic zoom whoosh, camera rushing forward
```

**9. vs_slam.mp3** (0.4s)
```
Heavy impact slam, metal hitting surface
```

**10. tile_slide.mp3** (0.3s)
```
UI element sliding into place, smooth whoosh
```

**11. spiral_wipe.mp3** (0.7s)
```
Swirling transition sound, accelerating whoosh to center
```

**12. battle_flash.mp3** (0.2s)
```
Bright flash sound, quick magical burst
```

---

### Combat

**13. attack_hit.mp3** (0.3s)
```
Punch impact, satisfying hit sound
```

**14. critical_hit.mp3** (0.4s)
```
Powerful impact with extra punch, dramatic hit
```

**15. super_effective.mp3** (0.4s)
```
Enhanced hit with sparkle, extra damage feeling
```

**16. not_effective.mp3** (0.3s)
```
Soft muffled hit, blocked or resisted
```

**17. unit_faint.mp3** (0.6s)
```
Defeated sound, descending tone with thud
```

**18. counter_alert.mp3** (0.3s)
```
Warning alert, quick attention sound
```

---

### Capture Minigame

**19. wild_encounter.mp3** (0.5s)
```
Surprise encounter alert, attention grabbing
```

**20. ring_hit_perfect.mp3** (0.2s)
```
Perfect timing chime, rewarding bright sound
```

**21. ring_hit_good.mp3** (0.2s)
```
Good timing click, confirmation sound
```

**22. ring_miss.mp3** (0.2s)
```
Miss sound, soft error buzz
```

**23. pokeball_throw.mp3** (0.3s)
```
Throwing whoosh, object flying through air
```

**24. pokeball_shake.mp3** (0.3s)
```
Wobble rattle, tense anticipation shake
```

**25. pokeball_open.mp3** (0.3s)
```
Energy release pop, magical burst open
```

**26. capture_fail.mp3** (0.4s)
```
Escape sound, break free pop with disappointment
```

**27. flee_success.mp3** (0.4s)
```
Running away whoosh, quick retreat
```

---

### Evolution

**28. evolution_start.mp3** (0.4s)
```
Magical energy building, transformation beginning
```

**29. evolution_glow.mp3** (1.5s loop)
```
Sustained magical shimmer, glowing energy hum
```

**30. evolution_complete.mp3** (0.5s)
```
Reveal burst, triumphant transformation finish
```

---

### UI

**31. unit_select.mp3** (0.2s)
```
Soft click with chime, selection confirm
```

**32. unit_move.mp3** (0.4s)
```
Quick footstep whoosh, movement sound
```

**33. button_click.mp3** (0.15s)
```
Soft button press click
```

**34. menu_open.mp3** (0.2s)
```
Panel appearing sound, ascending blip
```

**35. menu_close.mp3** (0.2s)
```
Panel closing sound, descending blip
```

**36. error.mp3** (0.2s)
```
Invalid action buzz, soft error
```

---

### Gameplay

**37. turn_end.mp3** (0.4s)
```
Phase transition whoosh
```

**38. turn_start.mp3** (0.3s)
```
Your turn notification chime
```

**39. heal.mp3** (0.6s)
```
Healing sparkle sound, warm restoration
```

**40. level_up.mp3** (0.5s)
```
Stat increase jingle, rising bright sound
```

---

## Carpetas

```
public/audio/
├── music/
│   ├── menu_theme.mp3
│   ├── battle_theme.mp3
│   ├── victory.mp3
│   ├── defeat.mp3
│   ├── vs_theme.mp3
│   ├── evolution.mp3
│   └── capture_success.mp3
└── sfx/
    ├── board_zoom.mp3
    ├── vs_slam.mp3
    ├── tile_slide.mp3
    ├── spiral_wipe.mp3
    ├── battle_flash.mp3
    ├── attack_hit.mp3
    ├── critical_hit.mp3
    ├── super_effective.mp3
    ├── not_effective.mp3
    ├── unit_faint.mp3
    ├── counter_alert.mp3
    ├── wild_encounter.mp3
    ├── ring_hit_perfect.mp3
    ├── ring_hit_good.mp3
    ├── ring_miss.mp3
    ├── pokeball_throw.mp3
    ├── pokeball_shake.mp3
    ├── pokeball_open.mp3
    ├── capture_fail.mp3
    ├── flee_success.mp3
    ├── evolution_start.mp3
    ├── evolution_glow.mp3
    ├── evolution_complete.mp3
    ├── unit_select.mp3
    ├── unit_move.mp3
    ├── button_click.mp3
    ├── menu_open.mp3
    ├── menu_close.mp3
    ├── error.mp3
    ├── turn_end.mp3
    ├── turn_start.mp3
    ├── heal.mp3
    └── level_up.mp3
```

---

## Alternativas para SFX

Si ElevenLabs no funciona bien:
- **sfxr.me** - Generador gratuito de SFX retro
- **freesound.org** - Buscar "game sfx"
- **zapsplat.com** - Librería gratuita con cuenta
