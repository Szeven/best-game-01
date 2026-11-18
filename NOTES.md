# Glowmoth — Night Garden Harvest (best-game-01)

An original 2D canvas arcade game, written from scratch for make.fun
best-game-01 ("Make the best game", $1,000). No starter game code was copied;
only the kit's `vendor/makefun-game.ts` (byte-for-byte) and MIT LICENSE were
reused, and `main.ts`/`serve.ts` follow the starter's layout.

## What the game is

You are a glowmoth in a night garden. One night lasts 90 seconds.

- **Goal:** gather **500 pollen before dawn breaks**. Gold pollen +10,
  blue dew +25, a rare golden moth +50.
- **Hazards:** wasps and thorn-puffs sting — 3 hearts, then the night ends.
- **Depth:** pickups chained within ~2 s build a combo multiplier up to x3;
  waves get busier every 20 s; power-ups spawn (S = shield, M = magnet,
  T = slow time); SPACE/click dash has a cooldown and grants brief
  invulnerability.
- **Controls:** WASD / arrow keys or mouse to fly, SPACE / click to dash,
  P pause, R restart, M mute, ENTER to start / play again.
- **Feedback:** HUD shows score vs target, hearts, wave, dawn timer bar,
  best harvest (localStorage), combo and active power-ups; WebAudio synth
  sounds (collect pitch rises with combo, hurt, dash, power-up, win/lose
  jingles) plus a quiet pentatonic night-music loop. No network requests,
  no assets — all art is drawn in code, all sound is generated.

## How to run / verify

```sh
node serve.ts            # serves game/ at http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome/Firefox and play. Screenshot
scenes are deterministic: `?shot=start|play|win|lose&seed=2` replays the
real rules with an autopilot and sets `window.__shotReady`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # exits 0
```

Verified 2026-11-18: exit 0; `out/` contains `game/`, `screenshots/`,
`dossier.json` (375,946 bytes, under the 1.5 MiB cap); running it twice
produces a byte-identical dossier. Screenshots are 1280x800 JPEGs,
42–81 KiB each (under 256 KiB).

Simulated play-test (seed 2): play scene 540 pts / 3 hearts alive at 26 s;
win scene 1,275 pts, won; lose scene 0 hearts (stung out). All four
screenshots were visually inspected and show their stated screens.

## Local commit

Commit SHA: `86bbad255e1a1f237a2c173320bccf6a2c66e67d` (local commit; nothing
pushed, no remote).

## Known limitations

- Win is only decided at dawn: reaching 500 early still means surviving
  the full 90 s — that is the stated rule on the title screen.
- A skilled autopilot clears the target comfortably; human difficulty was
  tuned by feel (wasp speed/spawn, thorn rate, 2 s invulnerability) and
  was not user-tested.
- Sound starts only after a user gesture (browser autoplay policy); the
  game is fully playable muted.
- `shots.json` documents the screenshot queries used; it is not part of
  the game itself.
