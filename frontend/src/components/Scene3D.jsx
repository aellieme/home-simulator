// Scene3D.jsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Scene3D({ season, house, trees, garages, onPlotClick, plotSize = { w: 800, h: 800 }, houseConfig = { w: 100, h: 100 } }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const houseRef = useRef(null)
  
  const onPlotClickRef = useRef(onPlotClick)

  useEffect(() => {
    onPlotClickRef.current = onPlotClick
  }, [onPlotClick])

  // иниц-я сцены
  useEffect(() => {
    const width = window.innerWidth
    const height = window.innerHeight

    // Создаем сцену
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe0f7fa)
    sceneRef.current = scene

    // Камера
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000)
    camera.position.set(0, 600, 800)
    camera.lookAt(0, 0, 0)

    // Рендер
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    
    // Очищаем контейнер перед добавлением 
    if (mountRef.current) {
        mountRef.current.innerHTML = ''
        mountRef.current.appendChild(renderer.domElement)
    }

    // Свет
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8)
    hemiLight.position.set(0, 200, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(100, 200, 100)
    dirLight.castShadow = true
    scene.add(dirLight)

    // Обработка клика
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)

      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name === "ground") {
          const point = intersects[i].point
          if (onPlotClickRef.current) {
            onPlotClickRef.current({ x: point.x, y: point.z }) 
          }
          break
        }
      }
    }

    window.addEventListener('click', onMouseClick)

    // Анимация
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Ресайз
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Очистка при удалении компонента
    return () => {
      window.removeEventListener('click', onMouseClick)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, []) 

  // обновление земли
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Удаляем старую землю
    const toRemove = []
    scene.traverse(child => {
        if (child.name === 'ground' || child.type === 'GridHelper') {
            toRemove.push(child)
        }
    })
    toRemove.forEach(child => scene.remove(child))

    // Новая земля
    const geometry = new THREE.PlaneGeometry(plotSize.w, plotSize.h)
    const material = new THREE.MeshStandardMaterial({ color: 0x81c784 }) 
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = "ground"
    scene.add(ground)

    // Новая сетка
    const gridHelper = new THREE.GridHelper(Math.max(plotSize.w, plotSize.h), 20)
    scene.add(gridHelper)

  }, [plotSize])

  //обновление деревьев
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const oldTrees = []
    scene.traverse(obj => {
      if (obj.name === 'tree_group') oldTrees.push(obj)
    })
    oldTrees.forEach(t => scene.remove(t))

    // рисуем новые деревья
    if (trees && trees.length > 0) {
      trees.forEach(treeData => {
        const group = new THREE.Group()
        group.name = 'tree_group'
        group.position.set(treeData.x, 0, treeData.y)

        // Ствол
        const trunkGeom = new THREE.CylinderGeometry(5, 5, 20)
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
        const trunk = new THREE.Mesh(trunkGeom, trunkMat)
        trunk.position.y = 10
        group.add(trunk)

        // Листва
        let leafColor = 0x2e7d32
        if (season === 'AUTUMN') leafColor = 0xff9800; // Осень (рыжий)
        if (treeData.harvested) leafColor = 0x8d6e63; // Собрано (коричневый)
        const leavesGeom = new THREE.ConeGeometry(15, 50, 8)
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
        const leaves = new THREE.Mesh(leavesGeom, leavesMat)
        leaves.position.y = 45
        group.add(leaves)

        scene.add(group)
      })
    }
  }, [trees, season])

  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const oldGarages = []; scene.traverse(obj => { if (obj.name === 'garage_mesh') oldGarages.push(obj) });
    oldGarages.forEach(t => scene.remove(t));

    if (garages && garages.length > 0) {
        garages.forEach(g => {
            // Рисуем гараж как серый параллелепипед
            const geometry = new THREE.BoxGeometry(g.width, 30, g.height);
            const material = new THREE.MeshStandardMaterial({ color: 0x757575 }); // Серый
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(g.x, 15, g.y); // Высота 30/2 = 15
            mesh.name = 'garage_mesh';
            mesh.castShadow = true;
            scene.add(mesh);
        })
    }
  }, [garages])

  // обновление дома
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (houseRef.current) {
      scene.remove(houseRef.current)
      houseRef.current = null
    }

    if (house) {
      const loader = new GLTFLoader()
      loader.load(
        '/models/house.glb', 
        (gltf) => {
          const model = gltf.scene
          model.position.set(house.x, 0, house.y)
          
          const scaleFactor = houseConfig.w / 5; // Коэффициент масштаба
          model.scale.set(scaleFactor, scaleFactor, scaleFactor); // Равномерное масштабирование
          // const scaleX = houseConfig.w / 5 
          // const scaleZ = houseConfig.h / 5
          // model.scale.set(scaleX, 40, scaleZ)

          model.traverse((child) => {
            if (child.isMesh) child.castShadow = true
          })

          scene.add(model)
          houseRef.current = model
        },
        undefined, 
        (error) => {
          // Фолбек куб
          const geometry = new THREE.BoxGeometry(houseConfig.w, 50, houseConfig.h) 
          const material = new THREE.MeshStandardMaterial({ color: 0xff5722 })
          const cube = new THREE.Mesh(geometry, material)
          cube.position.set(house.x, 25, house.y)
          scene.add(cube)
          houseRef.current = cube
        }
      )
    }
  }, [house, houseConfig])

  return <div ref={mountRef} className="scene-container" />
}