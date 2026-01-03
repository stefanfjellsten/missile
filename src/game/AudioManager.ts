import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'

export class AudioManager {
    private isMuted: boolean = false
    private sampler: Tone.Sampler
    private synth: Tone.PolySynth
    private explosionSynth: Tone.NoiseSynth

    constructor() {
        // Initialize Piano Sampler
        this.sampler = new Tone.Sampler({
            urls: {
                A0: "A0.mp3",
                C1: "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                A1: "A1.mp3",
                C2: "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                A2: "A2.mp3",
                C3: "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                A3: "A3.mp3",
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
                C5: "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                A5: "A5.mp3",
                C6: "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                A6: "A6.mp3",
                C7: "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                A7: "A7.mp3",
                C8: "C8.mp3"
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/"
        }).toDestination()

        // Simple synth for shooting
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "square" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination()
        this.synth.volume.value = -10

        // Noise synth for explosions
        this.explosionSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.005, decay: 0.5, sustain: 0.5 }
        }).toDestination()
        this.explosionSynth.volume.value = -5
    }

    public async resume() {
        await Tone.start()
    }

    public playShoot() {
        if (this.isMuted) return
        this.resume()
        this.synth.triggerAttackRelease("A4", "64n")
        // Pitch drop effect manually? 
        // Tone's simple synth doesn't do frequency ramp easily on trigger. 
        // For KISS we just use a short blip. 
    }

    public playExplosion() {
        if (this.isMuted) return
        this.resume()
        this.explosionSynth.triggerAttackRelease("8n")
    }

    public async playMidi(url: string) {
        if (this.isMuted) return
        await this.resume()

        try {
            const midi = await Midi.fromUrl(url)

            // Wait for sampler to load? 
            await Tone.loaded()

            const now = Tone.now() + 0.5

            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    this.sampler.triggerAttackRelease(
                        note.name,
                        note.duration,
                        now + note.time,
                        note.velocity
                    )
                })
            })
        } catch (e) {
            console.error('Failed to load MIDI', e)
        }
    }

    public stopMusic() {
        // Stop all transport? We managed time manually.
        // To stop, we'd need to cancel scheduled events or disconnect sampler.
        // Tone.Transport.stop() if we used transport.
        // Since we used manual scheduling on Context time, we can't easily "stop" 
        // sounds that are already scheduled in the future in WebAudio without 
        // keeping track of AudioBufferSourceNodes, which Sampler abstracts away.

        // However, Tone.Transport allows scheduling.
        // Let's refactor to use Tone.Transport for easier stopping if needed.
        // But for KISS, and since we just want background music, maybe OK.

        // Actually, we can just dispose and recreate sampler if we really need to stop hard.
        // Or set volume to -Infinity.

        // Let's use Tone.Transport for better control
    }
}
