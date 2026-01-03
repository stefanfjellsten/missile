import * as THREE from 'three'
import { Entity } from './Entity'


export class Silo implements Entity {
    public mesh: THREE.Group
    public isAlive: boolean = true

    private turret: THREE.Mesh
    private base: THREE.Mesh

    constructor(x: number, y: number) {
        this.mesh = new THREE.Group()
        this.mesh.position.set(x, y, 0)

        // Base (Dome)
        const baseGeo = new THREE.SphereGeometry(15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 })
        this.base = new THREE.Mesh(baseGeo, baseMat)
        this.base.rotation.x = -Math.PI / 2 // Flat on ground? Sphere logic check..
        // SphereGeometry(radius, wSeg, hSeg, phiStart, phiLength, thetaStart, thetaLength)
        // Default is full sphere. 
        // 0-PI/2 thetaLength gives top half. 
        // No rotation needed if Y is up.
        this.base.geometry = new THREE.SphereGeometry(15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
        this.mesh.add(this.base)

        // Turret (Cylinder)
        const turretGeo = new THREE.CylinderGeometry(3, 5, 30)
        // Pivot point needs to be at bottom of cylinder.
        turretGeo.translate(0, 15, 0) // Shift up so origin is at bottom
        const turretMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
        this.turret = new THREE.Mesh(turretGeo, turretMat)
        this.mesh.add(this.turret)
    }

    update() {
        // Rotation handled by lookAt controller in Game or internal method
    }

    public pointAt(targetX: number, targetY: number) {
        // Calculate angle
        // Turret is at this.mesh.position (World 0,0 relative to group)
        // But group is at x,y. 
        // Target is in World space.

        const dx = targetX - this.mesh.position.x
        const dy = targetY - this.mesh.position.y

        // Atan2 gives angle from positive X axis (Right). 
        // 0 rad = Right. PI/2 = Up.
        // Turret default (Cylinder) is Vertical (Y-up) ?
        // Cylinder Geometry default is along Y axis. 
        // So 0 rotation = Up.

        // Angle of vector from vertical Y axis?
        // Vector (0,1) is angle 0.
        // Vector (1,0) is angle -PI/2 (Right) or +PI/2?

        const angle = Math.atan2(dy, dx)
        // if dx=1, dy=0 (Right), angle=0.
        // if dx=0, dy=1 (Up), angle=PI/2.

        // Turret is Up. We want to rotate around Z axis.
        // Rotation Z=0 is Up.
        // Rotation Z requires -PI/2 to point right?
        // Yes, rotate Z -90deg (-PI/2) -> Right.

        this.turret.rotation.z = angle - Math.PI / 2
    }

    public getTipPosition(): { x: number, y: number } {
        // We need world position of the tip
        // Tip is local (0, 30, 0) rotated by turret rotation, translated by mesh position.

        const tipLocal = new THREE.Vector3(0, 30, 0)
        tipLocal.applyEuler(this.turret.rotation)
        tipLocal.add(this.mesh.position)

        return { x: tipLocal.x, y: tipLocal.y }
    }
}
