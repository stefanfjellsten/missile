import { Renderer } from './Renderer'
import { Config } from './Config'
import { Input } from './Input'

import { Missile } from '../entities/Missile'
import { Explosion } from '../entities/Explosion'
import { City } from '../entities/City'

export class Game {
    private renderer: Renderer
    private input: Input
    private lastTime: number = 0
    private isRunning: boolean = false

    private cities: City[] = []
    private missiles: Missile[] = []
    private explosions: Explosion[] = []

    private enemySpawnTimer: number = 0

    constructor() {
        this.renderer = new Renderer('gameCanvas')
        this.input = new Input('gameCanvas')
        this.initGame()
    }

    private initGame() {
        const cityCount = 6
        const spacing = this.renderer.width / (cityCount + 1)
        for (let i = 0; i < cityCount; i++) {
            this.cities.push(new City(spacing * (i + 1), this.renderer.height - 20))
        }
    }

    public start() {
        this.isRunning = true
        this.lastTime = performance.now()
        this.loop(this.lastTime)
    }

    private loop(timestamp: number) {
        if (!this.isRunning) return

        // const deltaTime = timestamp - this.lastTime // Unused for now
        this.lastTime = timestamp

        this.update()
        this.draw()

        requestAnimationFrame(this.loop.bind(this))
    }

    private update() {
        // 1. Spawning enemies
        this.enemySpawnTimer++
        if (this.enemySpawnTimer > 60) { // Spawn every second approx
            this.enemySpawnTimer = 0
            this.spawnEnemyMissile()
        }

        // 2. Player Input
        if (this.input.lastClick) {
            this.missiles.push(new Missile(
                this.renderer.width / 2, // Silo center
                this.renderer.height - 10,
                this.input.lastClick.x,
                this.input.lastClick.y,
                false
            ))
            this.input.clear()
        }

        // 3. Update Entities
        this.missiles.forEach(m => m.update())
        this.explosions.forEach(e => e.update())
        this.cities.forEach(c => c.update())

        // 4. Cleanup dead entities
        // Check if missiles reached target
        this.missiles.forEach(m => {
            if (!m.isAlive && !m.isEnemy) {
                // Player missile reached target -> explode
                this.explosions.push(new Explosion(m.x, m.y))
            } else if (!m.isAlive && m.isEnemy && m.y >= this.renderer.height - 50) {
                // Enemy missile hit ground/city logic (simplified)
                this.explosions.push(new Explosion(m.x, m.y))
            }
        })

        this.missiles = this.missiles.filter(m => m.isAlive)
        this.explosions = this.explosions.filter(e => e.isAlive)
        this.cities = this.cities.filter(c => c.isAlive)

        // 5. collision detection
        this.checkCollisions()
    }

    private spawnEnemyMissile() {
        if (this.cities.length === 0) return // Game Over logic placeholder

        const targetCity = this.cities[Math.floor(Math.random() * this.cities.length)]
        this.missiles.push(new Missile(
            Math.random() * this.renderer.width,
            0,
            targetCity.x,
            targetCity.y,
            true
        ))
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
                    // Chain reaction? Or score?
                }
            })
        })

        // Enemy Missiles vs Cities
        this.missiles.forEach(missile => {
            if (!missile.isEnemy) return // Player missiles don't kill cities

            this.cities.forEach(city => {
                if (!city.isAlive) return
                const dx = missile.x - city.x
                const dy = missile.y - city.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 30) { // arbitrary hit radius
                    city.isAlive = false
                    missile.isAlive = false
                    this.explosions.push(new Explosion(city.x, city.y))
                }
            })
        })
    }

    private draw() {
        this.renderer.clear()

        // Draw Ground
        this.renderer.drawRect(0, this.renderer.height - 20, this.renderer.width, 20, '#333')

        // Draw Silo
        this.renderer.drawCircle(this.renderer.width / 2, this.renderer.height - 10, 20, Config.COLORS.SILO)

        this.cities.forEach(c => c.draw(this.renderer))
        this.missiles.forEach(m => m.draw(this.renderer))
        this.explosions.forEach(e => e.draw(this.renderer))

        // Draw UI
        this.renderer.drawText(`FPS: ${Config.FPS}`, 10, 30)
        // this.renderer.drawText(`Cities: ${this.cities.length}`, 10, 60)

        if (this.cities.length === 0) {
            this.renderer.drawText('GAME OVER', this.renderer.width / 2 - 100, this.renderer.height / 2, 40, '#f00')
        }
    }
}
