import { useRef, useState, type ChangeEvent, type Dispatch } from 'react'
import type { Action } from '../game/reducer'
import { createInitialState } from '../game/reducer'
import { normalizeSave } from '../game/storage'
import type { GameState, Settings } from '../game/types'

export function ConfigScreen({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  const { settings } = state
  const [name, setName] = useState(state.hero.name)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Settings>) => dispatch({ type: 'updateSettings', patch })
  const num = (key: keyof Settings, min: number, max: number) => ({
    min,
    max,
    value: settings[key] as number,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) set({ [key]: Math.min(max, Math.max(min, Math.round(Number(e.target.value)))) })
    },
  })

  const exportSave = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `studyrpg-save-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importSave = async (file: File) => {
    try {
      const loaded = normalizeSave(JSON.parse(await file.text()))
      if (!loaded) throw new Error('bad save')
      dispatch({ type: 'load', state: loaded })
      setName(loaded.hero.name)
      setMsg('Save loaded!')
    } catch {
      setMsg('That file is not a StudyRPG save.')
    }
  }

  const toggleNotifications = async (on: boolean) => {
    if (on && 'Notification' in window && Notification.permission !== 'granted') {
      const result = await Notification.requestPermission()
      if (result !== 'granted') {
        setMsg('Notifications were blocked by the browser.')
        return
      }
    }
    set({ notifications: on })
  }

  return (
    <div className="config-layout">
      <section className="panel">
        <h2 className="panel-title">Hero</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            dispatch({ type: 'setName', name: name.trim() })
            setMsg('Name saved.')
          }}
        >
          <input value={name} maxLength={16} onChange={(e) => setName(e.target.value)} aria-label="Hero name" />
          <button className="btn btn-small" type="submit">
            Rename
          </button>
        </form>

        <h2 className="panel-title">Timer</h2>
        <div className="form-grid">
          <label>
            Study (min)
            <input type="number" {...num('focusMinutes', 1, 180)} disabled={state.timer.status !== 'idle'} />
          </label>
          <label>
            Short rest (min)
            <input type="number" {...num('shortBreakMinutes', 1, 60)} />
          </label>
          <label>
            Long rest (min)
            <input type="number" {...num('longBreakMinutes', 1, 90)} />
          </label>
          <label>
            Quests per long rest
            <input type="number" {...num('sessionsBeforeLongBreak', 1, 12)} />
          </label>
        </div>
        <p className="hint">Changes apply to the next phase if a timer is already running.</p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Options</h2>
        <Toggle label="Auto-start rests" checked={settings.autoStartBreaks} onChange={(v) => set({ autoStartBreaks: v })} />
        <Toggle label="8-bit sound" checked={settings.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Desktop notifications" checked={settings.notifications} onChange={(v) => void toggleNotifications(v)} />
        <Toggle label="CRT scanlines" checked={settings.scanlines} onChange={(v) => set({ scanlines: v })} />

        <h2 className="panel-title">Save Data</h2>
        <p className="hint">Progress is saved automatically in this browser (localStorage). Export a backup to move it elsewhere.</p>
        <div className="row wrap">
          <button className="btn btn-small" onClick={exportSave}>
            Export
          </button>
          <button className="btn btn-small" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button
            className="btn btn-small btn-danger"
            onClick={() => {
              if (confirm('Erase ALL progress? This cannot be undone.')) {
                const fresh = createInitialState()
                dispatch({ type: 'load', state: fresh })
                setName(fresh.hero.name)
                setMsg('A new adventure begins…')
              }
            }}
          >
            New Game
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importSave(file)
              e.target.value = ''
            }}
          />
        </div>
        {msg && <p className="msg">{msg}</p>}
      </section>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-box" aria-hidden="true">
        {checked ? 'ON' : 'OFF'}
      </span>
      {label}
    </label>
  )
}
