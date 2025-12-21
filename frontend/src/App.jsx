import { useState, useCallback } from 'react'
import Scene3D from './components/Scene3D'
import GameUI from './components/GameUI' // Импортируем новый UI
import { checkHouse, checkTree, checkGarage, checkGardenBed } from './api'

export default function App() {
  const [season, setSeason] = useState('WINTER')
  const [plotSize, setPlotSize] = useState({ w: 800, h: 800 }) 
  const [houseConfig, setHouseConfig] = useState({ w: 100, h: 100 }) 

  
  const [zoomInFn, setZoomInFn] = useState(null);
  const [zoomOutFn, setZoomOutFn] = useState(null);
  const handleZoomInRef = useCallback((fn) => setZoomInFn(() => fn), []);
  const handleZoomOutRef = useCallback((fn) => setZoomOutFn(() => fn), []);
  
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
  const doRectanglesOverlap = (x1, y1, w1, h1, x2, y2, w2, h2) => {
    return !(x1 + w1/2 < x2 - w2/2 ||   // Слева
             x1 - w1/2 > x2 + w2/2 ||   // Справа
             y1 + h1/2 < y2 - h2/2 ||   // Снизу
             y1 - h1/2 > y2 + h2/2);     // Сверху
  } 
    const getExistingOthers = () => {
      const others = [];
      
      // Все координаты пересчитываем в систему "от 0 до PlotSize" 
      // и сдвигаем к левому верхнему углу (как ждет norms.py)
      
      if (house) {
          others.push({
              x: house.x + plotSize.w / 2 - houseConfig.w / 2,
              y: house.y + plotSize.h / 2 - houseConfig.h / 2,
              width: houseConfig.w,
              height: houseConfig.h
          });
      }

      trees.forEach(t => {
          others.push({
              x: t.x + plotSize.w / 2 - 10, // 10 - это половина ширины дерева (20/2)
              y: t.y + plotSize.h / 2 - 10,
              width: 20,
              height: 20
          });
      });

      garages.forEach(g => {
          others.push({
              x: g.x + plotSize.w / 2 - g.width / 2,
              y: g.y + plotSize.h / 2 - g.height / 2,
              width: g.width,
              height: g.height
          });
      });

      gardenBeds.forEach(b => {
          others.push({
              x: b.x + plotSize.w / 2 - b.width / 2,
              y: b.y + plotSize.h / 2 - b.height / 2,
              width: b.width,
              height: b.height
          });
      });

      return others;
  };

  // 
const handleSceneClick = async (coords) => {
    if (showResult) return;

    const plotData = { width: plotSize.w, height: plotSize.h };
    const others = getExistingOthers(); // Собирает все объекты в формате {x, y, width, height}

    // --- ВЕСНА: ДОМ ---
    if (season === 'SPRING') {
      const houseW = houseConfig.w;
      const houseH = houseConfig.h;
      const apiX = coords.x + (plotSize.w / 2) - (houseW / 2);
      const apiY = coords.y + (plotSize.h / 2) - (houseH / 2);

      const result = await checkHouse(plotData, { x: apiX, y: apiY, width: houseW, height: houseH }, others);
      
      if (result.violation) {
        setNotification(result);
        return;
      }
      setHouse({ x: coords.x, y: coords.y });
    } 

    // --- ЛЕТО ---
    else if (season === 'SUMMER') {
      if (activeTool === 'ERASER') {
         // ... логика ластика ...
         return;
      }

      let toolW = 0, toolH = 0, apiCall = null;

      if (activeTool === 'TREE' || activeTool === 'APPLE') {
        toolW = 20; toolH = 20; apiCall = checkTree;
      } else if (activeTool === 'GARAGE') {
        toolW = 40; toolH = 60; apiCall = checkGarage;
      } else if (activeTool === 'CARROT' || activeTool === 'POTATO') {
        toolW = 30; toolH = 50; apiCall = checkGardenBed;
      }

      if (apiCall) {
        const apiX = coords.x + (plotSize.w / 2) - (toolW / 2);
        const apiY = coords.y + (plotSize.h / 2) - (toolH / 2);

        const result = await apiCall(plotData, { x: apiX, y: apiY, width: toolW, height: toolH }, others);
        
        if (result.violation) {
          setNotification(result);
          return;
        }

        // Если прошли проверку, добавляем в стейт
        if (activeTool === 'TREE' || activeTool === 'APPLE') {
          setTrees(prev => [...prev, { x: coords.x, y: coords.y, id: Date.now(), type: activeTool === 'APPLE' ? 'apple' : 'default' }]);
        } else if (activeTool === 'GARAGE') {
          setGarages(prev => [...prev, { x: coords.x, y: coords.y, width: 40, height: 60, id: Date.now() }]);
        } else {
          setGardenBeds(prev => [...prev, { x: coords.x, y: coords.y, width: 30, height: 50, type: activeTool.toLowerCase(), id: Date.now() }]);
        }
      }
    }
    // --- ОСЕНЬ: СБОР УРОЖАЯ ---
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
        onPlotClick={handleSceneClick} onZoomIn={handleZoomInRef} onZoomOut={handleZoomOutRef}
      />
      {!showResult ? (
        // Режим редактирования — справа внизу
        // <div 
        //   style={{
        //     position: 'absolute',
        //     bottom: '20px',
        //     right: '20px',
        //     display: 'flex',
        //     flexDirection: 'column',
        //     gap: '8px',
        //     zIndex: 10,
        //     pointerEvents: 'auto',
        //   }}
        // >
        <div 
          style={{
            position: 'fixed',   // ← ВАЖНО
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 100,         // ← ВАЖНО (больше, чем у canvas)
            pointerEvents: 'auto',
          }}
        >

          <button className="zoom-btn" onClick={() => zoomInFn?.()}>
            +
          </button>
          <button className="zoom-btn" onClick={() => zoomOutFn?.()}>
            –
          </button>
        </div>
      ) : (
        // Режим просмотра — слева внизу
        // <div 
        //   style={{
        //     position: 'absolute',
        //     bottom: '20px',
        //     left: '20px',
        //     display: 'flex',
        //     flexDirection: 'column',
        //     gap: '8px',
        //     zIndex: 10,
        //     pointerEvents: 'auto',
        //   }}
        // >
        <div 
          style={{
            position: 'fixed',   // ← ВАЖНО
            bottom: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 100,
            pointerEvents: 'auto',
          }}
        >

          <button className="zoom-btn" onClick={() => zoomInFn?.()}>
            +
          </button>
          <button className="zoom-btn" onClick={() => zoomOutFn?.()}>
            –
          </button>
        </div>
      )}

      {notification && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9, 
        }}
        onClick={(e) => e.stopPropagation()}
      />
    )}
      {!showResult && (
        <>
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
            <div 
              className="notification" 
              style={{
                background: '#FFEBEE', 
                color: '#D32F2F', 
                border: '1px solid #FFCDD2', 
                borderRadius: 12, 
                boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                zIndex: 20, // ← обязательно выше оверлея!
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '16px 24px',
                maxWidth: '90vw',
                textAlign: 'center',
              }}
              // Останавливаем всплытие клика из уведомления
              onClick={(e) => e.stopPropagation()}
            >
            {/* {notification && (
            <div className="notification" style={{
              background: '#FFEBEE', color: '#D32F2F', 
              border: '1px solid #FFCDD2', borderRadius: 12, boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
            }}> */}
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
                 <li><span> Иголки</span> <span className="stat-val">{harvestStats.leaves}</span></li>
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