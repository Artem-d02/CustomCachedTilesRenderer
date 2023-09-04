import { findSourceMap } from 'module'
import { TreeNode, Tree } from './Tree'
import { TreeCache } from './TreeCache'

class Tile {
    parent: Tile | undefined
    value: number
    children: Tile[] = []

    constructor(parent: Tile | undefined, value: number, children: Tile[]) {
        this.parent = parent
        this.value = value
        this.children = children
    }

    public addChild(tile: Tile) {
        this.children.push(tile)
    }

    public addChildren(tiles: Tile[]) {
        for (const tile of tiles) {
            this.children.push(tile)
        }
    }
}

export default function test() {
    const tree = new Tree((a: number, b: number) => {
        return <number>(a - b)
    })

    // Tree test
    /*
    tree.insert(5, null)
    tree.insert(44, 5)
    tree.insert(21, 5)
    tree.insert(37, 5)
    tree.insert(1, 21)
    console.log('Tree after inserting: ')
    console.log(tree)
    setTimeout(() => {
        const removeResult = tree.removeSubTree(21)
        console.log('Deleted subtree with the element 21 in root: ' + removeResult)
        console.log(tree)
    }, 10000)
    */

    //  Tiles test
    let value = 0
    const root = new Tile(undefined, value++, [])

    const fillAllChildren = (root: Tile) => {
        root.addChild(new Tile(root, value++, []))
        root.addChild(new Tile(root, value++, []))
        root.addChild(new Tile(root, value++, []))
    }
    fillAllChildren(root)
    for (const tile of root.children) {
        fillAllChildren(tile)
    }
    console.log(root)

    //  Cache test
    const cache = new TreeCache((first: Tile, second: Tile) => first.value - second.value, 13, 9)
    const traverseAllChildren = (root: Tile, cb: (tile: Tile) => void) => {
        cb(root)
        for (const child of root.children) {
            traverseAllChildren(child, cb)
        }
    }
    traverseAllChildren(root, (tile) => cache.add(tile, () => {}))
    console.log('Start cache:')
    console.log(cache)
    cache.markUnused(root.children[0])
    console.log('Cache after mark unused:')
    console.log(cache)
    cache.unloadUnusedContent()
    console.log('Cache after clear up:')
    console.log(cache)
}
