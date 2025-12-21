import { useState } from 'react'
import Scene3D from './components/Scene3D'
// Добавлены импорты для всех типов проверок
import { checkHouse, checkTree, checkGarage } from './api'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  
  // Состояние мира
  const [plotSize, setPlotSize] = useState({ w: 800, h: 800 }) 
  const [houseConfig, setHouseConfig] = useState({ w: 100, h: 100 }) 
  
  // Объекты на сцене
  const [house, setHouse] = useState(null)
  const [trees, setTrees] = useState([]) 
  const [garages, setGarages] = useState([]) // Добавлено состояние гаражей

  // Игровые механики
  const [activeTool, setActiveTool] = useState('TREE') // TREE или GARAGE
  const [harvestScore, setHarvestScore] = useState(0) // Урожай
  
  const [notification, setNotification] = useState(null)

  // Обработчик клика
  const handleSceneClick = async (coords) => {
    // Подготовка данных для API
    const apiX = coords.x + (plotSize.w / 2)
    const apiY = coords.y + (plotSize.h / 2)
    const plotData = { width: plotSize.w, height: plotSize.h }

    // 1. ВЕСНА: Строим дом
    if (season === 'SPRING') {
      const houseData = { x: apiX, y: apiY, width: houseConfig.w, height: houseConfig.h }

      try {
        const result = await checkHouse(plotData, houseData)
        if (result.violation) {
             setNotification({ message: result.message, rule: result.rule })
             return 
        } else {
             setNotification(null)
        }
        setHouse({ x: coords.x, y: coords.y })
      } catch (e) {
        console.error(e)
      }
    } 
    
    // 2. ЛЕТО: Сажаем деревья или строим гаражи
    else if (season === 'SUMMER') {
      
      if (activeTool === 'TREE') {
          try {
            const result = await checkTree(plotData, { x: apiX, y: apiY })
            if (result.violation) {
                setNotification({ message: result.message, rule: result.rule })
                return
            }
            // Успех
            setNotification(null)
            const newTree = { x: coords.x, y: coords.y, id: Date.now(), harvested: false }
            setTrees(prev => [...prev, newTree])
          } catch(e) { console.error(e) }
      } 
      else if (activeTool === 'GARAGE') {
          // Гараж фиксированного размера 40x60
          const gW = 40
          const gH = 60
          try {
             // Предполагаем, что функция checkGarage существует в api.js
             const result = await checkGarage(plotData, { x: apiX, y: apiY, width: gW, height: gH })
             if (result.violation) {
                 setNotification({ message: result.message, rule: result.rule })
                 return
             }
             setNotification(null)
             setGarages(prev => [...prev, { x: coords.x, y: coords.y, width: gW, height: gH, id: Date.now() }])
          } catch(e) { console.error(e) }
      }
    }

    // 3. ОСЕНЬ: Сбор урожая
    else if (season === 'AUTUMN') {
        const clickRange = 40 // Радиус клика
        setTrees(prev => prev.map(t => {
            const dx = t.x - coords.x
            const dy = t.y - coords.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            if (dist < clickRange && !t.harvested) {
                setHarvestScore(s => s + 1)
                return { ...t, harvested: true } // Меняем состояние дерева
            }
            return t
        }))
    }
  }

  return (
    <div className="app-container">
      <Scene3D 
        season={season} // Передаем сезон для цвета листьев
        house={house} 
        trees={trees} 
        garages={garages} // Передаем гаражи
        plotSize={plotSize}
        houseConfig={houseConfig} 
        onPlotClick={handleSceneClick} 
      />

      <div className="ui-layer">
        <div className="top-panel">
          <div className="season-bar">
            {['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'].map(s => (
              <button 
                key={s} 
                className={season === s ? 'active' : ''} 
                onClick={() => setSeason(s)}>
                {s === 'WINTER' ? ' Зима' : s === 'SPRING' ? ' Весна' : s === 'SUMMER' ? ' Лето' : ' Осень'}
              </button>
            ))}
          </div>

          {season === 'WINTER' && (
            <div style={{ marginTop: 10 }}>
              <h3> Проектирование</h3>
              <label>Ширина участка: <input type="number" value={plotSize.w} onChange={e => setPlotSize({...plotSize, w: +e.target.value})} /></label>
              <br/>
              <label>Длина участка: <input type="number" value={plotSize.h} onChange={e => setPlotSize({...plotSize, h: +e.target.value})} /></label>
              <hr/>
              <label>Размер дома: <input type="number" value={houseConfig.w} onChange={e => setHouseConfig({w: +e.target.value, h: +e.target.value})} /></label>
            </div>
          )}

          {season === 'SPRING' && <p>Кликните, чтобы разместить фундамент дома ({houseConfig.w}x{houseConfig.h}).</p>}
          
          {season === 'SUMMER' && (
              <div>
                  <p>Выберите объект для размещения:</p>
                  <button onClick={() => setActiveTool('TREE')} className={activeTool === 'TREE' ? 'active' : ''} style={{marginRight: 10}}>Дерево</button>
                  <button onClick={() => setActiveTool('GARAGE')} className={activeTool === 'GARAGE' ? 'active' : ''}>Гараж</button>
              </div>
          )}
          
          {season === 'AUTUMN' && (
              <div>
                  <p>Осень. Кликайте по оранжевым деревьям для сбора.</p>
                  <h3>Собрано: {harvestScore}</h3>
              </div>
          )}
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