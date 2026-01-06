import * as THREE from 'three'
import { Entity } from './Entity'
import { Config, PowerUpType } from '../game/Config'
import { Trail } from './Trail'

export class Missile implements Entity {
    public mesh: THREE.Group
    public trail: Trail
    public isAlive: boolean = true
    public isEnemy: boolean
    public powerUpType: PowerUpType = PowerUpType.NONE

    private targetX: number
    private targetY: number
    private speed: number

    // Track position for logic
    public x: number
    public y: number

    constructor(startX: number, startY: number, targetX: number, targetY: number, isEnemy: boolean, model?: THREE.Group) {
        this.x = startX
        this.y = startY
        this.targetX = targetX
        this.targetY = targetY
        this.isEnemy = isEnemy
        this.speed = isEnemy ? Config.MISSILE_SPEED : Config.PLAYER_MISSILE_SPEED

        if (isEnemy && Math.random() < 0.1) {
            this.powerUpType = Math.random() > 0.5 ? PowerUpType.BIG_BLAST : PowerUpType.RAIL_GUN
        }

        this.trail = new Trail()
        this.mesh = new THREE.Group()

        if (isEnemy && model) {
            const m = model.clone()
            m.scale.set(1, 1, 1)
            m.rotation.set(0, Math.PI / 2, Math.PI / 2)
            this.mesh.add(m)

            if (this.powerUpType !== PowerUpType.NONE) {
                // Visual Indicator
                const geom = new THREE.SphereGeometry(5, 8, 8)
                const color = this.powerUpType === PowerUpType.BIG_BLAST ? 0x00ffff : 0xff00ff // Cyan or Magenta
                const mat = new THREE.MeshBasicMaterial({ color })
                const orb = new THREE.Mesh(geom, mat)
                orb.position.set(0, 10, 0) // Attached to missile body
                this.mesh.add(orb)
            }
        } else {
            const color = isEnemy ? Config.COLORS.MISSILE_ENEMY : Config.COLORS.MISSILE_PLAYER
            const geometry = new THREE.SphereGeometry(2, 8, 8)
            const material = new THREE.MeshBasicMaterial({ color })
            const sphere = new THREE.Mesh(geometry, material)
            this.mesh.add(sphere)
        }

        this.mesh.position.set(this.x, this.y, 0)
        this.mesh.up.set(0, 0, 1) // Fix for 2D lookAt singularity
        if (isEnemy && model) {
            this.mesh.lookAt(targetX, targetY, 0)
        }
    }

    update() {
        const dx = this.targetX - this.x
        const dy = this.targetY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Emit trail from tail
        const distSafe = distance > 0 ? distance : 1
        const vx = dx / distSafe
        const vy = dy / distSafe
        const offset = 85 // Adjust based on missile length
        this.trail.emit(this.x - vx * offset - 2.5, this.y - vy * offset, 0)
        this.trail.update()

        if (distance < this.speed) {
            this.x = this.targetX
            this.y = this.targetY
            this.isAlive = false
        } else {
            this.x += (dx / distance) * this.speed
            this.y += (dy / distance) * this.speed
        }

        this.mesh.position.set(this.x, this.y, 0)
    }
}
