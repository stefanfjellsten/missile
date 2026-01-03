import * as THREE from 'three'

export interface Entity {
    update(): void
    mesh: THREE.Object3D
    isAlive: boolean
}
