import { Entity } from './Entity'
import { Renderer } from '../game/Renderer'
import { Config } from '../game/Config'

export class Missile implements Entity {
    public x: number
    public y: number
    private targetX: number
    private targetY: number
    private speed: number
    public color: string
    public isAlive: boolean = true
    public isEnemy: boolean

    constructor(startX: number, startY: number, targetX: number, targetY: number, isEnemy: boolean) {
        this.x = startX
        this.y = startY
        this.targetX = targetX
        this.targetY = targetY
        this.isEnemy = isEnemy
        this.speed = isEnemy ? Config.MISSILE_SPEED : Config.PLAYER_MISSILE_SPEED
        this.color = isEnemy ? Config.COLORS.MISSILE_ENEMY : Config.COLORS.MISSILE_PLAYER
    }

    update() {
        const dx = this.targetX - this.x
        const dy = this.targetY - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < this.speed) {
            this.x = this.targetX
            this.y = this.targetY
            this.isAlive = false // Reached target
        } else {
            this.x += (dx / distance) * this.speed
            this.y += (dy / distance) * this.speed
        }
    }

    draw(renderer: Renderer) {
        renderer.drawLine(this.x, this.y, this.x - (this.x - this.targetX) * 0.05, this.y - (this.y - this.targetY) * 0.05, this.color) // Trail (simplified)
        renderer.drawCircle(this.x, this.y, 2, this.color)
    }
}
