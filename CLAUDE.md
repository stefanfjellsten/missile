# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Architecture

This is a Missile Command-style browser game built with Three.js and TypeScript using Vite as the bundler.

### Core Structure

**Game Loop** (`src/game/Game.ts`): Central orchestrator handling:
- Entity lifecycle (missiles, explosions, cities, trails)
- Spawn logic for enemy missiles
- Collision detection between explosions/missiles and missiles/cities
- Asset loading (FBX buildings, GLTF missile models)

**Renderer** (`src/game/ThreeRenderer.ts`): Wraps Three.js with orthographic camera (1000 unit frustum height). All game coordinates are in world units, not pixels.

**Entity System** (`src/entities/`): All entities implement the `Entity` interface with `update()`, `mesh`, and `isAlive`. Key entities:
- `Missile` - Both player and enemy missiles with `Trail` component
- `Explosion` - Growing/shrinking collision spheres
- `City` - Destructible targets using cloned FBX models
- `Silo` - Player's firing point, rotates to follow cursor

**Audio** (`src/game/AudioManager.ts`): Uses Tone.js for procedural sounds (synth shoot, noise explosion) and MIDI playback via piano sampler.

### Key Patterns

- Coordinate system: Origin at center, Y-up. Ground level at `-fieldHeight/2`
- Entity cleanup happens in `handleEntityCleanup()` - entities set `isAlive = false` and are removed next frame
- Trails persist independently after missile death (`dyingTrails` array)
- Config values in `src/game/Config.ts` control speeds, colors, explosion parameters
