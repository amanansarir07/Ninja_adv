# Ninja Adventure — Game Description & Instructions

**Ready-to-paste description for store pages, itch.io, game jam submissions, or press kits.**

---

## The World Underwater

The *entire world is underwater*: every level is submerged, with a blue-green water overlay and floating bubbles. **Aquaman** leads the fight to **save sea creatures from extinction**—they are disappearing from the sea, and Aquaman (alongside Naruto and Kakashi) battles through **Village Depths**, **Ruins Depths**, and **Temple Depths** to clear the depths and protect ocean life.

---

## Short Description (1–2 sentences)

**Ninja Adventure** is a 2D side-scrolling action game built with Phaser 3 and Vite. The whole world is *underwater*—play as **Aquaman**, Naruto, or Kakashi and save sea creatures from extinction by fighting through three submerged stages (Village, Ruins, Temple Depths).

---

## Full Game Description

**Ninja Adventure** is a 2D side-scrolling action game where you play as **Aquaman**, **Naruto**, or **Kakashi**. Aquaman is the Guardian of the Seas—sea creatures are disappearing from the ocean, and he fights to save them from extinction. Each hero has unique stats, basic attacks (punch and kick), and two signature abilities with cooldowns. The *entire world is underwater*—a blue-green tint and floating bubbles set the mood. Your goal is to fight through three submerged stages and clear the depths.

- **Village Depths** — The sunken village. Defeat 3 Sound Ninja.
- **Ruins Depths** — The sunken ruins. Defeat 5 Sound Ninja.
- **Temple Depths** — The deep temple. Defeat minions and the final Boss.

The game uses pixel-art style rendering, parallax backgrounds, arcade physics, and a full-screen water overlay with rising bubbles. Enemies patrol, chase the player when in range, and attack with melee hits. Touching an enemy damages you and applies knockback; after taking damage you get a short invulnerability period. If your health reaches zero or you fall off the bottom of the stage, it’s Game Over—you can retry the same level. Beating all enemies on a stage shows “Stage Clear” and lets you continue to the next stage; beating the final stage shows “Game Complete” and returns you to the title screen.

---

## Game Instructions

### How to Start

1. **Title Screen** — Press **ENTER** or **SPACE**, or click anywhere to start.
2. **Character Select** — Use **A / D** or **Left / Right** arrow keys to choose a character (**Aquaman**, Naruto, or Kakashi). Click a character or press **ENTER / SPACE** to confirm and begin Level 1.

### Controls (During Gameplay)

| Action        | Keyboard                          |
|---------------|-----------------------------------|
| Move left     | **A** or **Left Arrow**           |
| Move right    | **D** or **Right Arrow**          |
| Jump          | **W** or **Up Arrow**             |
| Punch         | **J**                             |
| Kick          | **K**                             |
| Skill 1       | **L**                             |
| Skill 2       | **U**                             |
| Pause         | **ESC** or click **PAUSE** button |

- **Skill 1 (L)** and **Skill 2 (U)** depend on the character (see “Characters & Abilities” below).
- The on-screen HUD shows: health bar, current level, skill icons with cooldowns, and a PAUSE button (top-right).

### Menus & Flow

- **Pause (ESC or PAUSE):** Opens pause menu. Choose **CONTINUE GAME** to resume, or **BACK TO MENU** to quit to the title screen.
- **Stage Clear:** Defeat all enemies → “STAGE CLEAR!” → Press **ENTER** or **SPACE** to go to the next stage (or to title if you just finished the last stage).
- **Game Over:** Health reaches 0 or you fall off the bottom → “GAME OVER” → Press **ENTER** or **SPACE** to retry the same level.
- **Game Complete:** Clear Level 3 → “GAME COMPLETE!” → Press **ENTER** or **SPACE** to return to the title screen.

---

## Game Mechanics

### Core Loop

- **Objective:** Clear each stage by defeating every Sound Ninja on the level.
- **Movement:** Run and jump on platforms. Camera follows the player; world has left/right and top bounds; falling off the bottom kills the player.
- **Combat:** Melee (punch/kick) and two jutsu per character. Enemies have health; when it reaches 0 they die and no longer count toward the stage goal.
- **Progression:** Level 1 → Level 2 → Level 3. No saving; each run starts from character select.

### Characters & Abilities

**Aquaman** (Guardian of the Seas — saves sea creatures from extinction)  
- **Role:** Fast, lower health, strong burst.  
- **Stats:** Highest walk speed (300), jump power 820, max health 90.  
- **Skill 1 (L):** Short charge, then dash in facing direction. Damages and knocks back enemies in path (60 damage). Cooldown: 4 s.  
- **Skill 2 (U):** Targets nearest enemy; vortex effect and screen shake; after ~1 s the target is instantly defeated. Cooldown: 7 s.  

**Naruto**  
- **Role:** Tanky, area damage, summon support.  
- **Stats:** Walk speed 280, jump power 850, highest max health (120).  
- **Skill 1 (L) — Rasengan:** Charge then area blast in front. Damages all enemies in a large radius (80 damage) and knocks them back. Cooldown: 6 s.  
- **Skill 2 (U) — Summoning Jutsu:** Summons a toad in front. Toad moves, hunts nearby enemies, and attacks them (40 damage per hit). Lasts ~15 s and can be damaged (25 per enemy hit). Cooldown: 10 s.  

**Kakashi**  
- **Role:** Balanced; strong single-target and one instant-kill.  
- **Stats:** Walk speed 260, jump power 800, max health 100.  
- **Skill 1 (L):** Charge then dash (50 damage). Cooldown: 5 s.  
- **Skill 2 (U):** Targets nearest enemy and defeats them after the effect. Cooldown: 8 s.  

### Combat Details

- **Punch (J):** ~20 damage, short range in front.  
- **Kick (K):** ~25 damage, short range in front.  
- **Enemy contact:** If an enemy touches you (and you’re not invulnerable), you take 20 damage and are knocked back.  
- **Enemy melee:** Sound Ninja can hit you for 15 damage when their attack connects (you are knocked back).  
- **Invulnerability:** After taking damage, you are briefly invulnerable (~2 s) and blink; you cannot be damaged again until it ends.  
- **Damage numbers:** Pop up for both you and enemies to show damage dealt.

### Enemies

- **Sound Ninja (minions):** 40 HP each. Patrol, chase when player is in range (~300 px), and perform melee attacks (15 damage, ~4 s cooldown). Defeated at 0 HP.  
- **Boss (Level 3 only):** Much higher health, larger size, and stronger attacks. Deals more damage and attacks more often when enraged (low HP). Must be defeated to clear the final stage.

### Level Structure

- **Underwater: Village Depths (Stage 1):** 30×20 tiles (64 px), 3 Sound Ninja, forest ground and decorations.  
- **Underwater: Ruins Depths (Stage 2):** 35×20 tiles, 5 Sound Ninja, desert tiles and pillars.  
- **Temple Depths (Stage 3):** 40×22 tiles, minions plus a powerful Boss, temple tiles and crystals.

All stages are rendered with an underwater look: blue-green overlay and floating bubbles.  

Backgrounds use parallax (slower scroll than foreground). All levels are single-screen width in tiles but extend horizontally; the camera scrolls with the player.

### Win / Lose Conditions

- **Stage clear:** All Sound Ninja on the stage are defeated → Stage Clear screen → next stage (or title after Level 3).  
- **Game Over:** Player health ≤ 0 or player falls below the level → Game Over screen → retry same level.  
- **Game Complete:** Clear Level 3 → Game Complete screen → return to title.

---

## Technical Summary (Optional)

- **Engine:** Phaser 3 (JavaScript).  
- **Build:** Vite, ES modules.  
- **Resolution:** 1152×768 (scale mode: FIT, centered).  
- **Physics:** Arcade, 120 FPS cap, gravity on characters; no global world gravity.  
- **Scenes:** Preloader → Title → Character Select → Level 1 / 2 / 3 (with overlay UIScene for HUD, Pause, Victory, Game Over, Game Complete).

---

## One-Liner for Listings

**Ninja Adventure** — 2D side-scroller: the whole world is underwater. Play as **Aquaman**, Naruto, or Kakashi—Aquaman saves sea creatures from extinction. Dive through Village, Ruins, and Temple depths; face the Boss in Level 3. Punch, kick, and specials. Phaser 3 + Vite.

--
