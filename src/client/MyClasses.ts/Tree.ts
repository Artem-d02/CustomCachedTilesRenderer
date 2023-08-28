export class TreeNode<T> {
    _data: T
    _children: TreeNode<T>[] = []

    constructor(data: T) {
        this._data = data
    }

    get data(): T {
        return this._data
    }

    get children(): TreeNode<T>[] {
        return this._children
    }
}

export class Tree<T> {
    root?: TreeNode<T>
    comparator: (first: T, second: T) => number //  should return 0 for equals object and non-0 for others

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator
    }

    insert(element: T, parent: T | null): void {
        if (!parent) {
            if (!this.root) {
                this.root = new TreeNode(element)
                return
            } else {
                console.warn("Error: can't insert element in non-empty tree with null-parent")
                return
            }
        }
        const parentNode = this.search(<T>parent)
        if (!parent) {
            console.warn('Error: parent was not found')
            return
        }
        parentNode?.children.push(new TreeNode(element))
    }

    search(element: T): TreeNode<T> | undefined {
        if (!this.root) {
            return
        }
        return this.recursivelySearch(element, this.root)
    }

    //  private api
    recursivelySearch(element: T, startNode: TreeNode<T>): TreeNode<T> | undefined {
        if (this.comparator(startNode.data, element) === 0) {
            return startNode
        } else {
            for (const child of startNode.children) {
                let result = this.recursivelySearch(element, child)
                if (result != undefined) {
                    return result
                }
            }
        }
    }
}
