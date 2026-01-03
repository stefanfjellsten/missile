import { Renderer } from '../game/Renderer'

export interface Entity {
    update(): void
    draw(renderer: Renderer): void
    isAlive: boolean
}
