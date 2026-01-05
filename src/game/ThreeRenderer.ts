import * as THREE from 'three'

export class ThreeRenderer {
    public scene: THREE.Scene
    public camera: THREE.OrthographicCamera
    public renderer: THREE.WebGLRenderer

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x111111)

        // Ortho size: Let's fix height to 1000 units? Or dynamic.
        // Let's match roughly the visible area we had at Z=600 with FOV 75.
        // Height ~ 2 * tan(75/2) * 600 = ~920
        const frustumSize = 1000
        const aspect = window.innerWidth / window.innerHeight
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            2000
        )
        this.camera.position.z = 600
        this.camera.position.y = 0
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
        const frustumSize = 1000
        const aspect = window.innerWidth / window.innerHeight

        this.camera.left = -frustumSize * aspect / 2
        this.camera.right = frustumSize * aspect / 2
        this.camera.top = frustumSize / 2
        this.camera.bottom = -frustumSize / 2

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
