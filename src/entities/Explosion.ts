import { Entity } from './Entity'
import { Renderer } from '../game/Renderer'
import { Config } from '../game/Config'

export class Explosion implements Entity {
    public x: number
    public y: number
    public radius: number = 0
    private maxRadius: number
    private growthRate: number
    public isAlive: boolean = true
    private expanding: boolean = true

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.maxRadius = Config.EXPLOSION_RADIUS
        this.growthRate = Config.EXPLOSION_GROWTH_RATE
    }

    update() {
        if (this.expanding) {
            this.radius += this.growthRate
            if (this.radius >= this.maxRadius) {
                this.expanding = false
            }
        } else {
            this.radius -= this.growthRate
            if (this.radius <= 0) {
                this.isAlive = false
            }
        }
    }

    draw(renderer: Renderer) {
        renderer.drawCircle(this.x, this.y, this.radius, Config.COLORS.EXPLOSION)
    }
}
