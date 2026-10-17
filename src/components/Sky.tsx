import type { CSSProperties } from 'react'
import { clock24 } from '../game/logic'
import { moonPhaseName, type SkyState } from '../game/sky'
import { CloudSprite, MoonSprite, SunSprite } from './Sprites'

/** Position along the sky arc: rises bottom-left, peaks near the top, sets bottom-right. */
function arc(progress: number): CSSProperties {
  return { left: `${6 + progress * 88}%`, top: `${64 - Math.sin(Math.PI * progress) * 56}vh` }
}

export function Sky({ sky }: { sky: SkyState }) {
  const sunUp = sky.phase !== 'night'
  return (
    <div className={`sky sky-${sky.phase}`} aria-hidden="true">
      <div className="stars" />
      {sunUp ? (
        <div className="celestial sun" style={arc(sky.sunProgress)}>
          <SunSprite scale={6} />
        </div>
      ) : (
        <div className="celestial moon" style={arc(sky.moonProgress)}>
          <MoonSprite phase={sky.moonPhase} scale={6} />
        </div>
      )}
      {sunUp && (
        <div className="clouds">
          <CloudSprite className="cloud c1" />
          <CloudSprite className="cloud c2" scale={4} />
          <CloudSprite className="cloud c3" scale={5} />
        </div>
      )}
      <div className="castle" />
    </div>
  )
}

/** Mini sky window for the HUD, so the time of day is visible even where panels cover the background. */
export function SkyDial({ sky }: { sky: SkyState }) {
  const sunUp = sky.phase !== 'night'
  const p = sunUp ? sky.sunProgress : sky.moonProgress
  const label = [
    sky.phase[0].toUpperCase() + sky.phase.slice(1),
    sky.sunrise && sky.sunset ? `Sunrise ${clock24(sky.sunrise)} · Sunset ${clock24(sky.sunset)}` : null,
    moonPhaseName(sky.moonPhase),
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className={`sky-dial sky-${sky.phase}`} title={label} aria-label={label} role="img">
      <span className="dial-body" style={{ left: `${8 + p * 84}%`, bottom: `${8 + Math.sin(Math.PI * p) * 52}%` }}>
        {sunUp ? <SunSprite scale={1.5} /> : <MoonSprite phase={sky.moonPhase} scale={1.5} />}
      </span>
      <span className="dial-ground" />
    </div>
  )
}
