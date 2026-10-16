import { useState, type Dispatch, type ReactNode } from 'react'
import type { DevOp } from '../game/dev'
import { formatNum, keepName } from '../game/idle'
import { formatClock } from '../game/logic'
import type { Action } from '../game/reducer'
import { normalizeSave } from '../game/storage'
import type { GameState } from '../game/types'
import type { DevMode } from './useDevMode'

const SNAPSHOT_KEY = 'studyrpg.dev.snapshot'
const SPEEDS = [1, 10, 60, 300, 1000]
const SIMULATE: [string, number][] = [
  ['25m', 25],
  ['1h', 60],
  ['4h', 240],
  ['1 day', 1440],
  ['1 week', 10080],
]

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
  dev: DevMode
  remainingMs: number
}

/** Compact button label: 1000 → 1K, 10000000 → 10M */
function short(n: number): string {
  for (const [size, suffix] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) if (n >= size) return `${n / size}${suffix}`
  return String(n)
}

function readSnapshot(): { at: number; state: unknown } | null {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function DevPanel({ state, dispatch, dev, remainingMs }: Props) {
  const [log, setLog] = useState('Ready.')
  const [level, setLevel] = useState(String(state.hero.level))
  const [snapshotAt, setSnapshotAt] = useState(() => readSnapshot()?.at ?? null)
  const { timer, idle } = state
  const running = timer.status === 'running'
  const hasSubject = state.subjects.length > 0

  const run = (dev: DevOp, message: string) => {
    dispatch({ type: 'dev', dev })
    setLog(message)
  }

  const saveSnapshot = () => {
    try {
      const at = Date.now()
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ at, state }))
      setSnapshotAt(at)
      setLog('Snapshot saved.')
    } catch {
      setLog('Could not save snapshot.')
    }
  }

  const restoreSnapshot = () => {
    const loaded = normalizeSave(readSnapshot()?.state)
    if (!loaded) return setLog('No valid snapshot.')
    dispatch({ type: 'load', state: { ...loaded, reward: null } })
    setLog('Snapshot restored.')
  }

  return (
    <aside className="dev-panel" aria-label="Developer tools">
      <header className="dev-head">
        <span>DEBUG CONSOLE</span>
        <button className="dev-x" onClick={() => dev.setOpen(false)} aria-label="Close developer tools">
          ✕
        </button>
      </header>
      <div className="dev-log" aria-live="polite">
        &gt; {log}
      </div>

      <DevSection title="Time">
        <Row label="Clock speed">
          {SPEEDS.map((s) => (
            <DevBtn key={s} on={dev.speed === s} onClick={() => (dev.setSpeed(s), setLog(`Clock speed ×${s}.`))}>
              ×{s}
            </DevBtn>
          ))}
        </Row>
        <p className="dev-note">
          {timer.status === 'idle'
            ? `${timer.phase === 'focus' ? 'Quest' : 'Rest'} not started. Speed and skips apply once it runs.`
            : `${timer.phase === 'focus' ? 'Quest' : 'Rest'} ${timer.status}: ${formatClock(remainingMs)} left`}
        </p>
        <Row label="Skip ahead">
          {[1, 5, 15].map((m) => (
            <DevBtn key={m} disabled={!running} onClick={() => run({ op: 'warp', ms: m * 60_000 }, `Skipped ${m} min.`)}>
              +{m}m
            </DevBtn>
          ))}
          <DevBtn disabled={timer.status === 'idle'} onClick={() => run({ op: 'finishPhase', now: Date.now() }, 'Phase finished.')}>
            Finish now
          </DevBtn>
        </Row>
        <Row label="Simulate study">
          {SIMULATE.map(([label, minutes]) => (
            <DevBtn
              key={label}
              disabled={!hasSubject}
              onClick={() => run({ op: 'simulate', minutes, now: Date.now(), recordId: crypto.randomUUID() }, `Simulated ${label} of study.`)}
            >
              {label}
            </DevBtn>
          ))}
        </Row>
        {!hasSubject && <p className="dev-note">Add a subject to simulate sessions.</p>}
      </DevSection>

      <DevSection title="Hero">
        <Row label={`Gold (${formatNum(state.hero.gold)})`}>
          {[100, 1_000, 10_000, 1_000_000].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'grant', gold: n }, `+${short(n)} gold.`)}>
              +{short(n)}
            </DevBtn>
          ))}
        </Row>
        <Row label="XP">
          {[100, 1_000, 10_000, 100_000].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'grant', xp: n }, `+${short(n)} XP.`)}>
              +{short(n)}
            </DevBtn>
          ))}
        </Row>
        <Row label="Level">
          <input className="dev-input" type="number" min={1} max={99} value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Level" />
          <DevBtn onClick={() => run({ op: 'setLevel', level: Number(level) || 1 }, `Level set to ${level}.`)}>Set</DevBtn>
        </Row>
        <Row label="Streak">
          {[0, 3, 6].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'setStreak', count: n, now: Date.now() }, `Streak set to ${n} days.`)}>
              {n}d
            </DevBtn>
          ))}
          <DevBtn onClick={() => run({ op: 'unlockGear' }, 'All gear added to inventory.')}>All gear</DevBtn>
        </Row>
      </DevSection>

      <DevSection title="Siege">
        <Row label={`Souls (${formatNum(idle.souls)})`}>
          {[1_000, 100_000, 10_000_000, 1_000_000_000].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'grant', souls: n }, `+${short(n)} souls.`)}>
              +{short(n)}
            </DevBtn>
          ))}
        </Row>
        <Row label="Every troop">
          {[1, 10, 100].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'addUnits', count: n }, `+${n} of every troop.`)}>
              +{n}
            </DevBtn>
          ))}
          <DevBtn onClick={() => run({ op: 'allUpgrades' }, 'All War Council upgrades owned.')}>All upgrades</DevBtn>
        </Row>
        <Row label={`Keep LV ${idle.keepLevel} ${keepName(idle.keepLevel)}`}>
          {[1, 10].map((n) => (
            <DevBtn key={n} onClick={() => run({ op: 'razeKeeps', count: n }, `Razed ${n} keep${n > 1 ? 's' : ''} (loot paid).`)}>
              Raze {n}
            </DevBtn>
          ))}
        </Row>
      </DevSection>

      <DevSection title="Snapshot">
        <Row label={snapshotAt ? `Saved ${new Date(snapshotAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'None saved'}>
          <DevBtn onClick={saveSnapshot}>Save</DevBtn>
          <DevBtn disabled={!snapshotAt} onClick={restoreSnapshot}>
            Restore
          </DevBtn>
        </Row>
        <p className="dev-note">Save before experimenting, restore to undo everything.</p>
      </DevSection>

      <footer className="dev-foot">
        <span>
          Toggle with <kbd>`</kbd> · <kbd>Esc</kbd> closes
        </span>
        {dev.canLock && (
          <button className="dev-link" onClick={dev.lock}>
            Hide dev tools
          </button>
        )}
      </footer>
    </aside>
  )
}

function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dev-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="dev-row">
      <span className="dev-label">{label}</span>
      <div className="dev-btns">{children}</div>
    </div>
  )
}

function DevBtn({ children, onClick, disabled, on }: { children: ReactNode; onClick: () => void; disabled?: boolean; on?: boolean }) {
  return (
    <button className={`dev-btn ${on ? 'on' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
