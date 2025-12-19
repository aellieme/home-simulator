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
