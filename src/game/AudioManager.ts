import { Midi } from '@tonejs/midi'

export class AudioManager {
    private audioCtx: AudioContext
    private isMuted: boolean = false
    private activeNodes: AudioScheduledSourceNode[] = []

    constructor() {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Resume context on user interaction (browser policy)
    public resume() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume()
        }
    }

    public playShoot() {
        if (this.isMuted) return
        this.resume() // ensure context is running

        const osc = this.audioCtx.createOscillator()
        const gainNode = this.audioCtx.createGain()

        osc.connect(gainNode)
        gainNode.connect(this.audioCtx.destination)

        osc.type = 'square'
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(110, this.audioCtx.currentTime + 0.1)

        gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1)

        osc.start()
        osc.stop(this.audioCtx.currentTime + 0.1)
    }

    public playExplosion() {
        if (this.isMuted) return
        this.resume()

        const bufferSize = this.audioCtx.sampleRate * 0.5 // 0.5 seconds
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1
        }

        const noise = this.audioCtx.createBufferSource()
        noise.buffer = buffer

        // Filter to make it sound more like an explosion (lowpass)
        const filter = this.audioCtx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 1000

        const gainNode = this.audioCtx.createGain()

        noise.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(this.audioCtx.destination)

        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5)

        noise.start()
    }

    public async playMidi(url: string) {
        if (this.isMuted) return
        this.resume()

        try {
            const midi = await Midi.fromUrl(url)
            const now = this.audioCtx.currentTime + 0.5 // small buffer

            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    const osc = this.audioCtx.createOscillator()
                    const gain = this.audioCtx.createGain()

                    osc.connect(gain)
                    gain.connect(this.audioCtx.destination)

                    // Simple synth tone
                    osc.type = 'triangle'

                    // Midi note to frequency conversion needed?
                    // note.name is available, note.midi is available.
                    // Oscillator frequency takes Hz.
                    // note.frequency is usually available in tonejs/midi?
                    // Let's check docs or assume we calculate it.
                    // Formula: f = 440 * 2^((d - 69)/12)
                    const freq = 440 * Math.pow(2, (note.midi - 69) / 12)
                    osc.frequency.value = freq

                    gain.gain.setValueAtTime(0, now + note.time)
                    gain.gain.linearRampToValueAtTime(note.velocity * 0.1, now + note.time + 0.02)
                    gain.gain.setValueAtTime(note.velocity * 0.1, now + note.time + note.duration - 0.02)
                    gain.gain.linearRampToValueAtTime(0, now + note.time + note.duration)

                    osc.start(now + note.time)
                    osc.stop(now + note.time + note.duration)

                    this.activeNodes.push(osc)
                    osc.onended = () => {
                        const idx = this.activeNodes.indexOf(osc)
                        if (idx > -1) this.activeNodes.splice(idx, 1)
                    }
                })
            })
        } catch (e) {
            console.error('Failed to load MIDI', e)
        }
    }

    public stopMusic() {
        this.activeNodes.forEach(node => {
            try { node.stop() } catch (e) { }
        })
        this.activeNodes = []
    }
}
