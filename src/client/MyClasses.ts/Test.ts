import { TreeNode, Tree } from './Tree'

export default function test() {
    const tree = new Tree((a: number, b: number) => {
        return <number>(a - b)
    })
    tree.insert(5, null)
    tree.insert(21, 5)
    tree.insert(1, 21)
    console.log(tree)
}
