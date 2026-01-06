import * as THREE from 'three'

export interface Entity {
    update(dt: number): void
    mesh: THREE.Object3D
    isAlive: boolean
}
