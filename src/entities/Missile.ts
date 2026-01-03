import * as THREE from 'three'
import { Entity } from './Entity'
import { Config } from '../game/Config'

export class Missile implements Entity {
    public mesh: THREE.Mesh
    public isAlive: boolean = true
    public isEnemy: boolean

    private targetX: number
    private targetY: number
    private speed: number

    // Track position for logic
    public x: number
    public y: number

    constructor(startX: number, startY: number, targetX: number, targetY: number, isEnemy: boolean) {
        this.x = startX
        this.y = startY
        this.targetX = targetX
        this.targetY = targetY
        this.isEnemy = isEnemy
        this.speed = isEnemy ? Config.MISSILE_SPEED : Config.PLAYER_MISSILE_SPEED

        const color = isEnemy ? Config.COLORS.MISSILE_ENEMY : Config.COLORS.MISSILE_PLAYER
        const geometry = new THREE.SphereGeometry(2, 8, 8)
        const material = new THREE.MeshBasicMaterial({ color })
        this.mesh = new THREE.Mesh(geometry, material)

        this.mesh.position.set(this.x, this.y, 0)
    }

    update() {
        const dx = this.targetX - this.x
        const dy = this.targetY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

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
