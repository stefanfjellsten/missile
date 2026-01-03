import { Game } from './game/Game'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="gameCanvas"></canvas>
`

const game = new Game()
game.start()
