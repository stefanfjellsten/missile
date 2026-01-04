import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'

export class AudioManager {
    private isMuted: boolean = false
    private sampler: Tone.Sampler
    private synth: Tone.PolySynth
    private explosionSynth: Tone.NoiseSynth
    private playbackState: 'stopped' | 'playing' = 'stopped'
    private midiPart: Tone.Part | null = null
    private lastAudioTime: number = 0

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
        Tone.Destination.mute = false
    }

    public playShoot() {
        if (this.isMuted) return
        this.resume()
        // Add small lookahead to prevent "start time < previous" errors
        // Ensure strictly increasing start time
        let now = Tone.now() + 0.05
        if (now <= this.lastAudioTime) {
            now = this.lastAudioTime + 0.01
        }
        this.lastAudioTime = now

        this.synth.triggerAttackRelease("A4", "64n", now)
    }

    public playExplosion() {
        if (this.isMuted) return
        this.resume()

        let now = Tone.now() + 0.05
        if (now <= this.lastAudioTime) {
            now = this.lastAudioTime + 0.01
        }
        this.lastAudioTime = now

        this.explosionSynth.triggerAttackRelease("8n", now)
    }

    public async playMidi(url: string) {
        if (this.isMuted) return
        await this.resume()

        this.playbackState = 'playing'

        try {
            const midi = await Midi.fromUrl(url)
            await Tone.loaded()

            // Check if we were stopped while loading
            if ((this.playbackState as string) === 'stopped') {
                return
            }

            // Start freshly
            Tone.Transport.stop()

            // Collect all notes
            const notes: any[] = []
            midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    notes.push({
                        time: note.time,
                        note: note.name,
                        duration: note.duration,
                        velocity: note.velocity
                    })
                })
            })

            // Create Part
            if (this.midiPart) {
                this.midiPart.dispose()
            }

            this.midiPart = new Tone.Part((time, value) => {
                this.sampler.triggerAttackRelease(
                    value.note,
                    value.duration,
                    time,
                    value.velocity
                )
            }, notes).start(0)

            if (this.playbackState === 'playing') {
                Tone.Transport.start()
                console.log('Music started')
            }

        } catch (e) {
            console.error('Failed to load MIDI', e)
        }
    }

    public stopMusic() {
        this.playbackState = 'stopped'
        Tone.Transport.stop()
        if (this.midiPart) {
            this.midiPart.stop() // Redundant with Transport stop but good practice
            this.midiPart.dispose()
            this.midiPart = null
        }
        this.sampler.releaseAll()
    }
}
