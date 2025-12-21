// frontend\src\api.js
export async function checkHouse(plot, house, others) {
  const response = await fetch('http://127.0.0.1:8000/check-house', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plot,
      house,
      others
    })
  })

  return await response.json()
}
export async function checkTree(plot, tree, others) {
  const response = await fetch('http://127.0.0.1:8000/check-tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot, tree, others })
  })
  return await response.json()
}

export async function checkGarage(plot, garage, others) {
  const response = await fetch('http://127.0.0.1:8000/check-garage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot, garage, others })
  })
  return await response.json()
}

export async function checkGardenBed(plot, bed, others) {
  const response = await fetch('http://127.0.0.1:8000/check-garden-bed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plot, garage: bed, others }) 
  })
  return await response.json()
}
