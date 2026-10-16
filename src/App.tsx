import { useState } from 'react'
import { ConfigScreen } from './components/ConfigScreen'
import { HeroScreen } from './components/HeroScreen'
import { Hud } from './components/Hud'
import { LogScreen } from './components/LogScreen'
import { QuestScreen } from './components/QuestScreen'
import { RewardModal } from './components/RewardModal'
import { ShopScreen } from './components/ShopScreen'
import { useGame } from './game/useGame'

const TABS = [
  { id: 'quest', label: 'Quest' },
  { id: 'hero', label: 'Hero' },
  { id: 'shop', label: 'Shop' },
  { id: 'log', label: 'Log' },
  { id: 'config', label: 'Config' },
] as const

type Tab = (typeof TABS)[number]['id']

export default function App() {
  const { state, dispatch, remainingMs, now } = useGame()
  const [tab, setTab] = useState<Tab>('quest')

  return (
    <div className={`app ${state.settings.scanlines ? 'crt' : ''}`}>
      <div className="sky" aria-hidden="true">
        <div className="moon" />
        <div className="castle" />
      </div>
      <main className="frame">
        <h1 className="logo">
          Study<span>RPG</span>
        </h1>
        <Hud state={state} now={now} />
        <nav className="tabs" aria-label="Screens">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
              {tab === t.id && '▶ '}
              {t.label}
              {t.id === 'quest' && tab !== 'quest' && state.timer.status === 'running' && <span className="dot" />}
            </button>
          ))}
        </nav>
        {tab === 'quest' && <QuestScreen state={state} dispatch={dispatch} remainingMs={remainingMs} now={now} />}
        {tab === 'hero' && <HeroScreen state={state} dispatch={dispatch} now={now} />}
        {tab === 'shop' && <ShopScreen state={state} dispatch={dispatch} />}
        {tab === 'log' && <LogScreen state={state} dispatch={dispatch} />}
        {tab === 'config' && <ConfigScreen state={state} dispatch={dispatch} />}
      </main>
      {state.reward && <RewardModal reward={state.reward} sound={state.settings.sound} dispatch={dispatch} />}
    </div>
  )
}
