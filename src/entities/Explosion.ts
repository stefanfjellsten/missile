import * as THREE from 'three'
import { Entity } from './Entity'


interface Particle {
    velocity: THREE.Vector3
}

export class Explosion implements Entity {
    public mesh: THREE.Group
    public isAlive: boolean = true
    public x: number
    public y: number
    public radius: number = 0

    private particles: Particle[] = []
    private points: THREE.Points
    private shockwave: THREE.Mesh
    private maxLifetime: number = 60
    private lifetime: number = 0

    private radiusMultiplier: number = 1

    constructor(x: number, y: number, radiusMultiplier: number = 1) {
        this.x = x
        this.y = y
        this.radiusMultiplier = radiusMultiplier
        // Maintain logical max radius for collision from Config if possible, 
        // or just approximate it. Legacy was Config.EXPLOSION_RADIUS (e.g. 30-50).

        const particleCount = 400 * radiusMultiplier
        const geometry = new THREE.BufferGeometry()
        const positions = []
        const colors = []



        for (let i = 0; i < particleCount; i++) {
            positions.push(0, 0, 0) // Start at center relative to mesh

            // Start white/yellow
            // We'll update colors in loop but init here
            colors.push(1, 1, 0.8)

            // Random velocity (radial burst)
            const angle = Math.random() * Math.PI * 2
            const speed = (Math.random() * 4 + 2) * radiusMultiplier // Faster burst
            const vx = Math.cos(angle) * speed
            const vy = Math.sin(angle) * speed

            this.particles.push({
                velocity: new THREE.Vector3(vx, vy, 0)
            })
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

        const material = new THREE.PointsMaterial({
            size: 1, // Visible size
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending // Optional, looks cool for explosions
        })

        this.points = new THREE.Points(geometry, material)

        // Shockwave
        const swGeo = new THREE.SphereGeometry(1, 32, 32)
        const swMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.1,
            depthWrite: false, // Don't block particles
            blending: THREE.AdditiveBlending
        })
        this.shockwave = new THREE.Mesh(swGeo, swMat)
        // Hide initially until non-zero
        this.shockwave.visible = false

        this.mesh = new THREE.Group()
        this.mesh.add(this.points)
        this.mesh.add(this.shockwave)
        this.mesh.position.set(x, y, 0)
    }

    update() {
        this.lifetime++
        if (this.lifetime > this.maxLifetime) {
            this.isAlive = false
            return
        }

        // Logic Radius update (fade in/out for collision)
        // Simulate the previous expanding sphere logic roughly
        if (this.lifetime < 10) {
            this.radius += 3 * this.radiusMultiplier
        } else if (this.lifetime > 40) {
            this.radius -= 1
        }
        if (this.radius < 0) this.radius = 0

        // Update Shockwave
        if (this.radius > 0) {
            this.shockwave.visible = true
            this.shockwave.scale.set(this.radius, this.radius, this.radius)
            // Fade shockwave faster
            const opacity = Math.max(0, 0.2 * (1 - this.lifetime / this.maxLifetime))
                ; (this.shockwave.material as THREE.MeshBasicMaterial).opacity = opacity
        }


        // Particle Update
        const positions = this.points.geometry.attributes.position.array as Float32Array
        const colors = this.points.geometry.attributes.color.array as Float32Array

        // Fade out slightly less aggressive to keep visibility
        (this.points.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - (this.lifetime / this.maxLifetime))

        for (let i = 0; i < this.particles.length; i++) {
            const v = this.particles[i].velocity

            // Gravity
            v.y -= 0.05

            // Move
            positions[i * 3] += v.x
            positions[i * 3 + 1] += v.y

            // Drag
            v.multiplyScalar(0.95)

            // Color Evolution: White -> Yellow -> Red -> Dark
            const t = this.lifetime / this.maxLifetime
            let r = 1, g = 1, b = 1

            if (t < 0.2) {
                // White to Yellow
                r = 1; g = 1; b = 1 - (t / 0.2) * 0.5; // b 1->0.5
            } else if (t < 0.5) {
                // Yellow to Orange
                r = 1; g = 1 - ((t - 0.2) / 0.3); b = 0;
                // g 1->0
            } else {
                // Orange to Red/Dark
                r = 1; g = 0; b = 0;
                // Maybe fade to gray? user wants fire. Red is fine.
                // Let opacity handle fade.
                r = 1 - ((t - 0.5) / 0.5); // Red fade
            }
            colors[i * 3] = r
            colors[i * 3 + 1] = g
            colors[i * 3 + 2] = b
        }

        this.points.geometry.attributes.position.needsUpdate = true
        this.points.geometry.attributes.color.needsUpdate = true
    }
}
