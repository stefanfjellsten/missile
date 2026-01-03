import * as THREE from 'three'

export class Environment {
    public mesh: THREE.Group

    constructor(fieldWidth: number, fieldHeight: number) {
        this.mesh = new THREE.Group()

        // 1. Sky Gradient
        // We use a simple plane with vertex colors
        const skyGeo = new THREE.PlaneGeometry(fieldWidth * 2, fieldHeight * 2, 1, 1)
        const skyMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            depthWrite: false
        })

        // Define colors: Top (Dark), Bottom (Lighter/Reddish for sunset look?)
        // User asked for "darker side" (assuming fading into darkness)
        // Let's do Dark Blue/Black Top -> Purple/Dark Blue Bottom
        const topColor = new THREE.Color(0x000011)
        const bottomColor = new THREE.Color(0x220044)

        const count = skyGeo.attributes.position.count // 4 vertices
        const colors = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            // PlaneGeometry vertices order: usually TL, TR, BL, BR or similar.
            // Actually it's by row.
            // Y > 0 is top, Y < 0 is bottom
            const y = skyGeo.attributes.position.getY(i)
            const color = y > 0 ? topColor : bottomColor
            colors[i * 3] = color.r
            colors[i * 3 + 1] = color.g
            colors[i * 3 + 2] = color.b
        }
        skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const sky = new THREE.Mesh(skyGeo, skyMat)
        sky.position.z = -100
        this.mesh.add(sky)

        // 2. Stars
        const starsGeo = new THREE.BufferGeometry()
        const starCount = 300
        const starPos = []
        const starColors = []

        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * fieldWidth * 1.5
            const y = (Math.random() - 0.5) * fieldHeight * 1.5
            const z = -50 // between sky and game
            starPos.push(x, y, z)

            // Twinkle? Static for now.
            const br = Math.random()
            starColors.push(br, br, br)
        }
        starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
        starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3))

        const starsMat = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        })
        const stars = new THREE.Points(starsGeo, starsMat)
        this.mesh.add(stars)

        // 3. Ground
        const groundHeight = 1000 // Deep enough to cover bottom regardless of tilt
        const groundGeo = new THREE.PlaneGeometry(fieldWidth * 2, groundHeight)
        const groundMat = new THREE.MeshBasicMaterial({ color: 0x228b22 }) // Forest Green
        const ground = new THREE.Mesh(groundGeo, groundMat)

        // Position top edge at the entity Y level (-fieldHeight/2 + 10)
        // Entity Y is center of entity? No, usually base.
        // Game sets entity Y to -fieldHeight/2 + 10.
        // If we assume that's "ground level", then ground top should be there.
        // Mesh center Y = Top - Height/2
        // Center Y = (-fieldHeight/2 + 10) - (groundHeight / 2)
        ground.position.y = (-fieldHeight / 2 + 10) - (groundHeight / 2)
        ground.position.z = -10
        this.mesh.add(ground)
    }
}
