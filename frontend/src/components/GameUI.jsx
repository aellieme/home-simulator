import React from 'react'
import './GameUI.css'

export default function GameUI({
  season, setSeason,
  plotSize, setPlotSize,
  houseConfig, setHouseConfig,
  activeTool, setActiveTool,
  house,
  cctv, setCctv,
  harvestStats,
  isMenuCollapsed, setIsMenuCollapsed,
  onFinishProject
}) {
  
  // Компонент одной "таблетки" сезона
  const SeasonTab = ({ id, label }) => (
    <button 
      className={`season-tab ${season === id ? 'active' : ''}`} 
      onClick={() => setSeason(id)}
      data-season={id}
    >
      {label}
    </button>
  )

  // Если меню свернуто, показываем мини-версию
  if (isMenuCollapsed) {
    return (
      <div className="game-ui-card collapsed">
        <div style={{ fontWeight: 800, color: '#2C3E2D' }}>
          {season === 'WINTER' && 'Зима'}
          {season === 'SPRING' && 'Весна'}
          {season === 'SUMMER' && 'Лето'}
          {season === 'AUTUMN' && 'Осень'}
        </div>
        <button className="collapse-btn" onClick={() => setIsMenuCollapsed(false)}>
          ↙
        </button>
      </div>
    )
  }

  return (
    <div className="game-ui-card">
      {/* Шапка */}
      <div className="ui-header">
        <div>
          <h1 className="ui-title">Дом Мечты</h1>
          <p className="ui-subtitle">Симулятор участка</p>
        </div>
        <button className="collapse-btn" onClick={() => setIsMenuCollapsed(true)}>
          —
        </button>
      </div>

      {/* Сезоны */}
      <div className="season-tabs">
        <SeasonTab id="WINTER" label="Зима" />
        <SeasonTab id="SPRING" label="Весна" />
        <SeasonTab id="SUMMER" label="Лето" />
        <SeasonTab id="AUTUMN" label="Осень" />
      </div>

      {/* Контент ЗИМА */}
      {season === 'WINTER' && (
        <div className="ui-section">
          <div className="section-label">Настройки участка</div>
          <div className="input-group">
            <div className="input-row">
              {/* <span>Ширина участка (м)</span>
                <input
                  type="number"
                  value={plotSize.w / 10}
                  onChange={e =>
                    setPlotSize({ ...plotSize, w: +e.target.value * 10 })
                  }
                /> */}

              <span>Ширина участка (м)</span>
              <input 
                type="number" 
                className="styled-input"
                value={plotSize.w/10} 
                onChange={e => setPlotSize({...plotSize, w: +e.target.value})} 
              />
            </div>
            <div className="input-row">
              <span>Длина участка (м)</span>
              <input 
                type="number" 
                className="styled-input"
                value={plotSize.h/10} 
                onChange={e => setPlotSize({...plotSize, h: +e.target.value})} 
              />
            </div>
            <div className="input-row">
              <span>Размер дома (м)</span>
              <input 
                type="number" 
                className="styled-input"
                value={houseConfig.w/10} 
                onChange={e => setHouseConfig({w: +e.target.value * 10, h: +e.target.value* 10})} 
              />
            </div>
          </div>
          <p className="ui-subtitle">Настройте параметры перед началом строительства.</p>
        </div>
      )}

      {/* Контент ВЕСНА */}
      {season === 'SPRING' && (
        <div className="ui-section">
          <div className="section-label">Этап строительства</div>
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#4F6D53' }}>
            {house ? (
              <h3> Дом размещен</h3>
            ) : (
              <h3>Кликните по участку,<br/>чтобы построить дом</h3>
            )}
            <p className="ui-subtitle">Размер: {houseConfig.w}x{houseConfig.h}</p>
          </div>
        </div>
      )}

      {/* Контент ЛЕТО */}
      {season === 'SUMMER' && (
        <div className="ui-section">
          <div className="section-label">Благоустройство</div>
          
          <div className="tools-grid">
            <button 
              className={`tool-card ${activeTool === 'TREE' ? 'active' : ''}`}
              onClick={() => setActiveTool('TREE')}
            >
              {/* <span className="tool-icon">🌳</span> */}
              <span className="tool-name">Лиственница</span>
            </button>
            <button
            className={`tool-card ${activeTool === 'APPLE' ? 'active' : ''}`}
              onClick={() => setActiveTool('APPLE')}
            >
              {/* <span className="tool-icon">🍎</span> */}
              <span className="tool-name">Яблоня</span>
            </button>
            <button 
              className={`tool-card ${activeTool === 'GARAGE' ? 'active' : ''}`}
              onClick={() => setActiveTool('GARAGE')}
            >
              {/* <span className="tool-icon">🛖</span> */}
              <span className="tool-name">Гараж</span>
            </button>
            <button 
              className={`tool-card ${activeTool === 'CARROT' ? 'active' : ''}`}
              onClick={() => setActiveTool('CARROT')}
            >
              {/* <span className="tool-icon">🥕</span> */}
              <span className="tool-name">Морковь</span>
            </button>
            <button 
              className={`tool-card ${activeTool === 'POTATO' ? 'active' : ''}`}
              onClick={() => setActiveTool('POTATO')}
            >
              {/* <span className="tool-icon">🥔</span> */}
              <span className="tool-name">Картофель</span>
            </button>
            <button 
              className={`tool-card eraser ${activeTool === 'ERASER' ? 'active' : ''}`}
              onClick={() => setActiveTool('ERASER')}
            >
              {/* <span className="tool-icon">✖️</span> */}
              <span className="tool-name">Удалить</span>
            </button>
          </div>
        </div>
      )}

      {/* Контент ОСЕНЬ */}
      {season === 'AUTUMN' && (
        <div className="ui-section">
          <div className="section-label">Итоги сезона</div>
          <ul className="stats-list">
             <li><span> Иголки</span> <span className="stat-val">{harvestStats.leaves}</span></li>
             <li><span> Яблоки</span> <span className="stat-val">{harvestStats.apples}</span></li>
             <li><span> Морковь</span> <span className="stat-val">{harvestStats.carrots}</span></li>
             <li><span> Картофель</span> <span className="stat-val">{harvestStats.potatoes}</span></li>
          </ul>
          
          {house ? (
             <button 
               className={`secondary-btn ${cctv ? 'active' : ''}`}
               onClick={() => setCctv(!cctv)}
             >
               {cctv ? ' Антенна поставлена' : ' Установить антенну для связи'}
             </button>
          ) : (
            <div className="ui-subtitle" style={{textAlign: 'center'}}>Постройте дом весной, чтобы улучшать его.</div>
          )}
        </div>
      )}

    </div>
  )
}