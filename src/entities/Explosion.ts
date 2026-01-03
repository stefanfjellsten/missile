import * as THREE from 'three'
import { Entity } from './Entity'
import { Config } from '../game/Config'

interface Particle {
    velocity: THREE.Vector3
}

export class Explosion implements Entity {
    public mesh: THREE.Points
    public isAlive: boolean = true
    public x: number
    public y: number
    public radius: number = 0

    private particles: Particle[] = []
    private maxLifetime: number = 60
    private lifetime: number = 0

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        // Maintain logical max radius for collision from Config if possible, 
        // or just approximate it. Legacy was Config.EXPLOSION_RADIUS (e.g. 30-50).

        const particleCount = 400
        const geometry = new THREE.BufferGeometry()
        const positions = []
        const colors = []

        const color = new THREE.Color(Config.COLORS.EXPLOSION || 0xffaa00) // Fallback if config issues

        for (let i = 0; i < particleCount; i++) {
            positions.push(0, 0, 0) // Start at center relative to mesh

            // Randomize color slightly?
            colors.push(color.r, color.g, color.b)

            // Random velocity (radial burst)
            const angle = Math.random() * Math.PI * 2
            const speed = Math.random() * 3 + 1 // Fast burst
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

        this.mesh = new THREE.Points(geometry, material)
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
            this.radius += 3
        } else if (this.lifetime > 40) {
            this.radius -= 1
        }
        if (this.radius < 0) this.radius = 0


        // Particle Update
        const positions = this.mesh.geometry.attributes.position.array as Float32Array

        // Fade out
        (this.mesh.material as THREE.PointsMaterial).opacity = 1 - (this.lifetime / this.maxLifetime)

        for (let i = 0; i < this.particles.length; i++) {
            const v = this.particles[i].velocity

            // Move
            positions[i * 3] += v.x
            positions[i * 3 + 1] += v.y
            positions[i * 3 + 2] += v.z // Still 0

            // Drag / Deceleration
            v.multiplyScalar(0.92)
        }

        this.mesh.geometry.attributes.position.needsUpdate = true
    }
}
