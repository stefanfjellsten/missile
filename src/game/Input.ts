import * as THREE from 'three'
import { ThreeRenderer } from './ThreeRenderer'

export class Input {
    private renderer: ThreeRenderer
    public lastClick: { x: number, y: number } | null = null
    private raycaster: THREE.Raycaster
    private mouse: THREE.Vector2
    private plane: THREE.Plane

    constructor(renderer: ThreeRenderer) {
        this.renderer = renderer
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0) // Plane at Z=0 normal facing Camera

        this.renderer.renderer.domElement.addEventListener('click', (e) => this.handleClick(e))
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

    public clear() {
        this.lastClick = null
    }
}
