// Tiny chiptune synth: square-wave notes through WebAudio, no audio files needed.

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type Note = [freq: number, beats: number]

function play(notes: Note[], tempo = 0.09, type: OscillatorType = 'square') {
  const ac = audio()
  if (!ac) return
  let t = ac.currentTime + 0.02
  for (const [freq, beats] of notes) {
    const dur = beats * tempo
    if (freq > 0) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95)
      osc.connect(gain).connect(ac.destination)
      osc.start(t)
      osc.stop(t + dur)
    }
    t += dur
  }
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, D5 = 587.33, A5 = 880, B5 = 987.77, G4 = 392

export const sfx = {
  click: () => play([[880, 0.5]], 0.06),
  start: () => play([[G4, 1], [C5, 1], [G5, 2]], 0.07),
  victory: () => play([[C5, 1], [E5, 1], [G5, 1], [C6, 3], [0, 1], [A5, 1], [B5, 1], [C6, 4]], 0.09),
  levelUp: () => play([[C5, 1], [D5, 1], [E5, 1], [G5, 1], [C6, 1], [E5, 1], [G5, 1], [C6, 6]], 0.07),
  breakOver: () => play([[G5, 1], [0, 1], [G5, 1], [0, 1], [C6, 3]], 0.1, 'triangle'),
  buy: () => play([[B5, 1], [E5 * 2, 3]], 0.07),
  /** Call from a user gesture so later sounds are allowed to play. */
  unlock: () => void audio(),
}
