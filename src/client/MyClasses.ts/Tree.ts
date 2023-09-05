export class TreeNode<T> {
    private _parent: TreeNode<T> | null = null //  parent of node is equal to null by default
    private _data: T
    private _children: TreeNode<T>[] = []

    constructor(data: T) {
        this._data = data
    }

    get data(): T {
        return this._data
    }

    get children(): TreeNode<T>[] {
        return this._children
    }

    get parent(): TreeNode<T> | null {
        return this._parent
    }

    set parent(parent: TreeNode<T>) {
        this._parent = parent
    }
}

// Note: Tree can store only unique values (define the comparator function attentively!)
export class Tree<T> {
    private _root?: TreeNode<T>
    private comparator: (first: T, second: T) => number //  should return 0 for equals object and non-0 for others
    private _size: number = 0

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator
    }

    public insert(element: T, parent: T | null): void {
        if (!parent) {
            if (!this._root) {
                this._root = new TreeNode(element)
                this._size++
                return
            } else {
                console.warn("Error: can't insert element in non-empty tree with null-parent")
                return
            }
        }
        const parentNode = this.search(<T>parent)
        if (parent === undefined) {
            console.warn('Error: parent was not found')
            return
        }
        const newNode = new TreeNode(element)
        newNode.parent = <TreeNode<T>>parentNode
        parentNode?.children.push(newNode)
        this._size++
    }

    public search(element: T): TreeNode<T> | undefined {
        if (!this._root) {
            return
        }
        return this.recursivelySearch(element, this._root)
    }

    public has(element: T): Boolean {
        return this.search(element) !== undefined
    }

    public removeSubTree(element: T, removeCb: (elem: T) => void = (elem) => {}): Boolean {
        const resultNode = this.search(element)
        if (resultNode === undefined) {
            return false
        }

        //  Count childs recursively including root node
        let childrenNumber = 0
        const countChildrenRecursively = (pNode: TreeNode<T>) => {
            childrenNumber++
            for (const child of pNode.children) {
                countChildrenRecursively(child)
            }
        }
        countChildrenRecursively(resultNode)

        //  Dispose all successors
        this.traverseAllChildren(element, removeCb)

        //  Fix parent node if it exists
        const parentNode = resultNode.parent
        if (parentNode !== null) {
            const index = parentNode?.children.indexOf(resultNode)
            parentNode?.children.splice(<number>index, 1)
        }

        removeCb(resultNode.data)
        this._size -= childrenNumber
        return true
    }

    public removeIfIsLeaf(element: T, removeCb: (elem: T) => void = (elem) => {}): Boolean {
        if (this.isLeaf(element)) {
            return this.removeSubTree(element, removeCb)
        }
        return false
    }

    public isLeaf(element: T): Boolean {
        const resultNode = this.search(element)
        if (resultNode === undefined) {
            return false
        }
        return resultNode.children.length === 0
    }

    get size(): number {
        return this._size
    }

    get root(): TreeNode<T> | undefined {
        return this._root
    }

    public traverseAllChildren(element: T, callback: (elem: T) => void): Boolean {
        const startNode = this.search(element)
        if (startNode === undefined) {
            return false
        }
        this.traverseAllChildrenRecursively(startNode, callback)
        return true
    }

    public traverseAllChildrenRecursively(
        startNode: TreeNode<T>,
        callback: (elem: T) => void
    ): void {
        callback(startNode.data)
        for (const child of startNode.children) {
            this.traverseAllChildrenRecursively(child, callback)
        }
    }

    //  private api
    private recursivelySearch(element: T, startNode: TreeNode<T>): TreeNode<T> | undefined {
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
