// App.jsx
import { useState } from 'react'
import Scene3D from './components/Scene3D'
import { checkHouse } from './api'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  
  // Состояние мира
  const [plotSize, setPlotSize] = useState({ w: 800, h: 800 }) // Размеры участка
  const [houseConfig, setHouseConfig] = useState({ w: 100, h: 100 }) // Размеры дома
  
  // Объекты на сцене
  const [house, setHouse] = useState(null)
  const [trees, setTrees] = useState([]) // Список деревьев [{x,y}, {x,y}]
  
  const [notification, setNotification] = useState(null)

  // Обработчик клика
  const handleSceneClick = async (coords) => {
    // 1. ВЕСНА: Строим дом
    if (season === 'SPRING') {
      const apiX = coords.x + (plotSize.w / 2)
      const apiY = coords.y + (plotSize.h / 2)

      const plotData = { width: plotSize.w, height: plotSize.h }
      const houseData = { x: apiX, y: apiY, width: houseConfig.w, height: houseConfig.h }

      try {
        const result = await checkHouse(plotData, houseData)
        if (result.violation) {
             setNotification({ message: result.message, rule: result.rule })
             return // Не ставим дом, если нарушение ( убрать return чтобы разрешить)
        } else {
             setNotification(null)
        }
        setHouse({ x: coords.x, y: coords.y })
      } catch (e) {
        console.error(e)
      }
    } 
    
    // 2. ЛЕТО: Сажаем деревья
    else if (season === 'SUMMER') {
      // Здесь тоже можно добавить проверку норм (backend), но пока просто ставим
      const newTree = { x: coords.x, y: coords.y, id: Date.now() }
      setTrees(prev => [...prev, newTree])
    }
  }

  return (
    <div className="app-container">
      <Scene3D 
        house={house} 
        trees={trees} // Передаем деревья в сцену
        plotSize={plotSize}
        houseConfig={houseConfig} // Передаем размеры дома для отрисовки
        onPlotClick={handleSceneClick} 
      />

      <div className="ui-layer">
        <div className="top-panel">
          <div className="season-bar">
            {['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'].map(s => (
              <button 
                key={s} 
                className={season === s ? 'active' : ''} 
                onClick={() => setSeason(s)}
              >
                {s === 'WINTER' ? ' Зима' : s === 'SPRING' ? ' Весна' : s === 'SUMMER' ? ' Лето' : ' Осень'}
              </button>
            ))}
          </div>

          {/* ИНТЕРФЕЙС ЗИМЫ: Настройки */}
          {season === 'WINTER' && (
            <div style={{ marginTop: 10 }}>
              <h3> Проектирование</h3>
              <label>
                Ширина участка: 
                <input type="number" value={plotSize.w} onChange={e => setPlotSize({...plotSize, w: +e.target.value})} />
              </label>
              <br/>
              <label>
                Длина участка: 
                <input type="number" value={plotSize.h} onChange={e => setPlotSize({...plotSize, h: +e.target.value})} />
              </label>
              <hr/>
              <label>
                Размер дома (ширина): 
                <input type="number" value={houseConfig.w} onChange={e => setHouseConfig({...houseConfig, w: +e.target.value})} />
              </label>
            </div>
          )}

          {season === 'SPRING' && <p>Кликните, чтобы разместить фундамент дома ({houseConfig.w}x{houseConfig.h}).</p>}
          {season === 'SUMMER' && <p>Кликните, чтобы посадить дерево.</p>}
          {season === 'AUTUMN' && <p>Осень. Сбор урожая (функционал в разработке).</p>}
        </div>

        {notification && (
          <div className="notification">
            <h3> Нарушение норм!</h3>
            <p>{notification.message}</p>
            <small>{notification.rule}</small>
            <br/><button onClick={() => setNotification(null)}>ОК</button>
          </div>
        )}
      </div>
    </div>
  )
}