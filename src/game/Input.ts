import * as THREE from 'three'
import { ThreeRenderer } from './ThreeRenderer'

export class Input {
    private renderer: ThreeRenderer
    public lastClick: { x: number, y: number } | null = null
    public mousePosition: { x: number, y: number } = { x: 0, y: 0 }
    public isMouseDown: boolean = false
    public triggerPlanetDefence: boolean = false
    private raycaster: THREE.Raycaster
    private mouse: THREE.Vector2
    private plane: THREE.Plane

    constructor(renderer: ThreeRenderer) {
        this.renderer = renderer
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // Plane at Z=0 normal facing Camera

        this.renderer.renderer.domElement.addEventListener('click', (e) => this.handleClick(e))
        this.renderer.renderer.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e))
        this.renderer.renderer.domElement.addEventListener('mousedown', () => this.isMouseDown = true)
        this.renderer.renderer.domElement.addEventListener('mouseup', () => this.isMouseDown = false)
        window.addEventListener('keydown', (e) => this.handleKeyDown(e))
    }

    private handleClick(e: MouseEvent) {
        // Normalized Device Coordinates (-1 to +1)
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(this.mouse, this.renderer.camera)

        const target = new THREE.Vector3()
        this.raycaster.ray.intersectPlane(this.plane, target)

        if (target) {
            this.lastClick = { x: target.x, y: target.y }
        }
    }

    private handleMouseMove(e: MouseEvent) {
        // Shared logic with click, could refactor
        const mouse = new THREE.Vector2()
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(mouse, this.renderer.camera)

        const target = new THREE.Vector3()
        this.raycaster.ray.intersectPlane(this.plane, target)

        if (target) {
            this.mousePosition = { x: target.x, y: target.y }
        }
    }

    private handleKeyDown(e: KeyboardEvent) {
        if (e.code === 'Space') {
            this.triggerPlanetDefence = true
        }
    }

    public clear() {
        this.lastClick = null
        this.triggerPlanetDefence = false
    }
}
