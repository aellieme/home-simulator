import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Scene3D({ house }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe0f7fa)

    const camera = new THREE.PerspectiveCamera(
      60,
      400 / 300,
      0.1,
      1000
    )
    camera.position.set(0, 200, 300)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(400, 300)
    mountRef.current.appendChild(renderer.domElement)

    // свет
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(100, 200, 100)
    scene.add(light)

    // участок
    const groundGeo = new THREE.PlaneGeometry(400, 400)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x81c784 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // дом
    if (house) {
      const houseGeo = new THREE.BoxGeometry(
        house.width,
        80,
        house.height
      )
      const houseMat = new THREE.MeshStandardMaterial({
        color: 0xffcc80,
      })
      const houseMesh = new THREE.Mesh(houseGeo, houseMat)

      houseMesh.position.set(
        house.x - 200 + house.width / 2,
        40,
        house.y - 200 + house.height / 2
      )

      scene.add(houseMesh)
    }

    function animate() {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      mountRef.current.removeChild(renderer.domElement)
    }
  }, [house])

  return <div ref={mountRef} />
}
