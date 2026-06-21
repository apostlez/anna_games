# 두부의 모험 (Tofu's Adventure) — Walkthrough

The game has been fully updated and rebranded from Cinnamoroll to **두부의 모험** (Tofu's Adventure) with a cute hamster protagonist, reworked animal obstacles, atmospheric weather mechanics, checkpoints, and snack power-ups.

## Gameplay Demo & Screenshots

````carousel
![Start Screen](file:///C:/Users/yunkw/.gemini/antigravity-ide/brain/98ad848f-a60e-4d63-92f9-1bb6851484a7/start_screen_1781973276816.png)
<!-- slide -->
![Gameplay](file:///C:/Users/yunkw/.gemini/antigravity-ide/brain/98ad848f-a60e-4d63-92f9-1bb6851484a7/gameplay_active_1_1781973368127.png)
<!-- slide -->
![Game Over](file:///C:/Users/yunkw/.gemini/antigravity-ide/brain/98ad848f-a60e-4d63-92f9-1bb6851484a7/game_over_card_1781973384042.png)
<!-- slide -->
![Gameplay Video Recording](file:///C:/Users/yunkw/.gemini/antigravity-ide/brain/98ad848f-a60e-4d63-92f9-1bb6851484a7/play_tofu_adventure_1781973263313.webp)
````

## Reworked Features

### 1. Player Character: Hamster 두부 (Tofu)
- **Hamster Redesign**: Replaced Cinnamoroll with a cute round orange/cream hamster named 두부. Features chubby cheeks, cute tiny round ears, pink paws, and a stubby tail.
- **Invincibility Sparkles & Glow**: When Powered up by eating snacks, 두부 sparkles with golden stars and is surrounded by a glowing golden aura.
- **Story Update**: Title card and story description now reflect the journey of hamster 두부 traveling back home after being blown away by a hurricane.

### 2. Reworked Animals & Obstacles
- **Foreground Squirrels**: Squirrels now hop on ground level in front of hills, preventing them from being obscured by parallax background elements.
- **Flying Birds**: Birds now spawn at higher altitudes in the air and fly with a sinusoidal wave path, flapping their wings.
- **Large Animal Obstacle (곰/Bear)**: Added a large, slower-moving ground obstacle (a cute waddling brown bear) that requires a well-timed jump to clear.

### 3. Weather Effects (Atmospheric only)
- **Rain**: Hitbox damage has been removed. Instead, entering a rain zone triggers a dark blue-gray overlay screen tint and slows down the scroll speed by 15%.
- **Lightning**: Hitbox damage has been removed. Triggering a lightning strike causes a visual flash on the screen, accompanied by screen shake.

### 4. Checkpoint Rest System
- **Milestone Spawning**: A checkpoint signpost spawns every **500m** (500, 1000, 1500...).
- **Safe Zone Rest**: Crossing a checkpoint triggers a 3-second safe zone banner ("🚩 쉼터 도달!"). Scroll speed resets to the base level, obstacle spawning is paused, and celebratory particles burst around player.

### 5. Snack Power-Up (Invincibility)
- **Snack Items**: Sunflower seeds, carrots, and yogurt drops float randomly in the air or rest on the ground/clouds.
- **Invincibility Duration**: Collecting any snack grants **3 seconds of invincibility** (gold glow aura, golden sparkles, and absolute collision bypass).

---

## File Modifications Summary

| File | Changes Made |
|------|--------------|
| [utils.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/utils.js) | Defined big animal, checkpoint, and snack constants, and added hamster/snack color palette definitions. |
| [player.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/player.js) | Reworked Cinnamoroll paths to draw hamster 두부, added invincibility triggers, golden sparkles, and invincible aura. |
| [obstacles.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/obstacles.js) | Handled flying bird paths, ground squirrels, `BigAnimal` bear, `Checkpoint` flags, `Snack` items, and non-lethal weather collision slow/shake triggers. |
| [main.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/main.js) | Integrated checkpoint safe zones, scroll speed slows for rain, screen shake for lightning strikes, celebration particles, and adjusted drawing order so characters/obstacles are drawn in front of hills. |
| [ui.js](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/js/ui.js) | Updated start screen title to "두부의 모험", story subtitle, changed HUD icon to 🐹, implemented animated sliding checkpoint banner, and updated local storage high score keys to `jumpTofu_highScore`. |
| [index.html](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/index.html) | Renamed web app title, updated meta tag description, Open Graph tags, and updated loading overlay text. |
| [style.css](file:///c:/Users/yunkw/Documents/workspace/anna_games/jump_cinnamoroll/css/style.css) | Updated header comment for game branding. |

---

## Verification Plan Results

- **Hamster Character**: Verified 두부 draws correctly with jump squishing, run-cycle paw bobs, and flying transparent wings.
- **Animal Behaviors**: Confirmed birds fly sinusoidally, squirrels hop in front of hills, and the large bear obstacles spawn correctly.
- **Weather effects**: Entering rain shows a dark screen tint and slows down play. Lightning flashes the screen and shakes it without causing game over.
- **Checkpoints**: At 500m intervals, checkpoint poles scroll in, and crossing them triggers a safe rest zone and a milestone banner.
- **Snacks & Invincibility**: Verified snacks float, spawn randomly, and collecting them initiates a golden aura that ignores collision damage.
- **High Scores**: Verified new high scores are saved in localStorage under `jumpTofu_highScore`.
