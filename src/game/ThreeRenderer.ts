import * as THREE from 'three'

export class ThreeRenderer {
    public scene: THREE.Scene
    public camera: THREE.PerspectiveCamera
    public renderer: THREE.WebGLRenderer

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x111111)

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.camera.position.z = 500
        this.camera.position.y = 250 // Look a bit down
        this.camera.lookAt(0, 0, 0)

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
        directionalLight.position.set(100, 100, 100)
        this.scene.add(directionalLight)

        window.addEventListener('resize', () => this.resize())
    }

    private resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    public render() {
        this.renderer.render(this.scene, this.camera)
    }

    // Helper to add/remove objects
    public add(object: THREE.Object3D) {
        this.scene.add(object)
    }

    public remove(object: THREE.Object3D) {
        this.scene.remove(object)
    }

    public get width() {
        return window.innerWidth
    }

    public get height() {
        return window.innerHeight
    }
}
