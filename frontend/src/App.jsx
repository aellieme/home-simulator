import { useState } from 'react'
import PlotEditor from './components/PlotEditor'
import HousePlacer from './components/HousePlacer'
import SeasonBar from './components/SeasonBar'
import Notification from './components/Notification'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  const [message, setMessage] = useState(null)

  return (
    <div className="app">
      <h1>Дом мечты</h1>

      <SeasonBar season={season} setSeason={setSeason} />

      <PlotEditor />

      <HousePlacer setMessage={setMessage} />

      {message && (
        <Notification message={message.message} rule={message.rule} />
      )}
    </div>
  )
}
