import { Game } from './game/Game'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="gameCanvas"></canvas>
`

const game = new Game()
// game.start()

const startButton = document.getElementById('start-button')
const startScreen = document.getElementById('start-screen')

startButton?.addEventListener('click', () => {
  if (startScreen) startScreen.style.display = 'none'
  game.start()
})
