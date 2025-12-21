import { useState } from 'react'
import Scene3D from './components/Scene3D'
import { checkHouse, checkTree, checkGarage, checkGardenBed } from './api'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  const [plotSize, setPlotSize] = useState({ w: 800, h: 800 }) 
  const [houseConfig, setHouseConfig] = useState({ w: 100, h: 100 }) 
  
  // Объекты
  const [house, setHouse] = useState(null)
  const [trees, setTrees] = useState([]) // Теперь содержит поле type: 'default' | 'apple'
  const [garages, setGarages] = useState([]) 
  const [gardenBeds, setGardenBeds] = useState([]) // [{x, y, type: 'carrot'|'potato', harvested: false}]

  // Инструменты и статистика
  const [activeTool, setActiveTool] = useState('TREE') 
  
  // Статистика урожая теперь объект
  const [harvestStats, setHarvestStats] = useState({
    leaves: 0,
    apples: 0,
    carrots: 0,
    potatoes: 0
  })
  
  const [cctv, setCctv] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [viewMode, setViewMode] = useState('3D')
  const [notification, setNotification] = useState(null)

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
      // 1. Деревья (Обычное или Яблоня)
      if (activeTool === 'TREE' || activeTool === 'APPLE') {
          try {
            const result = await checkTree(plotData, { x: apiX, y: apiY })
            if (result.violation) { setNotification(result); return }
            
            setTrees(prev => [...prev, { 
                x: coords.x, 
                y: coords.y, 
                id: Date.now(), 
                type: activeTool === 'APPLE' ? 'apple' : 'default', // Запоминаем тип
                harvested: false 
            }])
          } catch(e) {}
      } 
      // 2. Гараж
      else if (activeTool === 'GARAGE') {
          try {
             const result = await checkGarage(plotData, { x: apiX, y: apiY, width: 40, height: 60 })
             if (result.violation) { setNotification(result); return }
             setGarages(prev => [...prev, { x: coords.x, y: coords.y, width: 40, height: 60, id: Date.now() }])
          } catch(e) {}
      }
      // 3. Грядки (Морковь или Картошка)
      else if (activeTool === 'CARROT' || activeTool === 'POTATO') {
          const bedW = 30; const bedH = 50; // Размер грядки
          try {
             const result = await checkGardenBed(plotData, { x: apiX, y: apiY, width: bedW, height: bedH })
             if (result.violation) { setNotification(result); return }
             
             setGardenBeds(prev => [...prev, { 
                 x: coords.x, 
                 y: coords.y, 
                 width: bedW, 
                 height: bedH,
                 type: activeTool === 'CARROT' ? 'carrot' : 'potato',
                 harvested: false,
                 id: Date.now() 
             }])
          } catch(e) {}
      }
    }

    // --- ОСЕНЬ: СБОР УРОЖАЯ ---
    else if (season === 'AUTUMN') {
        const clickRange = 40

        // 1. Проверяем деревья
        let treeClicked = false
        const newTrees = trees.map(t => {
            const dist = Math.sqrt(Math.pow(t.x - coords.x, 2) + Math.pow(t.y - coords.y, 2))
            if (dist < clickRange && !t.harvested) {
                treeClicked = true
                // Обновляем статистику
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

        // 2. Проверяем грядки
        let bedClicked = false
        const newBeds = gardenBeds.map(b => {
             // Простая проверка попадания в прямоугольник (или радиус)
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
        season={season}
        house={house} 
        trees={trees} 
        garages={garages}
        gardenBeds={gardenBeds} 
        cctv={cctv}         
        viewMode={viewMode}
        plotSize={plotSize}
        houseConfig={houseConfig} 
        onPlotClick={handleSceneClick} 
      />

      {!showResult && (
        <div className="ui-layer">
          <div className="top-panel">
            <div className="season-bar">
              {['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'].map(s => (
                <button key={s} className={season === s ? 'active' : ''} onClick={() => setSeason(s)}>
                  {s === 'WINTER' ? ' Зима' : s === 'SPRING' ? ' Весна' : s === 'SUMMER' ? ' Лето' : ' Осень'}
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
                 <p style={{margin: '5px 0'}}>Деревья:</p>
                 <button onClick={()=>setActiveTool('TREE')} className={activeTool==='TREE'?'active':''}> Дерево</button>
                 <button onClick={()=>setActiveTool('APPLE')} className={activeTool==='APPLE'?'active':''} style={{marginLeft:5}}> Яблоня</button>
                 
                 <p style={{margin: '5px 0'}}>Грядки:</p>
                 <button onClick={()=>setActiveTool('CARROT')} className={activeTool==='CARROT'?'active':''}> Морковь</button>
                 <button onClick={()=>setActiveTool('POTATO')} className={activeTool==='POTATO'?'active':''} style={{marginLeft:5}}> Картофель</button>
                 
                 <p style={{margin: '5px 0'}}>Строения:</p>
                 <button onClick={()=>setActiveTool('GARAGE')} className={activeTool==='GARAGE'?'active':''}>🛖 Гараж</button>
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
                        {cctv ? 'Камера поставлена' : ' Поставить камеру'}
                      </button>
                  )}
              </div>
            )}
            
            <div style={{marginTop: 20}}>
                <button 
                    style={{backgroundColor: '#2196F3', color: 'white', width: '100%'}}
                    onClick={() => { setShowResult(true); setViewMode('2D'); }}
                >
                    Завершить проект
                </button>
            </div>
          </div>

          {notification && (
            <div className="notification">
              <h3> Ошибка!</h3>
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)}>ОК</button>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className="ui-layer" style={{pointerEvents: 'none'}}> 
          <div className="side-panel" style={{pointerEvents: 'auto', position: 'absolute', right: 20, top: 20, width: 300}}>
             <h2> Итоги: </h2>
             <ul style={{listStyle: 'none', padding: 0}}>
                 <li>Участок: {plotSize.w} x {plotSize.h}</li>
                 <li>Дом: {houseConfig.w} x {houseConfig.h} {cctv && '+ Камера'}</li>
                 <li>Всего деревьев: {trees.length}</li>
                 <li>Всего грядок: {gardenBeds.length}</li>
                 <hr/>
                 <li> Листьев: {harvestStats.leaves} пак.</li>
                 <li> Урожай яблок с {harvestStats.apples} деревьев </li>
                 <li> Урожай моркови: {harvestStats.carrots} кг</li>
                 <li> Урожай картофеля: {harvestStats.potatoes} кг</li>
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