export class Input {
    private canvas: HTMLCanvasElement
    public lastClick: { x: number, y: number } | null = null

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
        this.canvas.addEventListener('click', (e) => this.handleClick(e))
    }

    private handleClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect()
        this.lastClick = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    public clear() {
        this.lastClick = null
    }
}
