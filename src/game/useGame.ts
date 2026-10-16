import { useEffect, useReducer, useRef, useState } from 'react'
import { formatClock } from './logic'
import { gameReducer } from './reducer'
import { sfx } from './sound'
import { loadGame, saveGame } from './storage'

const PHASE_LABEL = { focus: 'Quest', short: 'Rest', long: 'Camp' } as const

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame)
  const [now, setNow] = useState(() => Date.now())
  const { timer, settings } = state
  const lastCompleted = useRef<number | null>(null)

  useEffect(() => saveGame(state), [state])

  // Tick while running; time is derived from endsAt so background tabs stay accurate
  useEffect(() => {
    if (timer.status !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [timer.status])

  useEffect(() => {
    if (timer.status !== 'running' || timer.endsAt === null || timer.endsAt > now) return
    if (lastCompleted.current === timer.endsAt) return
    lastCompleted.current = timer.endsAt
    const wasFocus = timer.phase === 'focus'
    dispatch({ type: 'complete', now, recordId: crypto.randomUUID() })
    if (settings.sound) (wasFocus ? sfx.victory : sfx.breakOver)()
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(wasFocus ? 'Quest complete!' : 'Break is over', {
        body: wasFocus ? 'Rewards await, hero. Take a break.' : 'Time to get back to studying.',
      })
    }
  }, [now, timer, settings.sound, settings.notifications])

  const remainingMs = timer.status === 'running' && timer.endsAt !== null
      ? Math.min(timer.remainingMs, Math.max(0, timer.endsAt - now))
      : timer.remainingMs

  useEffect(() => {
    document.title = timer.status === 'idle' ? 'StudyRPG' : `${formatClock(remainingMs)} ${PHASE_LABEL[timer.phase]} - StudyRPG`
  }, [remainingMs, timer.status, timer.phase])

  return { state, dispatch, remainingMs, now }
}
