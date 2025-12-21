// Scene3D.jsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { createFallbackAppleTree, createRoofEquipment } from './SceneHelpers.jsx'


export default function Scene3D({ 
  season, house, trees, garages, gardenBeds, cctv, viewMode, onPlotClick, 
  plotSize = { w: 800, h: 800 }, houseConfig = { w: 100, h: 100 }, onZoomIn,
  onZoomOut, 
}) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const houseRef = useRef(null)
  const cameraRef = useRef(null)
  const onPlotClickRef = useRef(onPlotClick)
  const hemiLightRef = useRef(null);

  const zoomIn = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    // Уменьшаем distance до цели (0,0,0)
    const target = new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3();
    dir.subVectors(camera.position, target).normalize();
    camera.position.addScaledVector(dir, -50); // приблизить на 50 единиц
    camera.lookAt(target);
    if (onZoomIn) onZoomIn();
  };
  const zoomOut = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const target = new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3();
    dir.subVectors(camera.position, target).normalize();
    camera.position.addScaledVector(dir, 50); // отдалить на 50 единиц
    camera.lookAt(target);
    if (onZoomOut) onZoomOut();
  };


  useEffect(() => { onPlotClickRef.current = onPlotClick }, [onPlotClick])

  useEffect(() => {
    const width = window.innerWidth; const height = window.innerHeight
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe0f7fa); sceneRef.current = scene
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000); cameraRef.current = camera
    camera.position.set(0, 600, 800); camera.lookAt(0, 0, 0)
    
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.setSize(width, height); renderer.shadowMap.enabled = true
    if (mountRef.current) { mountRef.current.innerHTML = ''; mountRef.current.appendChild(renderer.domElement) }

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight; 

    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(500, 800, 300); // выше и дальше — мягче тени
    dirLight.castShadow = true;
    // Настройка теней (чтобы не было "пиксельных" артефактов)
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 2000;
    scene.add(dirLight);
    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); hemiLight.position.set(0, 200, 0); scene.add(hemiLight)
    // const dirLight = new THREE.DirectionalLight(0xffffff, 1); dirLight.position.set(100, 200, 100); dirLight.castShadow = true; scene.add(dirLight)
    // const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); dirLight.position.set(100, 200, 100); dirLight.castShadow = true; scene.add(dirLight)


    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2()
    const onMouseClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, camera); const intersects = raycaster.intersectObjects(scene.children, true) // true = рекурсивно искать детей
      for (let i = 0; i < intersects.length; i++) {
        // Ищем клик только по земле
        if (intersects[i].object.name === "ground") {
          if (onPlotClickRef.current) onPlotClickRef.current({ x: intersects[i].point.x, y: intersects[i].point.z }) 
          break
        }
      }
    }
    window.addEventListener('click', onMouseClick)
    let animationId
    const animate = () => { animationId = requestAnimationFrame(animate); renderer.render(scene, camera) }
    animate()
    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight) }
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('click', onMouseClick); window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationId); if (mountRef.current) mountRef.current.innerHTML = '' }
  }, []) 
  
  useEffect(() => {
    if (onZoomIn && onZoomOut) {
      onZoomIn(zoomIn);
      onZoomOut(zoomOut);
    }
  }, [onZoomIn, onZoomOut]);

  // --- УПРАВЛЕНИЕ КАМЕРОЙ (2D/3D) ---
  useEffect(() => {
      const camera = cameraRef.current; if (!camera) return
      if (viewMode === '2D') { 
          // Плавный переход не обязателен, но позиция строго сверху
          camera.position.set(0, 1200, 0); 
          camera.lookAt(0, 0, 0) 
      } else { 
          // Стандартный изометрический вид
          camera.position.set(0, 600, 800); 
          camera.lookAt(0, 0, 0) 
      }
  }, [viewMode])
  useEffect(() => {
    const hemi = hemiLightRef.current;
    if (!hemi) return;

    if (season === 'WINTER') {
      hemi.intensity = 1.0; 
      hemi.groundColor.setHex(0xf0f0f0); // чуть тёплый белый (не чистый 0xffffff)
    } else {
      hemi.intensity = 0.8;
      hemi.groundColor.setHex(0x909060); // светло-серо-зелёный — естественнее для травы
    }
  }, [season]);
  // --- ОСВЕЩЕНИЕ ПО СЕЗОНАМ ---
  // useEffect(() => {
  //   const hemi = hemiLightRef.current;
  //   if (!hemi) return;

  //   if (season === 'WINTER') {
  //     hemi.groundColor.setHex(0xffffff); // белый отражённый свет → белый снег
  //   } else {
  //     hemi.groundColor.setHex(0x444444); // стандартный
  //   }
  // }, [season]);


  // --- ЗЕМЛЯ ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const toRemove = [];
    scene.traverse(c => {
      if (c.name === 'ground' || c.type === 'GridHelper') {
        toRemove.push(c);
      }
    });
    toRemove.forEach(c => scene.remove(c));

    // Земля

    // В useEffect для земли:
    const groundColor = season === 'WINTER' 
      ? 0xf8f8f8   // не чистый белый, а чуть тёплый — выглядит как снег
      : 0x88cc88;  // чуть ярче оригинального 0x81c784

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(plotSize.w, plotSize.h),
      new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: season === 'WINTER' ? 0.9 : 0.95, // ← снег матовый! (0.9 — не 0.4)
        metalness: 0,
      })
    );
    // const groundColor = season === 'WINTER' ? 0xffffff : 0x81c784;

    // const ground = new THREE.Mesh(
    //   new THREE.PlaneGeometry(plotSize.w, plotSize.h),
    //   new THREE.MeshStandardMaterial({
    //     color: groundColor,
    //     roughness: season === 'WINTER' ? 0.4 : 0.8,
    //     metalness: 0,
    //   })

      // new THREE.MeshStandardMaterial({
      //   color: groundColor,
      //   roughness: 0.8
      // })
    // );

    // const groundColor = season === 'WINTER' ? 0xfff : 0x81c784;
    // const ground = new THREE.Mesh(
    //   new THREE.PlaneGeometry(plotSize.w, plotSize.h),
    //   new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.8 })
    // );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // Сетка — стандартные цвета THREE.js
    const grid = new THREE.GridHelper(
      Math.max(plotSize.w, plotSize.h),
      20
    );
    scene.add(grid);

  }, [plotSize, season]);



  // useEffect(() => {
  //   const scene = sceneRef.current; if (!scene) return;
  //   const toRemove = []; scene.traverse(c => { if (c.name === 'ground' || c.type === 'GridHelper') toRemove.push(c) });
  //   toRemove.forEach(c => scene.remove(c));
  //   const groundColour = season === 'WINTER' ? 0xffffff : 0x81c784
  //   const ground = new THREE.Mesh(new THREE.PlaneGeometry(plotSize.w, plotSize.h), new THREE.MeshStandardMaterial({ color: 0x81c784 }))
  //   ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = "ground"; scene.add(ground)
  //   scene.add(new THREE.GridHelper(Math.max(plotSize.w, plotSize.h), 20))
  // }, [plotSize, season])


  // --- ДЕРЕВЬЯ ---
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    const oldTrees = []; scene.traverse(o => { if (o.name === 'tree_group') oldTrees.push(o) });
    oldTrees.forEach(t => scene.remove(t));

    if (trees && trees.length > 0) {
      const loader = new GLTFLoader()

      trees.forEach(treeData => {
        const group = new THREE.Group(); group.name = 'tree_group'; group.position.set(treeData.x, 0, treeData.y)

        // if (treeData.type === 'apple') {
        //      // ЯБЛОНЯ
        //     loader.load('/models/apple_tree.glb', (gltf) => {
        //         const model = gltf.scene.clone(); 
        //         model.scale.set(15, 15, 15); // Чуть крупнее
        //         if (treeData.harvested) model.visible = false;
        //         group.add(model);
        //         console.log("Apple model bounding box:", new THREE.Box3().setFromObject(model));
        //         model.traverse(child => {
        //           if (child.isMesh) {
        //             child.castShadow = true;
        //             child.receiveShadow = true;
        //           }
        //           });
        //         console.log("Apple tree loaded successfully");
        //     }, undefined, (err) => {console.error("Error loading apple tree model:", err);
        //         console.log("Fallback apple tree used");
        //         const fallback = createFallbackAppleTree()
        //         // Если собрано - скрываем яблоки 
        //         if (treeData.harvested) {
        //             // Можно удалить красные яблоки из группы fallback
        //             fallback.children = fallback.children.filter(c => c.geometry.type !== 'SphereGeometry' || c.material.color.getHex() !== 0xd50000)
        //         }
        //         group.add(fallback)
        //     })
        // }
        if (treeData.type === 'apple') {
          loader.load('/models/apple_tree.glb', (gltf) => {
            const model = gltf.scene.clone();

            // --- ВАЖНО: центровка по Y, чтобы низ модели был на уровне земли (y=0) ---
            const box = new THREE.Box3().setFromObject(model);
            const offsetY = -box.min.y; // поднимаем на |min.y|, чтобы min.y стал 0
            model.position.y = offsetY;

            // Лог для проверки
            const newSize = box.getSize(new THREE.Vector3());
            console.log(` Apple tree: size=${newSize.x.toFixed(1)}×${newSize.y.toFixed(1)}×${newSize.z.toFixed(1)}, offset Y=${offsetY.toFixed(1)}`);

            // Масштаб (15 — много для некоторых моделей; начните с 5-10)
            model.scale.set(150, 150, 150);

            // Принудительная настройка материалов (убираем прозрачность/неправильные шейдеры)
            model.traverse(child => {
              if (child.isMesh) {
                if (child.material) {
                  // Отключаем alphaTest и transparent, если вдруг модель "прозрачная"
                  if (Array.isArray(child.material)) {
                    child.material.forEach(m => {
                      m.transparent = false;
                      m.opacity = 1;
                      m.depthWrite = true;
                    });
                  } else {
                    child.material.transparent = false;
                    child.material.opacity = 1;
                    child.material.depthWrite = true;
                  }
                }
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            // if (treeData.harvested) model.visible = false;
            group.add(model);
            scene.add(group);
          }, undefined, (err) => {
            console.error(" Apple tree load failed → using fallback", err);
            group.add(createFallbackAppleTree());
            scene.add(group);
          });
        }
        else {
            // ОБЫЧНОЕ
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }))
            trunk.position.y = 10; group.add(trunk)
            let leafColor = 0x2e7d32
            if (season === 'AUTUMN') leafColor = 0xff9800
            if (treeData.harvested) leafColor = 0x8d6e63
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(15, 50, 8), new THREE.MeshStandardMaterial({ color: leafColor }))
            leaves.position.y = 45; group.add(leaves)
        }
        scene.add(group)
      })
    }
  }, [trees, season])

  // --- ГРЯДКИ ---
  useEffect(() => {
      const scene = sceneRef.current; if (!scene) return;
      const old = []; scene.traverse(o => { if (o.name === 'garden_bed') old.push(o) });
      old.forEach(t => scene.remove(t));
      if (gardenBeds) gardenBeds.forEach(bed => {
          const group = new THREE.Group(); group.name = 'garden_bed'; group.position.set(bed.x, 0, bed.y)
          const earth = new THREE.Mesh(new THREE.BoxGeometry(bed.width, 5, bed.height), new THREE.MeshStandardMaterial({ color: 0x5d4037 }))
          earth.position.y = 2.5; group.add(earth)
          if (!bed.harvested) {
              const plantColor = bed.type === 'carrot' ? 0xff6d00 : 0x2e7d32
              for(let i=-1; i<=1; i++){
                  const plant = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 5), new THREE.MeshStandardMaterial({ color: plantColor }))
                  plant.position.set(i * 8, 8, 0); group.add(plant)
              }
          }
          scene.add(group)
      })
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
    
    // Очистка старого
    if (houseRef.current) { scene.remove(houseRef.current); houseRef.current = null; }

    if (house) {
      const group = new THREE.Group()
      group.position.set(house.x, 0, house.y)

      const loader = new GLTFLoader()
      
      loader.load('/models/house.glb', (gltf) => {
          const model = gltf.scene; 
          
          // 1. Масштабируем модель
          const scale = houseConfig.w / 5
          model.scale.set(scale, scale, scale) 
          model.traverse(c => { if(c.isMesh) c.castShadow = true })
          
          // Добавляем модель в группу, чтобы Box3 правильно посчитал границы
          group.add(model)

          // 2. !!! ВЫЧИСЛЯЕМ РЕАЛЬНУЮ ВЫСОТУ !!!
          // Создаем "коробку", которая обтягивает модель
          const box = new THREE.Box3().setFromObject(model)
          // box.max.y - это самая верхняя точка модели (пик крыши)
          const realRoofHeight = box.max.y

          // 3. Ставим оборудование ровно на найденную высоту
          if (cctv) {
              const equipment = createRoofEquipment()
              equipment.position.y = realRoofHeight 
              group.add(equipment)
          }
          
      }, undefined, () => {
          // --- ФОЛБЕК (Если модели нет) ---
          // Если модели нет, высоту считаем сами, например 60% от ширины
          const fallbackHeight = houseConfig.w * 0.6 
          
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(houseConfig.w, fallbackHeight, houseConfig.h), 
            new THREE.MeshStandardMaterial({ color: 0xff5722 })
          )
          cube.position.y = fallbackHeight / 2 
          group.add(cube)

          if (cctv) {
              const equipment = createRoofEquipment()
              equipment.position.y = fallbackHeight
              group.add(equipment)
          }
      })

      scene.add(group)
      houseRef.current = group
    }
  }, [house, houseConfig, cctv])

  return <div ref={mountRef} className="scene-container" />
}