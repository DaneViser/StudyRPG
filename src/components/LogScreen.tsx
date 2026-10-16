import type { Dispatch } from 'react'
import { formatMinutes } from '../game/logic'
import type { Action } from '../game/reducer'
import type { GameState } from '../game/types'

export function LogScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const max = Math.max(1, ...state.subjects.map((s) => s.minutes))
  const busySubject = state.timer.status !== 'idle' ? state.timer.subjectId : null

  return (
    <div className="log-layout">
      <section className="panel">
        <h2 className="panel-title">Bestiary</h2>
        {state.subjects.length === 0 ? (
          <p className="hint">No subjects yet.</p>
        ) : (
          <ul className="bestiary">
            {state.subjects.map((s) => (
              <li key={s.id}>
                <div className="best-row">
                  <span className="swatch" style={{ background: s.color }} />
                  <span className="subject-name">{s.name}</span>
                  <span className="muted">
                    {s.sessions}× · {formatMinutes(s.minutes)}
                  </span>
                  <button
                    className="btn btn-small btn-danger"
                    disabled={busySubject === s.id}
                    title="Delete subject (its history stays)"
                    onClick={() => {
                      if (confirm(`Delete "${s.name}"? Past log entries are kept.`)) dispatch({ type: 'removeSubject', id: s.id })
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="bar bar-subject">
                  <div className="bar-fill" style={{ width: `${(s.minutes / max) * 100}%`, background: s.color }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Adventure Log</h2>
        {state.history.length === 0 ? (
          <p className="hint">Complete a quest to write your first entry.</p>
        ) : (
          <ul className="history">
            {state.history.slice(0, 50).map((h) => (
              <li key={h.id}>
                <span className="muted">{new Date(h.completedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="subject-name">{h.subjectName}</span>
                <span>{formatMinutes(h.minutes)}</span>
                <span className="xp">+{h.xp} XP</span>
                <span className="gold">+{h.gold} G</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
