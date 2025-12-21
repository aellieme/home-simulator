// frontend\src\api.js
export async function checkHouse(plot, house) {
  const response = await fetch('http://127.0.0.1:8000/check-house', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plot,
      house
    })
  })

  return await response.json()
}
// Добавьте это к остальному коду в api.js
export async function checkTree(plot, tree) {
  const response = await fetch('http://127.0.0.1:8000/check-tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot, tree })
  })
  return await response.json()
}

export async function checkGarage(plot, garage) {
  const response = await fetch('http://127.0.0.1:8000/check-garage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot, garage })
  })
  return await response.json()
}