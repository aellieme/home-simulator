import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Scene3D({ 
  season, 
  house, 
  trees, 
  garages, 
  gardenBeds, 
  cctv, 
  viewMode,
  onPlotClick, 
  plotSize = { w: 800, h: 800 }, 
  houseConfig = { w: 100, h: 100 } 
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const houseRef = useRef(null)
  const cameraRef = useRef(null)
  const onPlotClickRef = useRef(onPlotClick)

  useEffect(() => { onPlotClickRef.current = onPlotClick }, [onPlotClick])

  
  useEffect(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xe0f7fa)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000)
    cameraRef.current = camera
    camera.position.set(0, 600, 800)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    
    if (mountRef.current) {
        mountRef.current.innerHTML = ''
        mountRef.current.appendChild(renderer.domElement)
    }

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8)
    hemiLight.position.set(0, 200, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(100, 200, 100)
    dirLight.castShadow = true
    scene.add(dirLight)

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

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('click', onMouseClick)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, []) 

  useEffect(() => {
      const camera = cameraRef.current
      if (!camera) return
      if (viewMode === '2D') {
          camera.position.set(0, 1000, 0)
          camera.lookAt(0, 0, 0)
      } else {
          camera.position.set(0, 600, 800)
          camera.lookAt(0, 0, 0)
      }
  }, [viewMode])

  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const toRemove = []; scene.traverse(c => { if (c.name === 'ground' || c.type === 'GridHelper') toRemove.push(c) });
    toRemove.forEach(c => scene.remove(c));

    const geometry = new THREE.PlaneGeometry(plotSize.w, plotSize.h)
    const material = new THREE.MeshStandardMaterial({ color: 0x81c784 }) 
    const ground = new THREE.Mesh(geometry, material)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = "ground"
    scene.add(ground)
    scene.add(new THREE.GridHelper(Math.max(plotSize.w, plotSize.h), 20))
  }, [plotSize])

  // basic ДЕРЕВЬЯ И ЯБЛОНИ ---
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const oldTrees = []; scene.traverse(o => { if (o.name === 'tree_group') oldTrees.push(o) });
    oldTrees.forEach(t => scene.remove(t));

    if (trees && trees.length > 0) {
      const loader = new GLTFLoader()

      trees.forEach(treeData => {
        const group = new THREE.Group()
        group.name = 'tree_group'
        group.position.set(treeData.x, 0, treeData.y)

        // Если это ЯБЛОНЯ
        if (treeData.type === 'apple') {
             // Пробуем загрузить GLB
             loader.load('/models/apple_tree.glb', (gltf) => {
                 const model = gltf.scene.clone() // Клонируем, чтобы использовать много раз
                 model.scale.set(10, 10, 10) // Настройте масштаб
                 // Если осень - можно покрасить листья, но у GLB сложнее менять материалы динамически без обхода
                 // Если собрано - можно сделать полупрозрачным или скрыть яблоки
                 if (treeData.harvested) model.visible = false; // Условно "собрали" -> исчезло (или замените на пень)
                 group.add(model)
             }, undefined, () => {
                 // Фолбек, если модели нет: Красное дерево
                 const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20), new THREE.MeshStandardMaterial({ color: 0x5d4037 }))
                 trunk.position.y = 10; group.add(trunk)
                 const leaves = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), new THREE.MeshStandardMaterial({ color: 0xff1744 })) // Красная крона
                 leaves.position.y = 40; group.add(leaves)
             })
        } 
        // ОБЫЧНОЕ ДЕРЕВО
        else {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }))
            trunk.position.y = 10
            group.add(trunk)

            let leafColor = 0x2e7d32
            if (season === 'AUTUMN') leafColor = 0xff9800
            if (treeData.harvested) leafColor = 0x8d6e63 // Коричневый (голые ветки)
            
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(15, 50, 8), new THREE.MeshStandardMaterial({ color: leafColor }))
            leaves.position.y = 45
            group.add(leaves)
        }
        
        scene.add(group)
      })
    }
  }, [trees, season])

  // ГРЯДКИ 
  useEffect(() => {
      const scene = sceneRef.current; if (!scene) return;
      const old = []; scene.traverse(o => { if (o.name === 'garden_bed') old.push(o) });
      old.forEach(t => scene.remove(t));
      
      if (gardenBeds && gardenBeds.length > 0) {
          gardenBeds.forEach(bed => {
              const group = new THREE.Group()
              group.name = 'garden_bed'
              group.position.set(bed.x, 0, bed.y)

              // Основа грядки (земля)
              const earth = new THREE.Mesh(
                  new THREE.BoxGeometry(bed.width, 5, bed.height),
                  new THREE.MeshStandardMaterial({ color: 0x5d4037 }) // Темно-коричневый
              )
              earth.position.y = 2.5
              group.add(earth)

              // Растения (если не собраны)
              if (!bed.harvested) {
                  // Цвет: Морковь (Оранжевый) / Картошка (Зеленый)
                  const plantColor = bed.type === 'carrot' ? 0xff6d00 : 0x2e7d32
                  // Создаем несколько мелких элементов сверху
                  for(let i=-1; i<=1; i++){
                      const plant = new THREE.Mesh(
                          new THREE.ConeGeometry(3, 8, 5),
                          new THREE.MeshStandardMaterial({ color: plantColor })
                      )
                      plant.position.set(i * 8, 8, 0)
                      group.add(plant)
                  }
              }
              
              scene.add(group)
          })
      }
  }, [gardenBeds])

  // --- ГАРАЖИ ---
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const old = []; scene.traverse(o => { if (o.name === 'garage_mesh') old.push(o) });
    old.forEach(t => scene.remove(t));
    if (garages) garages.forEach(g => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.width, 30, g.height), new THREE.MeshStandardMaterial({ color: 0x757575 }))
        mesh.position.set(g.x, 15, g.y); mesh.name = 'garage_mesh'; mesh.castShadow = true; scene.add(mesh)
    })
  }, [garages])

  // --- ДОМ + CCTV ---
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    if (houseRef.current) { scene.remove(houseRef.current); houseRef.current = null; }

    if (house) {
      const group = new THREE.Group()
      group.position.set(house.x, 0, house.y)

      const loader = new GLTFLoader()
      loader.load('/models/house.glb', (gltf) => {
          const model = gltf.scene
          const scale = houseConfig.w / 5
          model.scale.set(scale, scale, scale)
          model.traverse(c => { if(c.isMesh) c.castShadow = true })
          group.add(model)
      }, undefined, () => {
          const cube = new THREE.Mesh(new THREE.BoxGeometry(houseConfig.w, 50, houseConfig.h), new THREE.MeshStandardMaterial({ color: 0xff5722 }))
          cube.position.y = 25
          group.add(cube)
      })

      if (cctv) {
          const camMesh = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), new THREE.MeshBasicMaterial({ color: 0x2979ff }))
          camMesh.position.set(0, 40, 0) 
          group.add(camMesh)
      }

      scene.add(group)
      houseRef.current = group
    }
  }, [house, houseConfig, cctv])

  return <div ref={mountRef} className="scene-container" />
}