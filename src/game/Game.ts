import { ThreeRenderer } from './ThreeRenderer'

import { Input } from './Input'
import { AudioManager } from './AudioManager'
import { Missile } from '../entities/Missile'
import { Explosion } from '../entities/Explosion'
import { City } from '../entities/City'
import { Silo } from '../entities/Silo'
import { Environment } from './Environment'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
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

    private enemySpawnTimer: number = 0

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
        const vFOV = THREE.MathUtils.degToRad(75)
        this.fieldHeight = 2 * Math.tan(vFOV / 2) * 500
        this.fieldWidth = this.fieldHeight * (window.innerWidth / window.innerHeight)

        this.initGame()
    }

    private async initGame() {
        // Load Assets first
        const loader = new FBXLoader()
        this.buildingModel = await loader.loadAsync('/Building.fbx')

        // Hide "Plane" if it exists (User request)
        this.buildingModel.traverse((child) => {
            if (child.name === 'Plane') {
                child.visible = false
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

    private loop(timestamp: number) {
        if (!this.isRunning) return

        this.lastTime = timestamp

        this.update()
        this.draw()

        requestAnimationFrame(this.loop.bind(this))
    }

    private update() {
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
        if (this.input.lastClick && this.silo) {
            // Clamp click to screen bounds if needed, but raycaster usually handles map correctly
            const startPos = this.silo.getTipPosition()

            const missile = new Missile(
                startPos.x, // Center x
                startPos.y, // Bottom y
                this.input.lastClick.x,
                this.input.lastClick.y,
                false
            )
            this.missiles.push(missile)
            this.renderer.add(missile.mesh)
            this.input.clear()
            this.audioManager.playShoot()

            if (!this.musicStarted) {
                this.musicStarted = true
                this.audioManager.playMidi('/Beethoven-Moonlight-Sonata.mid')
            }
        }

        // 3. Update Entities
        this.missiles.forEach(m => m.update())
        this.explosions.forEach(e => e.update())
        this.cities.forEach(c => c.update())

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
                const ex = new Explosion(m.x, m.y)
                this.explosions.push(ex)
                this.renderer.add(ex.mesh)
                this.audioManager.playExplosion()
            } else {
                // Enemy missile: did it hit ground?
                if (m.y <= -this.fieldHeight / 2 + 50) {
                    const ex = new Explosion(m.x, m.y)
                    this.explosions.push(ex)
                    this.renderer.add(ex.mesh)
                    this.audioManager.playExplosion()
                }
            }
            this.renderer.remove(m.mesh)
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

        const missile = new Missile(startX, startY, targetCity.mesh.position.x, targetCity.mesh.position.y, true)
        this.missiles.push(missile)
        this.renderer.add(missile.mesh)
    }

    private checkCollisions() {
        // Explosions vs Missiles
        this.explosions.forEach(explosion => {
            this.missiles.forEach(missile => {
                if (!missile.isAlive) return
                const dx = missile.x - explosion.x
                const dy = missile.y - explosion.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < explosion.radius) {
                    missile.isAlive = false
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
        this.uiElement.innerText = `Cities: ${this.cities.length}`

        if (this.cities.length === 0 && !this.isGameOver) {
            this.isGameOver = true
            this.gameOverElement.style.display = 'block'
            this.audioManager.stopMusic()
        }
    }
}
