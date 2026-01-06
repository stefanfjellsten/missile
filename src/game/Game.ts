import { ThreeRenderer } from './ThreeRenderer'

import { Input } from './Input'
import { AudioManager } from './AudioManager'
import { Missile } from '../entities/Missile'
import { Trail } from '../entities/Trail'
import { Config, PowerUpType } from './Config'
import { Explosion } from '../entities/Explosion'
import { City } from '../entities/City'
import { Silo } from '../entities/Silo'
import { Environment } from './Environment'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

export class Game {
    private renderer: ThreeRenderer
    private input: Input
    private audioManager: AudioManager
    private lastTime: number = 0
    private isRunning: boolean = false
    private isGameOver: boolean = false
    private musicStarted: boolean = false
    private isReady: boolean = false

    private cities: City[] = []
    private missiles: Missile[] = []
    private explosions: Explosion[] = []
    private silo: Silo | null = null
    private environment: Environment | null = null
    private buildingModel: THREE.Group | null = null
    private missileModel: THREE.Group | null = null
    private dyingTrails: Trail[] = []

    private activePowerUp: PowerUpType = PowerUpType.NONE
    private powerUpTimer: number = 0

    private enemySpawnTimer: number = 0
    private frameCounter: number = 0

    // Game field boundaries (approximate based on camera Z=500 FOV=75)
    // At z=0, visible height is approx 2 * 500 * tan(75/2) = 767.
    // Visible width = height * aspect ratio.
    private fieldWidth: number
    private fieldHeight: number
    private uiElement: HTMLElement
    private gameOverElement: HTMLElement

    constructor() {
        this.renderer = new ThreeRenderer('gameCanvas')
        this.input = new Input(this.renderer)
        this.audioManager = new AudioManager()
        this.uiElement = document.getElementById('ui')!
        this.gameOverElement = document.getElementById('game-over')!
        this.gameOverElement.style.display = 'none' // Initially hidden

        // Calculate field size
        // Tied to Ortho frustum size set in ThreeRenderer (1000)
        this.fieldHeight = 1000
        this.fieldWidth = this.fieldHeight * (window.innerWidth / window.innerHeight)

        this.initGame()
    }

    private async initGame() {
        // Load Assets first
        const loader = new FBXLoader()
        this.buildingModel = await loader.loadAsync('Building.fbx')

        // Hide "Plane" if it exists (User request)
        this.buildingModel.traverse((child) => {
            if (child.name === 'Plane') {
                child.visible = false
            }
        })

        const gltfLoader = new GLTFLoader()
        const gltf = await gltfLoader.loadAsync('AIM.glb')
        this.missileModel = gltf.scene

        // Use Basic material to avoid lighting artifacts (strange rotation)
        // Center the model to fix pivot
        const box = new THREE.Box3().setFromObject(this.missileModel)
        const center = box.getCenter(new THREE.Vector3())
        this.missileModel.position.x -= center.x
        this.missileModel.position.y -= center.y
        this.missileModel.position.z -= center.z

        // Use Basic material to avoid lighting artifacts (strange rotation)
        this.missileModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Keep texture and color if possible
                const originalMaterial = child.material as THREE.MeshStandardMaterial
                const newMaterial = new THREE.MeshBasicMaterial({
                    map: originalMaterial.map,
                    color: originalMaterial.color
                })
                child.material = newMaterial
            }
        })

        const cityCount = 6
        const spacing = this.fieldWidth / (cityCount + 1)
        const startX = -this.fieldWidth / 2

        // Add Environment
        this.environment = new Environment(this.fieldWidth, this.fieldHeight)
        this.renderer.add(this.environment.mesh)

        for (let i = 0; i < cityCount; i++) {
            const city = new City(startX + spacing * (i + 1), this.buildingModel!)
            // City Y position is handled ensuring it's at bottom
            city.mesh.position.y = -this.fieldHeight / 2 + 10
            this.cities.push(city)
            this.renderer.add(city.mesh)
        }

        // Add Silo
        this.silo = new Silo(0, -this.fieldHeight / 2 + 10)
        this.renderer.add(this.silo.mesh)

        this.isReady = true
    }

    public start() {
        // Wait for ready if start called immediately
        this.waitForReady()
    }

    private waitForReady() {
        if (!this.isReady) {
            requestAnimationFrame(() => this.waitForReady())
            return
        }

        this.isRunning = true
        this.lastTime = performance.now()
        this.loop(this.lastTime)
    }

    private ActivatePowerUp(type: PowerUpType) {
        this.activePowerUp = type
        this.powerUpTimer = 600 // 10 seconds @ 60fps
    }

    private loop(timestamp: number) {
        if (!this.isRunning) return

        this.lastTime = timestamp
        this.frameCounter++

        this.update(timestamp)
        this.draw()

        requestAnimationFrame(this.loop.bind(this))
    }

    private update(timestamp: number) {
        if (this.powerUpTimer > 0) {
            this.powerUpTimer--
            if (this.powerUpTimer <= 0) {
                this.activePowerUp = PowerUpType.NONE
            }
        }

        // 1. Spawning enemies
        this.enemySpawnTimer++
        if (this.enemySpawnTimer > 60) {
            this.enemySpawnTimer = 0
            this.spawnEnemyMissile()
        }

        if (this.silo && this.input.mousePosition) {
            this.silo.pointAt(this.input.mousePosition.x, this.input.mousePosition.y)
        }

        // 2. Player Input
        // Rail Gun Auto-Fire
        if (this.activePowerUp === PowerUpType.RAIL_GUN && this.input.isMouseDown && this.silo) {
            // Rate limit: spawn every 5 frames
            if (this.frameCounter % 5 === 0 && this.input.mousePosition) {
                this.firePlayerMissile(this.input.mousePosition.x, this.input.mousePosition.y, true) // isRailGun=true
            }
        }
        // Normal Fire
        else if (this.input.lastClick && this.silo) {
            // Clamp click to screen bounds if needed, but raycaster usually handles map correctly
            this.firePlayerMissile(this.input.lastClick.x, this.input.lastClick.y, false)
            this.input.clear()
        }

        // 3. Update Entities
        this.missiles.forEach(m => m.update())
        this.explosions.forEach(e => e.update())
        this.cities.forEach(c => c.update())

        // Update failing/dying trails
        this.dyingTrails.forEach(t => t.update())
        // Cleanup empty trails
        const activeTrails: Trail[] = []
        this.dyingTrails.forEach(t => {
            if (t.isEmpty()) {
                this.renderer.remove(t.mesh)
            } else {
                activeTrails.push(t)
            }
        })
        this.dyingTrails = activeTrails

        // 4. Cleanup dead entities
        this.handleEntityCleanup()

        // 5. Collision Detection
        this.checkCollisions()
    }

    private handleEntityCleanup() {
        // Logic to trigger explosions upon death
        this.missiles.forEach(m => {
            if (!m.isAlive) {
                // If it died naturally (reached target), explode
                // We need distinguish between "reached target" vs "destroyed by explosion"
                // For now, simple logic: if player missile dies (reaches Click), explode.
                // If enemy missile dies (reaches target), explode.
                // If destroyed by interception, we might handle it in collision check.

                // Hack: we check this in update loop or via flags.
                // Let's rely on collision check for interception.
                // Here we just check position-based death?

                // Actually, Missile update() sets isAlive=false when it reaches target.
                // If we just check !isAlive here, it might be double counting if collision killed it.
                // We can check if it's still in the list before removal.
            }
        })

        // We need a better way to spawn explosion ONLY when reaching target, not when intercepted.
        // But for KISS, let's just spawn explosion whenever missile dies for now,
        // creating a chain reaction effect which is actually cool.

        // Wait, if enemy missile is intercepted, it shouldn't produce a damaging explosion?
        // In Missile Command, intercepted missiles just disappear (maybe small poof).
        // Only when they hit ground they explode.
        // Player missiles always explode.

        const deadMissiles = this.missiles.filter(m => !m.isAlive)
        deadMissiles.forEach(m => {
            if (!m.isEnemy) {
                // Player missile always explodes
                const isRailGun = this.activePowerUp === PowerUpType.RAIL_GUN
                const isBigBlast = this.activePowerUp === PowerUpType.BIG_BLAST

                let radiusMultiplier = 1
                if (isBigBlast) radiusMultiplier = 3
                if (isRailGun) radiusMultiplier = 0.5

                const ex = new Explosion(m.x, m.y, radiusMultiplier)
                this.explosions.push(ex)
                this.renderer.add(ex.mesh)

                if (!isRailGun) {
                    this.audioManager.playExplosion()
                } else {
                    // Maybe lighter sound or skip?
                    // We'll skip standard explosion sound for rapid fire to save ears
                }
            } else {
                // Enemy missile: did it hit ground?
                if (m.y <= -this.fieldHeight / 2 + 50) {
                    const ex = new Explosion(m.x, m.y)
                    this.explosions.push(ex)
                    this.renderer.add(ex.mesh)
                    this.audioManager.playExplosion()
                } else if (m.killedByExplosion) {
                    // Chain Reaction!
                    const ex = new Explosion(m.x, m.y)
                    this.explosions.push(ex)
                    this.renderer.add(ex.mesh)
                    this.audioManager.playExplosion()
                }
            }
            this.renderer.remove(m.mesh)
            // Detach trail to die gracefully
            this.dyingTrails.push(m.trail)
        })

        this.missiles = this.missiles.filter(m => m.isAlive)

        const deadExplosions = this.explosions.filter(e => !e.isAlive)
        deadExplosions.forEach(e => this.renderer.remove(e.mesh))
        this.explosions = this.explosions.filter(e => e.isAlive)

        const deadCities = this.cities.filter(c => !c.isAlive)
        deadCities.forEach(c => {
            if (c.mesh.visible) { // Check if not already cleaned
                this.renderer.remove(c.mesh)
                // Spawn Explosion
                const ex = new Explosion(c.mesh.position.x, c.mesh.position.y)
                this.explosions.push(ex)
                this.renderer.add(ex.mesh)
            }
        })
        this.cities = this.cities.filter(c => c.isAlive)
    }

    private spawnEnemyMissile() {
        if (this.cities.length === 0) return

        const targetCity = this.cities[Math.floor(Math.random() * this.cities.length)]
        const startX = (Math.random() - 0.5) * this.fieldWidth
        const startY = this.fieldHeight / 2

        const missile = new Missile(startX, startY, targetCity.mesh.position.x, targetCity.mesh.position.y, true, this.missileModel!)
        this.missiles.push(missile)
        this.renderer.add(missile.mesh)
        this.renderer.add(missile.trail.mesh)
    }

    private checkCollisions() {
        // Explosions vs Missiles
        this.explosions.forEach(explosion => {
            this.missiles.forEach(missile => {
                if (!missile.isAlive) return

                // Prevent Friendly Fire if Rail Gun is active
                if (this.activePowerUp === PowerUpType.RAIL_GUN && !missile.isEnemy) {
                    return
                }

                if (missile.checkCollision(explosion.x, explosion.y, explosion.radius)) {
                    // Activate powerup if present
                    if (missile.powerUpType !== PowerUpType.NONE) {
                        this.ActivatePowerUp(missile.powerUpType)
                    }
                    missile.isAlive = false
                    missile.killedByExplosion = true
                    // This is an interception
                }
            })
        })

        // Enemy Missiles vs Cities
        this.missiles.forEach(missile => {
            if (!missile.isEnemy || !missile.isAlive) return

            this.cities.forEach(city => {
                if (!city.isAlive) return
                const dx = missile.x - city.mesh.position.x
                const dy = missile.y - city.mesh.position.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 30) { // Hit radius
                    city.isAlive = false
                    missile.isAlive = false
                    // Explosion spawned in cleanup
                    this.audioManager.playExplosion()
                }
            })
        })
    }

    private draw() {
        this.renderer.render()
        let status = `Cities: ${this.cities.length}`
        if (this.activePowerUp === PowerUpType.BIG_BLAST) {
            status += ` | BIG BLAST ACTIVE (${Math.ceil(this.powerUpTimer / 60)})`
        } else if (this.activePowerUp === PowerUpType.RAIL_GUN) {
            status += ` | RAIL GUN ACTIVE (${Math.ceil(this.powerUpTimer / 60)})`
        }
        this.uiElement.innerText = status

        if (this.cities.length === 0 && !this.isGameOver) {
            this.isGameOver = true
            this.gameOverElement.style.display = 'block'
            this.audioManager.stopMusic()
        }
    }
    private firePlayerMissile(targetX: number, targetY: number, isRailGun: boolean) {
        if (!this.silo) return
        const startPos = this.silo.getTipPosition()

        const missile = new Missile(
            startPos.x,
            startPos.y,
            targetX,
            targetY,
            false
        )

        if (isRailGun) {
            // Speed hack: update internals directly or subclass. 
            // Since speed is private in Missile, we might need a Setter or modify Missile.
            // But wait, speed is initialized in constructor.
            // Let's modify Missile to accept speed? Or just "isRailGun" flag?
            // Actually, let's just make speed public for now or hack it via any
            (missile as any).speed = 25
        }

        this.missiles.push(missile)
        this.renderer.add(missile.mesh)
        this.renderer.add(missile.trail.mesh)

        if (!isRailGun) {
            this.audioManager.playShoot()
        } else {
            this.audioManager.playRailGun()
        }

        if (!this.musicStarted) {
            this.musicStarted = true
            this.audioManager.playMidi('Beethoven-Moonlight-Sonata.mid')
        }
    }
}
