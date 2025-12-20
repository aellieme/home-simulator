import { useState } from 'react'
import { checkHouse } from '../api'
import Scene3D from './Scene3D'

export default function HousePlacer({ setMessage }) {
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [placedHouse, setPlacedHouse] = useState(null)

  async function placeHouse() {
    const plot = { width: 400, height: 400 }
    const house = { x, y, width: 100, height: 100 }

    const res = await checkHouse(plot, house)

    if (!res.ok) {
      setMessage(res)
      setPlacedHouse(null)
    } else {
      setMessage({ message: 'Дом размещён!', rule: '' })
      setPlacedHouse(house)
    }
  }

  return (
    <div>
      <h3>Дом</h3>
      X:{' '}
      <input
        type="number"
        value={x}
        onChange={e => setX(+e.target.value)}
      />
      Y:{' '}
      <input
        type="number"
        value={y}
        onChange={e => setY(+e.target.value)}
      />
      <button onClick={placeHouse}>Разместить дом</button>

      <h3>3D визуализация</h3>
      <Scene3D house={placedHouse} />
    </div>
  )
}
