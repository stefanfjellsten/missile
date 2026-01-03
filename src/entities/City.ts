import * as THREE from 'three'
import { Entity } from './Entity'
import { Config } from '../game/Config'

export class City implements Entity {
    public mesh: THREE.Mesh
    public isAlive: boolean = true

    constructor(x: number) {
        const geometry = new THREE.BoxGeometry(30, 20, 30)
        const material = new THREE.MeshLambertMaterial({ color: Config.COLORS.CITY })
        this.mesh = new THREE.Mesh(geometry, material)

        // Position in 3D space
        // x is passed from Game logic (screen coordinates approx)
        // We need to map it or just use it if we share the coordinate system
        this.mesh.position.set(x, 10, 0)
    }

    update() {
        if (!this.isAlive) {
            this.mesh.visible = false
        }
    }
}
