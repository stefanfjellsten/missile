import * as THREE from 'three'

export class Trail {
    public mesh: THREE.Points
    private particleCount: number = 200
    private positions: Float32Array
    private colors: Float32Array
    private lifetimes: Float32Array
    private velocities: Float32Array // x, y, z flattened
    private head: number = 0

    constructor() {
        const geometry = new THREE.BufferGeometry()

        this.positions = new Float32Array(this.particleCount * 3)
        this.colors = new Float32Array(this.particleCount * 3)
        this.lifetimes = new Float32Array(this.particleCount)
        this.velocities = new Float32Array(this.particleCount * 3)

        // Initialize invisible
        for (let i = 0; i < this.particleCount; i++) {
            this.lifetimes[i] = 0
            this.positions[i * 3] = 0
            this.positions[i * 3 + 1] = 0
            this.positions[i * 3 + 2] = 0
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
        // We can pass size as attribute if using custom shader, but PointsMaterial uses global size 
        // or size attenuation. standard PointsMaterial doesn't support per-vertex size easily without ShaderMaterial.
        // Let's stick to standard PointsMaterial and Alpha fade for now. 
        // Or use vertex colors to fade to black.

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })

        this.mesh = new THREE.Points(geometry, material)
        this.mesh.frustumCulled = false // Always render
    }

    public emit(x: number, y: number, z: number) {
        // Emit 2 particles per frame for density
        for (let k = 0; k < 2; k++) {
            const i = this.head
            this.head = (this.head + 1) % this.particleCount

            this.positions[i * 3] = x + (Math.random() - 0.5) * 1
            this.positions[i * 3 + 1] = y + (Math.random() - 0.5) * 1
            this.positions[i * 3 + 2] = z + (Math.random() - 0.5) * 1

            // Random spread velocity (spark)
            this.velocities[i * 3] = (Math.random() - 0.5) * 0.5
            this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5
            this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5

            this.lifetimes[i] = 1.0 // Normalized life 1.0 -> 0.0

            // Start Color (White/Yellow)
            this.colors[i * 3] = 1
            this.colors[i * 3 + 1] = 1
            this.colors[i * 3 + 2] = 0.5
        }
    }

    public update() {
        let activeCount = 0
        const positions = this.mesh.geometry.attributes.position.array as Float32Array
        const colors = this.mesh.geometry.attributes.color.array as Float32Array

        for (let i = 0; i < this.particleCount; i++) {
            if (this.lifetimes[i] > 0) {
                activeCount++
                this.lifetimes[i] -= 0.05 // Decay rate

                if (this.lifetimes[i] <= 0) {
                    this.lifetimes[i] = 0
                    // Move out of view
                    positions[i * 3] = 99999
                    continue
                }

                // Move
                positions[i * 3] += this.velocities[i * 3]
                positions[i * 3 + 1] += this.velocities[i * 3 + 1]
                positions[i * 3 + 2] += this.velocities[i * 3 + 2]

                // Color Evolution: Yellow -> Red -> Dark
                const life = this.lifetimes[i]
                if (life > 0.5) {
                    // White/Yellow
                    colors[i * 3] = 1
                    colors[i * 3 + 1] = life // Fade green channel: 1->0.5 (Yellow -> Orange)
                    colors[i * 3 + 2] = 0
                } else {
                    // Orange -> Red -> Fade
                    colors[i * 3] = life * 2 // Fade Red
                    colors[i * 3 + 1] = 0
                    colors[i * 3 + 2] = 0
                }
            }
        }

        this.mesh.geometry.attributes.position.needsUpdate = true
        this.mesh.geometry.attributes.color.needsUpdate = true
    }

    public isEmpty(): boolean {
        // Check if any particle is alive
        for (let i = 0; i < this.particleCount; i++) {
            if (this.lifetimes[i] > 0) return false
        }
        return true
    }
}
