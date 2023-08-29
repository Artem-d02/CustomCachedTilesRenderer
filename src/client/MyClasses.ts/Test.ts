import { TreeNode, Tree } from './Tree'

export default function test() {
    const tree = new Tree((a: number, b: number) => {
        return <number>(a - b)
    })
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
}
