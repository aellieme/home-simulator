export default function SeasonBar({ season, setSeason }) {
  return (
    <div className="seasons">
      <button onClick={() => setSeason('WINTER')}>Зима</button>
      <button onClick={() => setSeason('SPRING')}>Весна</button>
      <button onClick={() => setSeason('SUMMER')}>Лето</button>
      <button onClick={() => setSeason('AUTUMN')}>Осень</button>
      <p>Текущий сезон: {season}</p>
    </div>
  )
}
