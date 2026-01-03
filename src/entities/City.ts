import { Entity } from './Entity'
import { Renderer } from '../game/Renderer'
import { Config } from '../game/Config'

export class City implements Entity {
    public x: number
    public y: number
    public width: number = 30
    public height: number = 20
    public isAlive: boolean = true

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    update() {
        // Static entity, maybe animation later
    }

    draw(renderer: Renderer) {
        if (this.isAlive) {
            renderer.drawRect(this.x - this.width / 2, this.y - this.height, this.width, this.height, Config.COLORS.CITY)
        }
    }
}
