import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
//import { TilesRenderer } from './ChangedTilesRenderer/index'
import { TilesRenderer } from '3d-tiles-renderer'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000)
camera.position.z = 2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setClearColor(0x84cdfa, 1)

console.log(__dirname)
const tilesRenderer = new TilesRenderer('./resources/TilesTest/Tileset.json')
tilesRenderer.setCamera(camera)
tilesRenderer.setResolutionFromRenderer(camera, renderer)
tilesRenderer.onLoadModel = function (scene) {
    // create a custom material for the tile
    scene.traverse((c) => {
        let mesh = <THREE.Mesh>c
        if (mesh.material) {
            let meshMaterial = <THREE.Material>mesh.material
            meshMaterial.side = THREE.DoubleSide
        }
    })
}
tilesRenderer.group.rotateX((3 * Math.PI) / 2)

scene.add(tilesRenderer.group)

const mainLight_position = new THREE.Vector3(5, 0, 10)

const mainLight = new THREE.DirectionalLight('white', 10)
mainLight.position.set(mainLight_position.x, mainLight_position.y, mainLight_position.z)

const light_geometry = new THREE.SphereGeometry(0.5, 32, 32)
const light_material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
})
const light_mesh = new THREE.Mesh(light_geometry, light_material)
light_mesh.position.set(mainLight_position.x, mainLight_position.y, mainLight_position.z)
scene.add(mainLight, light_mesh)
scene.add(mainLight.target)

// controls
let controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = false
controls.minDistance = 1
controls.maxDistance = 100000

setTimeout(() => console.log('TilesRenderer:', tilesRenderer), 0)
setTimeout(() => console.log('TilesRenderer:', tilesRenderer), 10000)
setTimeout(() => console.log('TilesRenderer:', tilesRenderer), 20000)

let fpsCounter = 0

document.addEventListener('keydown', (event) => {
    if (event.code == 'KeyM') {
        console.log('Start measuring (10 seconds)')
        fpsCounter = 0
        controls.autoRotate = true
        setTimeout(() => {
            controls.autoRotate = false
            console.log('fps:', fpsCounter / 10)
        }, 10000)
    }
})

function animate() {
    requestAnimationFrame(animate)

    fpsCounter++
    const camPos = camera.position
    let dir = new THREE.Vector3()
    camera.getWorldDirection(dir)

    mainLight.position.set(camPos.x, camPos.y, camPos.z)

    controls.update()
    tilesRenderer.update()
    //console.log('.update() was called')

    render()
    //console.log('.render() was called')
}

function render() {
    renderer.render(scene, camera)
}
animate()
//test()
