import { useState } from 'react'
import Scene3D from './components/Scene3D'
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

  // Вспомогательная функция: проверка попадания точки в прямоугольник (для гаражей и грядок)
  const isPointInRect = (px, py, rectX, rectY, width, height) => {
      const halfW = width / 2
      const halfH = height / 2
      return px >= rectX - halfW && px <= rectX + halfW &&
             py >= rectY - halfH && py <= rectY + halfH
  }

  // Вспомогательная функция: проверка дистанции (для деревьев)
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

    // --- ВЕСНА ---
    if (season === 'SPRING') {
      const houseData = { x: apiX, y: apiY, width: houseConfig.w, height: houseConfig.h }
      try {
        const result = await checkHouse(plotData, houseData)
        if (result.violation) { setNotification(result); return }
        setHouse({ x: coords.x, y: coords.y })
      } catch (e) { console.error(e) }
    } 
    
    // --- ЛЕТО ---
    else if (season === 'SUMMER') {
      
      // 1. ЛОГИКА ЛАСТИКА (УДАЛЕНИЕ)
      if (activeTool === 'ERASER') {
          // Проверяем деревья (радиус клика ~20)
          const treeToDelete = trees.find(t => isPointNear(coords.x, coords.y, t.x, t.y, 20))
          if (treeToDelete) {
              setTrees(prev => prev.filter(t => t.id !== treeToDelete.id))
              return // Удалили и выходим
          }

          // Проверяем грядки
          const bedToDelete = gardenBeds.find(b => isPointInRect(coords.x, coords.y, b.x, b.y, b.width, b.height))
          if (bedToDelete) {
              setGardenBeds(prev => prev.filter(b => b.id !== bedToDelete.id))
              return
          }

          // Проверяем гаражи
          const garageToDelete = garages.find(g => isPointInRect(coords.x, coords.y, g.x, g.y, g.width, g.height))
          if (garageToDelete) {
              setGarages(prev => prev.filter(g => g.id !== garageToDelete.id))
              return
          }
          return
      }

      // 2. ДОБАВЛЕНИЕ ОБЪЕКТОВ
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
    
    // --- ОСЕНЬ ---
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
    <div className="app-container">
      <Scene3D 
        season={season} house={house} trees={trees} garages={garages} gardenBeds={gardenBeds}
        cctv={cctv} viewMode={viewMode} plotSize={plotSize} houseConfig={houseConfig} 
        onPlotClick={handleSceneClick} 
      />

      {!showResult && (
        <>
          <div className="ui-layer" style={{ pointerEvents: 'none', height: 'auto', paddingBottom: 0 }}>
             <div className="top-panel" style={{ pointerEvents: 'auto', position: 'relative' }}>
                
                <button 
                  onClick={() => setViewMode(viewMode === '2D' ? '3D' : '2D')}
                  style={{ position: 'absolute', top: 5, right: 90, padding: '2px 8px', fontSize: '12px' }}
                >
                   {viewMode === '2D' ? 'В 3D' : 'В 2D'}
                </button>

                <button 
                  onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
                  style={{ position: 'absolute', top: 5, right: 5, padding: '2px 8px', fontSize: '12px' }}
                >
                   {isMenuCollapsed ? 'Развернуть' : 'Свернуть'}
                </button>

                {!isMenuCollapsed ? (
                  <>
                    <div className="season-bar">
                      {['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'].map(s => (
                        <button key={s} className={season === s ? 'active' : ''} onClick={() => setSeason(s)}>
                          {s === 'WINTER' ? 'Зима' : s === 'SPRING' ? 'Весна' : s === 'SUMMER' ? 'Лето' : 'Осень'}
                        </button>
                      ))}
                    </div>

                    {season === 'WINTER' && (
                      <div style={{marginTop: 10}}>
                        <label>Ширина: <input type="number" value={plotSize.w} onChange={e=>setPlotSize({...plotSize, w: +e.target.value})} style={{width:50}}/></label>
                        <label style={{marginLeft:10}}>Длина: <input type="number" value={plotSize.h} onChange={e=>setPlotSize({...plotSize, h: +e.target.value})} style={{width:50}}/></label>
                        <br/><label>Дом: <input type="number" value={houseConfig.w} onChange={e=>setHouseConfig({w:+e.target.value, h:+e.target.value})} style={{width:50}}/></label>
                      </div>
                    )}
                    
                    {season === 'SPRING' && <p>Разместите дом.</p>}
                    
                    {season === 'SUMMER' && (
                      <div>
                        {/* Кнопка ЛАСТИК (Выделена цветом) */}
                        <div style={{marginBottom: 10}}>
                            <button 
                                onClick={()=>setActiveTool('ERASER')} 
                                className={activeTool==='ERASER'?'active':''}
                                style={{backgroundColor: activeTool==='ERASER'?'#ef5350':'#fff', color: activeTool==='ERASER'?'white':'red', border: '1px solid red'}}
                            >
                                Ластик (Удалить объект)
                            </button>
                        </div>

                        <p style={{margin: '5px 0'}}>Деревья:</p>
                        <button onClick={()=>setActiveTool('TREE')} className={activeTool==='TREE'?'active':''}>Дерево</button>
                        <button onClick={()=>setActiveTool('APPLE')} className={activeTool==='APPLE'?'active':''} style={{marginLeft:5}}>Яблоня</button>
                        
                        <p style={{margin: '5px 0'}}>Грядки:</p>
                        <button onClick={()=>setActiveTool('CARROT')} className={activeTool==='CARROT'?'active':''}>Морковь</button>
                        <button onClick={()=>setActiveTool('POTATO')} className={activeTool==='POTATO'?'active':''} style={{marginLeft:5}}>Картофель</button>
                        
                        <p style={{margin: '5px 0'}}>Строения:</p>
                        <button onClick={()=>setActiveTool('GARAGE')} className={activeTool==='GARAGE'?'active':''}>Гараж</button>
                      </div>
                    )}
                    
                    {season === 'AUTUMN' && (
                      <div>
                          <p><b>Сбор урожая:</b></p>
                          <ul style={{paddingLeft: 20, margin: '5px 0'}}>
                              <li>Пакетов листьев: {harvestStats.leaves}</li>
                              <li>Яблок: {harvestStats.apples}</li>
                              <li>Урожай моркови: {harvestStats.carrots}</li>
                              <li>Урожай картофеля: {harvestStats.potatoes}</li>
                          </ul>
                          <hr/>
                          {house && (
                              <button onClick={() => setCctv(!cctv)} className={cctv ? 'active' : ''}>
                                {cctv ? 'Камера и антенна установлены' : 'Установить камеру'}
                              </button>
                          )}
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <b>{season}</b>
                  </div>
                )}
             </div>
          </div>

          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
              <button 
                  style={{
                    backgroundColor: '#2196F3', color: 'white', 
                    padding: '12px 24px', fontSize: '16px', borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }}
                  onClick={() => { setShowResult(true); setViewMode('2D'); }}
              >
                  Завершить проект
              </button>
          </div>

          {notification && (
            <div className="notification">
              <h3>Ошибка!</h3>
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)}>ОК</button>
            </div>
          )}
        </>
      )}

      {showResult && (
        <div className="ui-layer" style={{pointerEvents: 'none'}}> 
          <div className="side-panel" style={{pointerEvents: 'auto', position: 'absolute', right: 20, top: 20, width: 300}}>
             <h2>Итоги проекта</h2>
             <ul style={{listStyle: 'none', padding: 0}}>
                 <li>Участок: {plotSize.w} x {plotSize.h}</li>
                 <li>Дом: {houseConfig.w} x {houseConfig.h} {cctv && '+ Умный дом'}</li>
                 <li>Всего деревьев: {trees.length}</li>
                 <li>Всего грядок: {gardenBeds.length}</li>
                 <hr/>
                 <li>Листьев: {harvestStats.leaves} пак.</li>
                 <li>Яблок: {harvestStats.apples} шт.</li>
                 <li>Моркови: {harvestStats.carrots} урож.</li>
                 <li>Картофеля: {harvestStats.potatoes} урож.</li>
             </ul>
             <hr/>
             <button onClick={() => setViewMode('2D')} className={viewMode==='2D'?'active':''} style={{marginRight:5}}>2D План</button>
             <button onClick={() => setViewMode('3D')} className={viewMode==='3D'?'active':''}>3D Вид</button>
             <br/><br/>
             <button onClick={() => setShowResult(false)} style={{width: '100%'}}>Назад</button>
          </div>
        </div>
      )}
    </div>
  )
}