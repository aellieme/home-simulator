// SceneHelper.jsx
import * as THREE from 'three'

export function createFallbackAppleTree() {
    const group = new THREE.Group()

    // Ствол
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 20, 8),
        new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    )
    trunk.position.y = 10
    group.add(trunk)

    // Крона (Зеленая сфера)
    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(18, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x4caf50 })
    )
    crown.position.y = 28
    group.add(crown)

    // Яблоки (Красные сферы)
    const appleGeo = new THREE.SphereGeometry(2.5, 8, 8)
    // const appleMat = new THREE.MeshBasicMaterial({ color: 0xd50000 })
    const appleMat = new THREE.MeshStandardMaterial({ color: 0xd50000, metalness: 0, roughness: 0.8 })
    const positions = [
        [10, 30, 8], [-10, 25, 5], [2, 38, -5], 
        [0, 22, 14], [-12, 32, -5], [8, 20, -10]
    ]
    
    positions.forEach(pos => {
        const apple = new THREE.Mesh(appleGeo, appleMat)
        apple.position.set(pos[0], pos[1], pos[2])
        group.add(apple)
    })

    return group
}

// Создание Антенны и Камеры
export function createRoofEquipment() {
    const group = new THREE.Group()
    
    // --- КАМЕРА (Синяя сфера на ножке) ---
    // const camGroup = new THREE.Group()
    // camGroup.position.set(-10, 0, 10) // Сдвиг влево
    
    // const leg = new THREE.Mesh(
    //     new THREE.CylinderGeometry(1, 1, 10),
    //     new THREE.MeshStandardMaterial({ color: 0x212121 })
    // )
    // leg.position.y = 5
    // camGroup.add(leg)

    // const camHead = new THREE.Mesh(
    //     new THREE.SphereGeometry(5, 16, 16),
    //     new THREE.MeshBasicMaterial({ color: 0x2979ff }) // Ярко-синий
    // )
    // camHead.position.y = 10
    // camGroup.add(camHead)
    // group.add(camGroup)

    // --- АНТЕННА (Как вы просили: штырь с перекладинами) ---
    const antGroup = new THREE.Group()
    antGroup.position.set(10, 0, -5) // Сдвиг вправо

    // Главный штырь
    const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 30),
        new THREE.MeshStandardMaterial({ color: 0x424242 })
    )
    mast.position.y = 15
    antGroup.add(mast)

    // Перекладины
    const barGeo = new THREE.CylinderGeometry(0.3, 0.3, 16)
    const barMat = new THREE.MeshStandardMaterial({ color: 0x424242 })

    const bar1 = new THREE.Mesh(barGeo, barMat)
    bar1.rotation.z = Math.PI / 2
    bar1.position.y = 25
    antGroup.add(bar1)

    const bar2 = new THREE.Mesh(barGeo, barMat)
    bar2.scale.y = 0.7 // Нижняя короче
    bar2.rotation.z = Math.PI / 2
    bar2.position.y = 18
    antGroup.add(bar2)

    group.add(antGroup)

    return group
}