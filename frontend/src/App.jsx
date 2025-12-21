import { useState } from 'react'
import Scene3D from './components/Scene3D'
import GameUI from './components/GameUI' // Импортируем новый UI
import { checkHouse, checkTree, checkGarage, checkGardenBed } from './api'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  const [plotSize, setPlotSize] = useState({ w: 800, h: 800 }) 
  const [houseConfig, setHouseConfig] = useState({ w: 100, h: 100 }) 
  
  const [house, setHouse] = useState(null)
  const [trees, setTrees] = useState([]) 
  const [garages, setGarages] = useState([]) 
  const [gardenBeds, setGardenBeds] = useState([])

  const [activeTool, setActiveTool] = useState('TREE') 
  const [harvestStats, setHarvestStats] = useState({
    leaves: 0, apples: 0, carrots: 0, potatoes: 0
  })
  
  const [cctv, setCctv] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [viewMode, setViewMode] = useState('3D')
  const [notification, setNotification] = useState(null)

  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  // Вспомогательные функции
  const isPointInRect = (px, py, rectX, rectY, width, height) => {
      const halfW = width / 2
      const halfH = height / 2
      return px >= rectX - halfW && px <= rectX + halfW &&
             py >= rectY - halfH && py <= rectY + halfH
  }

  const isPointNear = (px, py, targetX, targetY, radius) => {
      const dx = px - targetX
      const dy = py - targetY
      return Math.sqrt(dx*dx + dy*dy) < radius
  }

  const handleSceneClick = async (coords) => {
    if (showResult) return

    const apiX = coords.x + (plotSize.w / 2)
    const apiY = coords.y + (plotSize.h / 2)
    const plotData = { width: plotSize.w, height: plotSize.h }

    if (season === 'SPRING') {
      const houseData = { x: apiX, y: apiY, width: houseConfig.w, height: houseConfig.h }
      try {
        const result = await checkHouse(plotData, houseData)
        if (result.violation) { setNotification(result); return }
        setHouse({ x: coords.x, y: coords.y })
      } catch (e) { console.error(e) }
    } 
    else if (season === 'SUMMER') {
      
      if (activeTool === 'ERASER') {
          const treeToDelete = trees.find(t => isPointNear(coords.x, coords.y, t.x, t.y, 20))
          if (treeToDelete) {
              setTrees(prev => prev.filter(t => t.id !== treeToDelete.id))
              return 
          }
          const bedToDelete = gardenBeds.find(b => isPointInRect(coords.x, coords.y, b.x, b.y, b.width, b.height))
          if (bedToDelete) {
              setGardenBeds(prev => prev.filter(b => b.id !== bedToDelete.id))
              return
          }
          const garageToDelete = garages.find(g => isPointInRect(coords.x, coords.y, g.x, g.y, g.width, g.height))
          if (garageToDelete) {
              setGarages(prev => prev.filter(g => g.id !== garageToDelete.id))
              return
          }
          return
      }

      if (activeTool === 'TREE' || activeTool === 'APPLE') {
          try {
            const result = await checkTree(plotData, { x: apiX, y: apiY })
            if (result.violation) { setNotification(result); return }
            setTrees(prev => [...prev, { 
                x: coords.x, y: coords.y, id: Date.now(), 
                type: activeTool === 'APPLE' ? 'apple' : 'default', 
                harvested: false 
            }])
          } catch(e) {}
      } 
      else if (activeTool === 'GARAGE') {
          try {
             const result = await checkGarage(plotData, { x: apiX, y: apiY, width: 40, height: 60 })
             if (result.violation) { setNotification(result); return }
             setGarages(prev => [...prev, { x: coords.x, y: coords.y, width: 40, height: 60, id: Date.now() }])
          } catch(e) {}
      }
      else if (activeTool === 'CARROT' || activeTool === 'POTATO') {
          const bedW = 30; const bedH = 50;
          try {
             const result = await checkGardenBed(plotData, { x: apiX, y: apiY, width: bedW, height: bedH })
             if (result.violation) { setNotification(result); return }
             setGardenBeds(prev => [...prev, { 
                 x: coords.x, y: coords.y, width: bedW, height: bedH,
                 type: activeTool === 'CARROT' ? 'carrot' : 'potato',
                 harvested: false, id: Date.now() 
             }])
          } catch(e) {}
      }
    }
    else if (season === 'AUTUMN') {
        const clickRange = 40
        let treeClicked = false
        const newTrees = trees.map(t => {
            const dist = Math.sqrt(Math.pow(t.x - coords.x, 2) + Math.pow(t.y - coords.y, 2))
            if (dist < clickRange && !t.harvested) {
                treeClicked = true
                setHarvestStats(prev => ({
                    ...prev,
                    leaves: t.type === 'default' ? prev.leaves + 1 : prev.leaves,
                    apples: t.type === 'apple' ? prev.apples + 1 : prev.apples
                }))
                return { ...t, harvested: true } 
            }
            return t
        })
        if (treeClicked) setTrees(newTrees)

        let bedClicked = false
        const newBeds = gardenBeds.map(b => {
             const dist = Math.sqrt(Math.pow(b.x - coords.x, 2) + Math.pow(b.y - coords.y, 2))
             if (dist < clickRange && !b.harvested) {
                 bedClicked = true
                 setHarvestStats(prev => ({
                     ...prev,
                     carrots: b.type === 'carrot' ? prev.carrots + 1 : prev.carrots,
                     potatoes: b.type === 'potato' ? prev.potatoes + 1 : prev.potatoes
                 }))
                 return { ...b, harvested: true }
             }
             return b
        })
        if (bedClicked) setGardenBeds(newBeds)
    }
  }

  return (
    <div className="app-container" style={{fontFamily: 'Nunito, sans-serif'}}>
      <Scene3D 
        season={season} house={house} trees={trees} garages={garages} gardenBeds={gardenBeds}
        cctv={cctv} viewMode={viewMode} plotSize={plotSize} houseConfig={houseConfig} 
        onPlotClick={handleSceneClick} 
      />

      {!showResult && (
        <>
          {/* НОВАЯ КРАСИВАЯ ПАНЕЛЬ UI */}
          <div className="ui-layer" style={{ pointerEvents: 'none', zIndex: 10 }}>
             <GameUI 
                season={season} setSeason={setSeason}
                plotSize={plotSize} setPlotSize={setPlotSize}
                houseConfig={houseConfig} setHouseConfig={setHouseConfig}
                activeTool={activeTool} setActiveTool={setActiveTool}
                house={house}
                cctv={cctv} setCctv={setCctv}
                harvestStats={harvestStats}
                isMenuCollapsed={isMenuCollapsed} setIsMenuCollapsed={setIsMenuCollapsed}
                onFinishProject={() => { setShowResult(true); setViewMode('2D') }}
             />

             {/* Переключатель вида (Отдельный виджет справа) */}
             <div className="view-toggle">
                <button 
                  className={`toggle-opt ${viewMode === '2D' ? 'active' : ''}`}
                  onClick={() => setViewMode('2D')}
                >
                  2D План
                </button>
                <button 
                  className={`toggle-opt ${viewMode === '3D' ? 'active' : ''}`}
                  onClick={() => setViewMode('3D')}
                >
                  3D Вид
                </button>
             </div>
          </div>

          {/* Кнопка "Завершить" внизу */}
          <div className="finish-btn-container">
              <button 
                  className="finish-btn"
                  onClick={() => { setShowResult(true); setViewMode('2D'); }}
              >
                  Завершить проект ➝
              </button>
          </div>

          {notification && (
            <div className="notification" style={{
              background: '#FFEBEE', color: '#D32F2F', 
              border: '1px solid #FFCDD2', borderRadius: 12, boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{marginTop:0, fontSize: 16}}>Нарушение норм</h3><p style={{fontSize: 14}}>{notification.message}</p>
              <button 
                onClick={() => setNotification(null)}
                style={{
                  background: '#D32F2F', color: 'white', border:'none', 
                  padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
                }}
              >
                Понятно
              </button>
            </div>
          )}
        </>
      )}

      {/* Экран результатов (Тоже стилизуем под новый дизайн) */}
      {showResult && (
        <div className="ui-layer" style={{pointerEvents: 'none'}}> 
          <div className="game-ui-card" style={{
             position: 'absolute', right: 20, top: 20, left: 'auto', width: 320, pointerEvents: 'auto'
          }}>
             <div className="ui-header">
                <h2 className="ui-title">Итоги проекта</h2>
             </div>
             
             <ul className="stats-list">
                 <li><span> Участок</span> <span className="stat-val">{plotSize.w} x {plotSize.h}</span></li>
                 <li><span> Дом</span> <span className="stat-val">{houseConfig.w} x {houseConfig.h} {cctv && '+CCTV'}</span></li>
                 <li><span> Деревьев</span> <span className="stat-val">{trees.length}</span></li>
                 <li><span> Грядок</span> <span className="stat-val">{gardenBeds.length}</span></li>
                 <li><span> Построек</span> <span className="stat-val">{garages.length}</span></li>
             </ul>
             
             <div className="section-label">Собранный урожай</div>
             <ul className="stats-list">
                 <li><span> Листья</span> <span className="stat-val">{harvestStats.leaves}</span></li>
                 <li><span> Яблоки</span> <span className="stat-val">{harvestStats.apples}</span></li>
                 <li><span> Морковь</span> <span className="stat-val">{harvestStats.carrots}</span></li>
                 <li><span> Картофель</span> <span className="stat-val">{harvestStats.potatoes}</span></li>
             </ul>
              <div className="section-label" style={{marginTop: 15}}>Режим просмотра</div>
             <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
                 <button 
                   className={`secondary-btn ${viewMode === '2D' ? 'active' : ''}`}
                   onClick={() => setViewMode('2D')}
                 >
                   2D 
                 </button>
                 <button 
                   className={`secondary-btn ${viewMode === '3D' ? 'active' : ''}`}
                   onClick={() => setViewMode('3D')}
                 >
                   3D 
                 </button>
             </div>

             {/* <button 
               className="primary-btn" 
               onClick={() => setShowResult(false)}
             >

             </button> */}
             <button 
               className="primary-btn" 
               onClick={() => setShowResult(false)}
             >
               Вернуться к редактированию
             </button>
          </div>
        </div>
      )}
    </div>
  )
}