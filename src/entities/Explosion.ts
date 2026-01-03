import * as THREE from 'three'
import { Entity } from './Entity'
import { Config } from '../game/Config'

export class Explosion implements Entity {
    public mesh: THREE.Mesh
    public isAlive: boolean = true

    public x: number
    public y: number
    public radius: number = 0

    private maxRadius: number
    private growthRate: number
    private expanding: boolean = true

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.maxRadius = Config.EXPLOSION_RADIUS
        this.growthRate = Config.EXPLOSION_GROWTH_RATE

        const geometry = new THREE.SphereGeometry(1, 16, 16)
        const material = new THREE.MeshBasicMaterial({ color: Config.COLORS.EXPLOSION, transparent: true, opacity: 0.8 })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(x, y, 0)
    }

    update() {
        if (this.expanding) {
            this.radius += this.growthRate
            if (this.radius >= this.maxRadius) {
                this.expanding = false
            }
        } else {
            this.radius -= this.growthRate
            if (this.radius <= 0) {
                this.isAlive = false
            }
        }

        this.mesh.scale.set(this.radius, this.radius, this.radius)
    }
}
