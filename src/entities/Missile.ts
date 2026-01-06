import * as THREE from 'three'
import { Entity } from './Entity'
import { Config, PowerUpType } from '../game/Config'
import { Trail } from './Trail'

export class Missile implements Entity {
    public mesh: THREE.Group
    public trail: Trail
    public isAlive: boolean = true
    public isEnemy: boolean
    public powerUpType: PowerUpType = PowerUpType.NONE
    public killedByExplosion: boolean = false
    public health: number = 1
    public maxHealth: number = 1
    public isBoss: boolean = false

    private targetX: number
    private targetY: number
    private speed: number
    public lockedTarget: Missile | null = null
    public vx: number = 0
    public vy: number = 0

    // Track position for logic
    public x: number
    public y: number

    constructor(startX: number, startY: number, targetX: number, targetY: number, isEnemy: boolean, model?: THREE.Group, lockedTarget?: Missile) {
        this.x = startX
        this.y = startY
        this.targetX = targetX
        this.targetY = targetY
        this.isEnemy = isEnemy
        this.speed = isEnemy ? Config.MISSILE_SPEED : Config.PLAYER_MISSILE_SPEED

        if (isEnemy && Math.random() < 0.1) {
            const r = Math.random()
            if (r < 0.33) this.powerUpType = PowerUpType.BIG_BLAST
            else if (r < 0.66) this.powerUpType = PowerUpType.RAIL_GUN
            else this.powerUpType = PowerUpType.HEAT_SEEKER
        }

        if (isEnemy && Math.random() < 0.05) { // 5% chance for Boss
            this.isBoss = true
            this.health = 3
            this.maxHealth = 3
        }

        if (lockedTarget) {
            this.lockedTarget = lockedTarget
        }

        this.trail = new Trail()
        this.mesh = new THREE.Group()

        if (isEnemy && model) {
            const m = model.clone()
            if (this.isBoss) {
                m.scale.set(1.5, 1.5, 1.5) // big boss
            } else {
                m.scale.set(0.75, 0.75, 0.75)
            }
            m.rotation.set(0, Math.PI / 2, Math.PI / 2)
            this.mesh.add(m)

            if (this.powerUpType !== PowerUpType.NONE) {
                // Color the missile itself
                let color = 0xff00ff // default magenta
                if (this.powerUpType === PowerUpType.BIG_BLAST) color = 0x00ffff
                if (this.powerUpType === PowerUpType.HEAT_SEEKER) color = 0xffaa00 // Orange
                m.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Create a new material to avoid affecting other instances
                        const newMat = new THREE.MeshBasicMaterial({
                            color: color,
                            map: (child.material as THREE.MeshBasicMaterial).map // Preserve texture if any, though color will tint it
                        })
                        child.material = newMat
                    }
                })
            }
        } else {
            const color = isEnemy ? Config.COLORS.MISSILE_ENEMY : Config.COLORS.MISSILE_PLAYER
            const geometry = new THREE.SphereGeometry(2, 8, 8)
            const material = new THREE.MeshBasicMaterial({ color })
            const sphere = new THREE.Mesh(geometry, material)
            this.mesh.add(sphere)
        }

        if (isEnemy && model) {
            // Enemy start velocity (just for reference, they use targetX/Y lerp currently)
        } else {
            // Player missile velocity init
            const dx = targetX - startX
            const dy = targetY - startY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const dSafe = dist > 0 ? dist : 1
            this.vx = (dx / dSafe) * this.speed
            this.vy = (dy / dSafe) * this.speed
        }

        this.mesh.position.set(this.x, this.y, 0)
        this.mesh.up.set(0, 0, 1) // Fix for 2D lookAt singularity
        if (isEnemy && model) {
            this.mesh.lookAt(targetX, targetY, 0)
        }
    }

    update(dt: number) {
        const speed = this.speed * dt
        // Heat Seeker Logic (Player Only for now)
        if (!this.isEnemy && this.powerUpType === PowerUpType.HEAT_SEEKER) {
            // Update Target if locked
            if (this.lockedTarget) {
                if (this.lockedTarget.isAlive) {
                    this.targetX = this.lockedTarget.x
                    this.targetY = this.lockedTarget.y
                } else {
                    // Target died, keep going to last known pos logic? 
                    // Actually Game.ts will re-assign target.
                    // If no target, we just fly straight or towards last targetX/Y.
                    this.lockedTarget = null
                }
            }

            // Steering
            const desiredVx = this.targetX - this.x
            const desiredVy = this.targetY - this.y
            const dist = Math.sqrt(desiredVx * desiredVx + desiredVy * desiredVy)
            const distSafe = dist > 0 ? dist : 1

            // Allow turning
            const turnFactor = 0.05 * dt // Smoother turning scaled by dt

            // Normalize desired and scale to max speed
            const normDesVx = (desiredVx / distSafe) * this.speed
            const normDesVy = (desiredVy / distSafe) * this.speed

            // Lerp current velocity towards desired
            this.vx += (normDesVx - this.vx) * turnFactor
            this.vy += (normDesVy - this.vy) * turnFactor

            // Re-normalize to ensure constant speed (don't slow down)
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
            const speedSafe = currentSpeed > 0 ? currentSpeed : 1
            this.vx = (this.vx / speedSafe) * this.speed
            this.vy = (this.vy / speedSafe) * this.speed

            // Move
            this.x += this.vx * dt
            this.y += this.vy * dt

            // Rotate mesh to face velocity
            const angle = Math.atan2(this.vy, this.vx)
            // Sphere doesn't rotate visibly unless we add something, but whatever
            // If we used a missile model for player, we'd do:
            this.mesh.rotation.z = angle - Math.PI / 2

            // Bounds check for cleanup
            if (this.y > 1000 || this.y < -1000 || this.x > 2000 || this.x < -2000) {
                this.isAlive = false
            }

            // Detonate on target proximity
            if (this.lockedTarget && dist < this.speed * 1.5) { // speed is raw per-frame speed, so keep comparison roughly same
                this.isAlive = false
            }

        } else {
            // Standard Logic (Lerp to target)
            if (this.lockedTarget && this.lockedTarget.isAlive) {
                this.targetX = this.lockedTarget.x
                this.targetY = this.lockedTarget.y
            }

            const dx = this.targetX - this.x
            const dy = this.targetY - this.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < speed) {
                this.x = this.targetX
                this.y = this.targetY
                this.isAlive = false
            } else {
                this.x += (dx / distance) * speed
                this.y += (dy / distance) * speed
            }
        }

        // Emit trail logic (shared/adjusted)
        // Recalculate velocity vector for trail if we are in standard mode
        let vx = this.vx
        let vy = this.vy
        if (this.isEnemy || this.powerUpType !== PowerUpType.HEAT_SEEKER) {
            const dx = this.targetX - this.x
            const dy = this.targetY - this.y
            const d = Math.sqrt(dx * dx + dy * dy)
            const ds = d > 0 ? d : 1
            vx = (dx / ds)
            vy = (dy / ds) // normalized
        } else {
            // Heat seeker vx/vy are already set but not normalized 1
            const s = Math.sqrt(vx * vx + vy * vy)
            const ss = s > 0 ? s : 1
            vx /= ss
            vy /= ss
        }

        // Emit trail from tail
        // Offset depends on model: Enemy uses long 3D model (scaled 0.75 -> ~65), Player uses small sphere (2)
        const offset = this.isEnemy ? 65 : 2
        const xOffset = this.isEnemy ? -2.0 : 0 // Fine tune 3D model x-offset

        this.trail.emit(this.x - vx * offset + xOffset, this.y - vy * offset, 0)
        this.trail.update(dt)

        this.mesh.position.set(this.x, this.y, 0)
    }


    public checkCollision(cx: number, cy: number, radius: number): boolean {
        // Simple point check for player
        if (!this.isEnemy) {
            const dx = this.x - cx
            const dy = this.y - cy
            return (dx * dx + dy * dy) < (radius * radius)
        }

        // Segment check for enemy
        const dx = this.targetX - this.x
        const dy = this.targetY - this.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const distSafe = len > 0 ? len : 1
        const vx = dx / distSafe
        const vy = dy / distSafe

        // Segment from Head(x,y) to Tail
        // Length of missile approx 65
        const missileLen = 65
        const tailX = this.x - vx * missileLen
        const tailY = this.y - vy * missileLen

        // Vector from Tail to Head
        const segX = this.x - tailX
        const segY = this.y - tailY
        // Vector from Tail to Circle Center
        const ptX = cx - tailX
        const ptY = cy - tailY

        const segLenSq = segX * segX + segY * segY
        if (segLenSq <= 0) return false

        // Project point onto line, clamped 0..1
        let t = (ptX * segX + ptY * segY) / segLenSq
        t = Math.max(0, Math.min(1, t))

        // Closest point on segment
        const closestX = tailX + t * segX
        const closestY = tailY + t * segY

        const distX = cx - closestX
        const distY = cy - closestY

        return (distX * distX + distY * distY) < (radius * radius)
    }

    public takeDamage(): boolean {
        this.health--
        return this.health <= 0
    }
}
