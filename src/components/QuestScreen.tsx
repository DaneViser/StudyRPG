import { useState, type Dispatch, type FormEvent } from 'react'
import { SUBJECT_COLORS } from '../game/data'
import { formatClock, formatMinutes, nextStreak, sessionRewards } from '../game/logic'
import type { Action } from '../game/reducer'
import { sfx } from '../game/sound'
import type { GameState } from '../game/types'
import { BatSprite, HeroSprite } from './Sprites'

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

  return (
    <div className="quest-layout">
      <SubjectPicker state={state} dispatch={dispatch} locked={busy && isFocus} />
      <section className="panel stage-panel">
        <h2 className="panel-title">{isFocus ? 'Quest' : timer.phase === 'long' ? 'Save Room' : 'Rest'}</h2>
        {isFocus ? <Battle state={state} remainingMs={remainingMs} now={now} /> : <Camp state={state} remainingMs={remainingMs} />}
        <div className="clock" aria-live="off">
          {formatClock(remainingMs)}
        </div>
        {isFocus && !busy && <DurationPicker value={settings.focusMinutes} dispatch={dispatch} />}
        <Controls state={state} dispatch={dispatch} />
      </section>
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
  const streak = nextStreak(state.streak, now).count
  const reward = sessionRewards(timer.durationMs / 60_000, state.equipped, streak)

  return (
    <div className={`battle ${running ? 'fighting' : ''} ${timer.status === 'paused' ? 'paused' : ''}`}>
      <div className="enemy">
        <div className="enemy-name">{subject ? `${subject.name} Bat` : '???'}</div>
        <div className="bar bar-hp">
          <div className="bar-fill" style={{ width: `${hp * 100}%` }} />
        </div>
        <BatSprite color={subject?.color ?? '#555'} className="bat" />
      </div>
      <HeroSprite equipped={state.equipped} className="hero-sprite" />
      <div className="loot-preview">
        Loot: <b className="xp">+{reward.xp} XP</b> <b className="gold">+{reward.gold} G</b>
      </div>
    </div>
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
