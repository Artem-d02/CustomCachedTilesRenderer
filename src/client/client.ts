import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TilesRenderer } from '3d-tiles-renderer'
import { Tile } from '3d-tiles-renderer/src/base/Tile'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.setClearColor(0x84cdfa, 1)

console.log(__dirname)
const tilesRenderer = new TilesRenderer('./resources/3walls_project/Tileset.json')
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
scene.add(tilesRenderer.group)

const mainLight_position = new THREE.Vector3(5, 0, 10)

const mainLight = new THREE.DirectionalLight('white', 100)
mainLight.position.set(mainLight_position.x, mainLight_position.y, mainLight_position.z)

const light_geometry = new THREE.SphereGeometry(0.5, 32, 32)
const light_material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
})
const light_mesh = new THREE.Mesh(light_geometry, light_material)
light_mesh.position.set(mainLight_position.x, mainLight_position.y, mainLight_position.z)
scene.add(mainLight, light_mesh)

const controls = new OrbitControls(camera, renderer.domElement)

/*
const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
})

const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}
*/

function animate() {
    requestAnimationFrame(animate)

    controls.update()
    tilesRenderer.update()

    render()
}

function render() {
    renderer.render(scene, camera)
}
animate()
