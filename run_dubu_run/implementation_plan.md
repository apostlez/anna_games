# Jump Cinnamoroll — Side-Scrolling Action Game

A browser-based, single-action (tap/click to jump & fly) side-scrolling game where Cinnamoroll must navigate through sky, clouds, and terrain to return to the café after being blown away by a hurricane.

## User Review Required

> [!IMPORTANT]
> **Art Style**: Since Cinnamoroll is a Sanrio IP character, I'll create a **cute, pastel-themed** pixel/vector art style inspired by the character without using actual copyrighted assets. Characters and elements will be drawn programmatically on HTML5 Canvas. Please confirm this approach is acceptable.

> [!IMPORTANT]
> **Game Scope**: The plan below targets a polished MVP with core gameplay loop, 3 terrain zones, 5 obstacle types, scoring, and a start/game-over screen. Additional features (power-ups, level progression, café ending scene) can be added iteratively.

## Open Questions

1. **Character design**: Should Cinnamoroll be a simple cute sprite (drawn via canvas shapes/paths), or would you prefer to provide image assets?
2. **Difficulty progression**: Should the game get progressively harder (faster scroll speed, more obstacles) or stay constant?
3. **Sound effects / music**: Should I include audio (using Web Audio API), or is this visual-only for now?
4. **Scoring**: Distance-based score, or collectible items (e.g., stars/cookies) as well?

---

## Proposed Changes

All files will be created in a new folder: `anna_games/jump_cinnamoroll/`

### Project Structure

```
anna_games/jump_cinnamoroll/
├── index.html          # Entry point, canvas setup, meta tags
├── css/
│   └── style.css       # UI overlay styles, responsive layout, fonts
├── js/
│   ├── main.js         # Game initialization, loop, state machine
│   ├── player.js       # Cinnamoroll character: physics, jump/fly mechanics
│   ├── terrain.js      # Procedural terrain generation (sky, clouds, ground, hills)
│   ├── obstacles.js    # Obstacle spawning & behavior (dark clouds, rain, wind, lightning, animals)
│   ├── renderer.js     # Canvas drawing: backgrounds, parallax, entities
│   ├── input.js        # Unified input handler (touch, click, keyboard)
│   ├── ui.js           # HUD (score, distance), start screen, game-over screen
│   └── utils.js        # Constants, helpers, collision detection
└── assets/
    └── (generated at runtime via canvas — no external files needed)
```

---

### Core Architecture

#### [NEW] [index.html](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/index.html)
- HTML5 document with `<canvas>` element
- Responsive viewport meta for mobile (iPhone 13 mini / iPad Pro 12.9)
- Google Fonts (e.g., "Quicksand" for cute aesthetic)
- SEO meta tags, Open Graph tags
- Load all JS modules via `<script type="module">`

---

#### [NEW] [style.css](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/css/style.css)
- Full-viewport canvas with no scrollbars
- UI overlay positioning (score HUD, start/game-over screens)
- Pastel color palette variables (soft pink, sky blue, lavender, cream)
- Responsive font sizing
- Animated UI transitions (fade-in/out for screens)

---

#### [NEW] [main.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/main.js)
- **Game State Machine**: `MENU → PLAYING → GAME_OVER`
- **Game Loop**: `requestAnimationFrame` with delta-time calculation
- Orchestrates update & render calls across all modules
- Handles canvas resizing for responsive play
- Progressive difficulty: scroll speed increases over time

#### [NEW] [player.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/player.js)
- **Character**: Drawn as a cute white blob with ears, tail, blue eyes (canvas paths)
- **Physics**: Gravity, velocity, position
- **Jump**: Single tap → upward impulse (with max height)
- **Fly**: Rapid multi-tap → sustained upward movement (flapping animation)
- **Animation States**: Idle, jumping, flying, falling, hurt
- **Hitbox**: Slightly smaller than visual for forgiving collision

#### [NEW] [terrain.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/terrain.js)
- **Procedural generation**: Segments spawn off-screen right, scroll left
- **Terrain types**:
  - **Sky zone** (upper): Gradient background, wispy clouds
  - **Cloud platforms** (middle): Walkable/landable clouds
  - **Ground zone** (lower): Grassy ground with rolling hills
- **Parallax scrolling**: 3+ layers at different speeds for depth
- **Seamless looping**: Terrain tiles recycle when off-screen

#### [NEW] [obstacles.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/obstacles.js)
- **Obstacle types** (each with unique visual & behavior):
  | Obstacle | Zone | Behavior | Visual |
  |----------|------|----------|--------|
  | 먹구름 (Dark cloud) | Sky/Mid | Static blocker | Dark grey cloud shape |
  | 비 (Rain) | Sky→Ground | Falling particles, damage zone | Blue streaks |
  | 바람 (Wind) | Any | Pushes player horizontally | Swirl lines + particles |
  | 번개 (Lightning) | Sky | Flash warning → strike column | Yellow zigzag bolt |
  | 동물 (Animals) | Ground | Moving along ground, jumpable | Cute birds/squirrels |
- **Spawn system**: Weighted random, respecting minimum spacing
- **Difficulty scaling**: Frequency & speed increase with distance

#### [NEW] [renderer.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/renderer.js)
- **Background**: Multi-layer gradient sky (sunrise colors → pastel)
- **Parallax layers**: Far mountains/clouds → mid clouds → near ground
- **Entity rendering**: Player, obstacles, terrain with shadow/glow effects
- **Particle system**: For rain, wind swirls, jump sparkles
- **Screen shake**: On collision/damage

#### [NEW] [input.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/input.js)
- Unified handler: `touchstart`, `mousedown`, `keydown` (spacebar)
- Multi-tap detection with timing window for fly mechanic
- Prevents default scroll/zoom on mobile
- Works consistently across iPhone, iPad, desktop

#### [NEW] [ui.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/ui.js)
- **Start Screen**: Game title with cute bouncing animation, "Tap to Start" prompt, brief story text
- **HUD**: Distance counter (meters), high score
- **Game Over Screen**: Final score, high score (localStorage), "Tap to Retry" button, fade-in animation
- All drawn on canvas for consistent rendering

#### [NEW] [utils.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/utils.js)
- Game constants (gravity, speeds, sizes)
- AABB collision detection
- Random range helpers
- Color palette definitions
- Canvas drawing helpers (rounded rect, cloud shape, etc.)

---

## Technical Design Details

### Responsive Canvas Strategy
```
Canvas logical size: 800×450 (16:9)
Scaled via CSS to fill viewport while maintaining aspect ratio
Touch coordinates mapped from screen → canvas space
```

### Physics Model
```
gravity = 0.6 px/frame
jumpForce = -12 px/frame
maxFallSpeed = 15 px/frame
flyForce = -8 px/frame (per tap while airborne)
scrollSpeed = 3 → 8 px/frame (increases with distance)
```

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Sky (top) | Soft lavender | `#C8B6FF` |
| Sky (bottom) | Pastel blue | `#A8D8EA` |
| Cloud | Cream white | `#FFF5E4` |
| Ground | Soft green | `#95D5B2` |
| Hills | Muted sage | `#74C69D` |
| UI Accent | Cinnamoroll pink | `#FFB5C2` |
| Text | Warm charcoal | `#4A4453` |

---

## Verification Plan

### Manual Verification
1. **Desktop**: Open `index.html` in Chrome — verify game loop, controls (click + spacebar), all obstacle types spawn
2. **Mobile**: Test on iPhone 13 mini viewport (375×812) and iPad Pro 12.9 (1024×1366) using Chrome DevTools device emulation
3. **Performance**: Verify 60fps on both form factors using DevTools Performance panel
4. **Gameplay**: Play through to verify collision detection, scoring, difficulty ramp, game-over flow

### Automated Tests
- No automated tests for MVP; game is primarily visual/interactive
- Will verify by playing through multiple game sessions
