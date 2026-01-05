import * as THREE from 'three'
import { Entity } from './Entity'
import { Config } from '../game/Config'
import { Trail } from './Trail'

export class Missile implements Entity {
    public mesh: THREE.Group
    public trail: Trail
    public isAlive: boolean = true
    public isEnemy: boolean

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

        this.trail = new Trail()
        this.mesh = new THREE.Group()

        if (isEnemy && model) {
            const m = model.clone()
            m.scale.set(3, 3, 3)
            m.rotation.set(0, Math.PI / 2, 0)
            this.mesh.add(m)
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

        // Emit trail
        this.trail.emit(this.x, this.y, 0)
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
