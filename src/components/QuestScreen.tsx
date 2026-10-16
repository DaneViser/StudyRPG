import { useState, type Dispatch, type FormEvent } from 'react'
import { HP_PER_MINUTE, SUBJECT_COLORS } from '../game/data'
import { simulateIdle } from '../game/idle'
import { formatClock, formatMinutes, monsterFor, nextStreak, sessionRewards } from '../game/logic'
import type { Action } from '../game/reducer'
import { sfx } from '../game/sound'
import type { GameState } from '../game/types'
import { SiegeScene } from './Siege'
import { HeroSprite, MonsterSprite } from './Sprites'

const PRESETS = [15, 25, 45, 60, 90]

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
  remainingMs: number
  now: number
}

export function QuestScreen({ state, dispatch, remainingMs, now }: Props) {
  const { timer, settings } = state
  const busy = timer.status !== 'idle'
  const isFocus = timer.phase === 'focus'

  const clock = formatClock(remainingMs)

  // Main column: battle + siege side by side with the controls, so both are visible while studying
  return (
    <div className="quest-layout">
      <div className="quest-main">
        <section className="panel stage-panel" aria-label="Battle">
          {isFocus ? <Battle state={state} remainingMs={remainingMs} now={now} /> : <Camp state={state} remainingMs={remainingMs} />}
        </section>
        <SiegePanel state={state} remainingMs={remainingMs} />
      </div>
      <div className="quest-side">
        <section className="panel timer-panel">
          <h2 className="panel-title">{isFocus ? 'Quest' : timer.phase === 'long' ? 'Save Room' : 'Rest'}</h2>
          <div className={`clock ${clock.length > 5 ? 'clock-long' : ''}`} aria-live="off">
            {clock}
          </div>
          {isFocus && !busy && <DurationPicker value={settings.focusMinutes} dispatch={dispatch} />}
          <Controls state={state} dispatch={dispatch} />
        </section>
        <SubjectPicker state={state} dispatch={dispatch} locked={busy && isFocus} />
      </div>
    </div>
  )
}

function SubjectPicker({ state, dispatch, locked }: { state: GameState; dispatch: Dispatch<Action>; locked: boolean }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length])

  const add = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({ type: 'addSubject', id: crypto.randomUUID(), name: trimmed, color })
    setName('')
    setColor(SUBJECT_COLORS[(state.subjects.length + 1) % SUBJECT_COLORS.length])
  }

  return (
    <section className="panel subject-panel">
      <h2 className="panel-title">Choose Quest</h2>
      {state.subjects.length === 0 && <p className="hint">What are you studying? Add a subject to begin your adventure.</p>}
      <ul className="subject-list">
        {state.subjects.map((s) => {
          const selected = s.id === (locked ? state.timer.subjectId : state.selectedSubjectId)
          return (
            <li key={s.id}>
              <button
                className={`subject ${selected ? 'selected' : ''}`}
                disabled={locked && !selected}
                onClick={() => dispatch({ type: 'selectSubject', id: s.id })}
              >
                <span className="cursor">{selected ? '▶' : ''}</span>
                <span className="swatch" style={{ background: s.color }} />
                <span className="subject-name">{s.name}</span>
                <span className="subject-time">{formatMinutes(s.minutes)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {!locked && (
        <form className="add-subject" onSubmit={add}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New subject…" maxLength={24} aria-label="New subject name" />
          <div className="color-row" role="radiogroup" aria-label="Subject colour">
            {SUBJECT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                role="radio"
                aria-checked={c === color}
                aria-label={c}
                className={`color-dot ${c === color ? 'on' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button className="btn btn-small" type="submit" disabled={!name.trim()}>
            + Add
          </button>
        </form>
      )}
    </section>
  )
}

function Battle({ state, remainingMs, now }: { state: GameState; remainingMs: number; now: number }) {
  const { timer } = state
  const subjectId = timer.status === 'idle' ? state.selectedSubjectId : timer.subjectId
  const subject = state.subjects.find((s) => s.id === subjectId)
  const hp = timer.durationMs > 0 ? remainingMs / timer.durationMs : 1
  const running = timer.status === 'running'
  const minutes = timer.durationMs / 60_000
  const { tier, rank } = monsterFor(minutes)
  const maxHp = Math.round(minutes * HP_PER_MINUTE)
  const streak = nextStreak(state.streak, now).count
  const reward = sessionRewards(timer.durationMs / 60_000, state, streak)

  return (
    <div className={`battle menace-${tier.menace} ${running ? 'fighting' : ''} ${timer.status === 'paused' ? 'paused' : ''}`}>
      <div className="enemy-info">
        <div className="enemy-name">
          {subject ? `${subject.name} ${tier.name}` : tier.name}
          {tier.menace >= 2 && <span className="boss-tag">BOSS</span>}
        </div>
        <div className="bar bar-hp">
          <div className="bar-fill" style={{ width: `${hp * 100}%` }} />
        </div>
        <div className="enemy-meta">
          <span className="hp-num">
            HP {Math.ceil(hp * maxHp)}/{maxHp}
          </span>
          <span className="threat" aria-label={`Threat ${rank} of 6`}>
            {'★'.repeat(rank)}
            <span className="muted">{'★'.repeat(6 - rank)}</span>
          </span>
        </div>
      </div>
      <div className={`enemy-sprite ${tier.flying ? 'flying' : ''}`} key={tier.name}>
        <MonsterSprite tier={tier} color={subject?.color ?? '#666'} className="monster" />
      </div>
      <HeroSprite equipped={state.equipped} className="hero-sprite" />
      <div className="loot-preview">
        Loot: <b className="xp">+{reward.xp} XP</b> <b className="gold">+{reward.gold} G</b>
      </div>
    </div>
  )
}

function SiegePanel({ state, remainingMs }: { state: GameState; remainingMs: number }) {
  const { timer } = state
  const questing = timer.phase === 'focus' && timer.status !== 'idle'
  const elapsed = questing ? (timer.durationMs - remainingMs) / 60_000 : 0
  const live = questing ? simulateIdle(state.idle, elapsed) : null
  return (
    <section className="panel siege-panel">
      <h2 className="panel-title">The Siege</h2>
      <SiegeScene idle={live?.idle ?? state.idle} pending={live?.loot} banked={state.idle.souls} active={timer.status === 'running' && questing} />
    </section>
  )
}

function Camp({ state, remainingMs }: { state: GameState; remainingMs: number }) {
  const { timer } = state
  const pct = timer.durationMs > 0 ? 1 - remainingMs / timer.durationMs : 0
  return (
    <div className="battle camp">
      <div className="camp-text">{timer.phase === 'long' ? 'Long rest. Stretch, hydrate, walk around.' : 'Catch your breath, hero.'}</div>
      <div className="bar bar-rest">
        <div className="bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="campfire" aria-hidden="true">
        <span />
      </div>
      <HeroSprite equipped={state.equipped} className="hero-sprite resting" />
    </div>
  )
}

function DurationPicker({ value, dispatch }: { value: number; dispatch: Dispatch<Action> }) {
  const set = (n: number) => dispatch({ type: 'updateSettings', patch: { focusMinutes: Math.min(180, Math.max(1, Math.round(n))) } })
  return (
    <div className="duration">
      {PRESETS.map((p) => (
        <button key={p} className={`btn btn-small ${p === value ? 'on' : ''}`} onClick={() => set(p)}>
          {p}m
        </button>
      ))}
      <label className="custom-min">
        <input type="number" min={1} max={180} value={value} onChange={(e) => e.target.value && set(Number(e.target.value))} aria-label="Custom minutes" />
        min
      </label>
    </div>
  )
}

function Controls({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const { timer, settings } = state
  const [confirmFlee, setConfirmFlee] = useState(false)
  const isFocus = timer.phase === 'focus'
  const play = (fn: () => void) => settings.sound && fn()

  if (timer.status === 'idle') {
    const blocked = isFocus && !state.selectedSubjectId
    return (
      <div className="controls">
        <button
          className="btn btn-primary"
          disabled={blocked}
          onClick={() => {
            sfx.unlock()
            play(sfx.start)
            dispatch({ type: 'start', now: Date.now() })
          }}
        >
          {isFocus ? (blocked ? 'Pick a quest' : '▶ Start Quest') : '▶ Start Rest'}
        </button>
        {!isFocus && (
          <button className="btn" onClick={() => dispatch({ type: 'skipBreak' })}>
            Skip
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="controls">
      {timer.status === 'running' ? (
        <button className="btn" onClick={() => dispatch({ type: 'pause', now: Date.now() })}>
          ❚❚ Pause
        </button>
      ) : (
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'resume', now: Date.now() })}>
          ▶ Resume
        </button>
      )}
      {isFocus ? (
        <button
          className={`btn btn-danger ${confirmFlee ? 'blink' : ''}`}
          onClick={() => {
            if (!confirmFlee) {
              setConfirmFlee(true)
              setTimeout(() => setConfirmFlee(false), 3000)
              return
            }
            setConfirmFlee(false)
            dispatch({ type: 'abandon' })
          }}
        >
          {confirmFlee ? 'Lose loot?' : 'Flee'}
        </button>
      ) : (
        <button className="btn" onClick={() => dispatch({ type: 'skipBreak' })}>
          Skip
        </button>
      )}
    </div>
  )
}
