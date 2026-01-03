export class Renderer {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    public width: number
    public height: number

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
        this.ctx = this.canvas.getContext('2d')!
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.resize()

        window.addEventListener('resize', () => this.resize())
    }

    private resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.canvas.width = this.width
        this.canvas.height = this.height
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.ctx.fillStyle = '#111' // Config.COLORS.BACKGROUND
        this.ctx.fillRect(0, 0, this.width, this.height)
    }

    public drawCircle(x: number, y: number, radius: number, color: string) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, radius, 0, Math.PI * 2)
        this.ctx.fillStyle = color
        this.ctx.fill()
        this.ctx.closePath()
    }

    public drawRect(x: number, y: number, w: number, h: number, color: string) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, w, h)
    }

    public drawLine(x1: number, y1: number, x2: number, y2: number, color: string) {
        this.ctx.beginPath()
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)
        this.ctx.strokeStyle = color
        this.ctx.stroke()
        this.ctx.closePath()
    }

    public drawText(text: string, x: number, y: number, size = 20, color = '#fff') {
        this.ctx.fillStyle = color
        this.ctx.font = `${size}px monospace`
        this.ctx.fillText(text, x, y)
    }
}
