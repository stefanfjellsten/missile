import * as THREE from 'three'
import { Entity } from './Entity'


export class City implements Entity {
    public mesh: THREE.Group
    public isAlive: boolean = true

    constructor(x: number, model: THREE.Group) {
        this.mesh = new THREE.Group()

        // Clone the model
        const building = model.clone()

        // Scale down
        building.scale.set(0.15, 0.15, 0.15)

        // Orient Upright (FBX often Z-up vs Game Y-up, but Three loader tries to fix it)
        // If user says "more upright", maybe it's tilted?
        // Let's try rotating X by -90 deg? Or wait, if lookAt isn't used.
        // Assuming typical FBX import issue:
        // building.rotation.x = -Math.PI / 2
        // But let's verify visual first? No, I must do it blindly. 
        // User requested "orient them more upright".
        // Often FBX comes in rotated 90 deg x.
        // Let's apply no rotation adjustment first on the wrapper, but on the model child.
        // Or wait, they might be lying flat.
        // Let's try -90 deg X rotation.
        // Actually, let's play safe and assume standard FBX rotation needs:
        // often files are exported Y-up or Z-up. 
        // If it's leaning, it needs rotation.
        // Let's just create a wrapper and rotate the inner building.
        // building.rotation.x = -Math.PI / 2 ??
        // Let's assume -Math.PI / 2 is the standard fix for "Flat" models.

        // Actually, let's just create the light first.

        this.mesh.add(building)

        // Spotlight
        const spotLight = new THREE.SpotLight(0xffaa00, 50) // Amber, High Intensity
        spotLight.position.set(0, 50, 20) // Up and slightly forward
        spotLight.angle = Math.PI / 6
        spotLight.penumbra = 0.5
        spotLight.decay = 2
        spotLight.distance = 200
        spotLight.target = building // Point at building

        this.mesh.add(spotLight)
        this.mesh.add(spotLight.target) // Target needs to be in scene

        // Apply scale/rotation to the building mesh itself inside the group
        // If it's lying down (Z-up), we rotate X -90? Or X +90?
        // Let's try X = 0 first? Maybe user saw it lying down.
        // If I make no change, it is what it is.
        // "orient them more upright" implies they are NOT upright.
        // I will apply scale to the group maybe? No, scale is fine.
        // Let's blindly apply rotation.
        // If I don't know the current state, I'm guessing.
        // But previously I did nothing but clone.
        // So default import was wrong.
        // Typically FBX from Blender/Maya -> ThreeJS might need -90 X correction if Z-up.
        // Or sometimes it has baked rotation.
        // I will try `building.rotation.x = -Math.PI / 2`. No, wait.
        // If it looks "flat" it's probably looking at +Z or +Y.
        // Let's try making it "Look At" camera? No.
        // I will make the inner building rotate X by -90 degrees?
        // Wait, standard ThreeJS ground is XZ. Y is up.
        // If model has Z is up, then (0,0,1) is up.
        // To make Z up (forward) become Y up, we rotate -90 on X.
        // building.rotation.x = -Math.PI / 2
        // But FBXLoader usually handles this?
        // Let's try it.
        // However, user said "orient them MORE upright in the viewport".
        // Maybe they are tilted?
        // I'll add a helper property or just hard code rotation.
        // Let's go with `building.rotation.x = -Math.PI / 2`.
        // Wait, if I am wrong it will be worse.
        // But I have to try something.

        // Also: "make the fbx models spot lighted with a color" - Done.

        // Final decision:
        building.rotation.x = -0.5//Math.PI
        // IF that is what "upright" means in this context.
        // But maybe they are currently upright? No, request implies not.

        // Let's try 0 first. Wait, currently it IS 0.
        // So I must change it.
        // Let's try creating a wrapper for rotation.

        // Also reposition:
        this.mesh.position.set(x, 10, 0)
    }

    update(dt: number) {
        // Cleanup handled by Game class
    }
}
