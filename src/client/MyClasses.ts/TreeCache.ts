import { flattenJSON } from 'three/src/animation/AnimationUtils'
import { TreeNode, Tree } from './Tree'

enum Consts {
    DEFAULT_MAX_SIZE = 800,
    DEFAULT_MIN_SIZE = 600,
    DEFAULT_UNLOAD_PERCENT = 0.05,
}

function enqueueMicrotask(callback: any) {
    Promise.resolve().then(callback)
}

//  Wrapper for stored objects added in order to provide an availability of required fields
class ItemWrapper<T> {
    private _item: T
    private _isUsed: Boolean = false
    constructor(item: T) {
        this._item = item
    }
    get item(): T {
        return this._item
    }
    get isUsed(): Boolean {
        return this._isUsed
    }
    set isUsed(isUsed: Boolean) {
        this._isUsed = isUsed
    }
}

export class TreeCache<T> {
    maxSize: number
    minSize: number
    unloadPercent: number
    itemTree: Tree<ItemWrapper<T>>
    callbacks: Map<T, (elem: T) => void>

    usedCount: number = 0

    scheduled: Boolean = false

    constructor(
        comparator: (first: T, second: T) => number,
        maxSize: number = Consts.DEFAULT_MAX_SIZE,
        minSize: number = Consts.DEFAULT_MIN_SIZE,
        unloadPercent: number = Consts.DEFAULT_UNLOAD_PERCENT
    ) {
        this.maxSize = maxSize
        this.minSize = minSize
        this.unloadPercent = unloadPercent

        //  Make comparator for ItemWrapper
        const translationComparator = (first: ItemWrapper<T>, second: ItemWrapper<T>) => {
            return comparator(first.item, second.item)
        }

        this.itemTree = new Tree(translationComparator)
        this.callbacks = new Map()
    }

    public isFull(): Boolean {
        return this.itemTree.size >= this.maxSize
    }

    public add(item: any, removeCb: (elem: any) => void): Boolean {
        const wrappedItem = new ItemWrapper(item)
        if (this.itemTree.has(wrappedItem)) {
            return false
        }
        if (this.isFull()) {
            return false
        }
        wrappedItem.isUsed = true
        this.usedCount++
        if (item.parent !== undefined && item.parent !== null) {
            this.itemTree.insert(wrappedItem, new ItemWrapper(item.parent))
        } else {
            this.itemTree.insert(wrappedItem, null)
        }
        this.callbacks.set(item, removeCb)
        return true
    }

    //  Note: this function removes all subtree!
    public remove(item: T): Boolean {
        const wrappedItem = new ItemWrapper(item)
        if (this.itemTree.has(wrappedItem)) {
            //  Calculate number of used item in this subtree
            let usedItemsInSubtree = 0
            this.itemTree.traverseAllChildren(wrappedItem, (elem: ItemWrapper<T>) => {
                if (elem.isUsed) {
                    usedItemsInSubtree++
                }
            })

            this.itemTree.removeSubTree(wrappedItem)
            this.usedCount -= usedItemsInSubtree
            return true
        }
        return false
    }

    //  Note: this functions marks as used all siblings and all ancestors of this element
    public markUsed(item: T): void {
        const wrappedItem = new ItemWrapper(item)
        if (this.itemTree.has(wrappedItem)) {
            const foundNode = <TreeNode<ItemWrapper<T>>>this.itemTree.search(wrappedItem)
            const foundItemWrapped = foundNode.data
            if (foundItemWrapped.isUsed === false) {
                foundItemWrapped.isUsed = true
                this.usedCount++
            }

            // If this node is root - return
            if (foundNode.parent === null) {
                return
            }

            // Set isUsed in true for all ancestors
            let parentNode = foundNode.parent
            while (parentNode.parent !== null) {
                if (parentNode.data.isUsed === false) {
                    parentNode.data.isUsed = true
                    this.usedCount++
                }
                parentNode = parentNode.parent
            }
        }
    }

    //  Note: this functions marks as used all siblings and all ancestors of this element
    public markUnused(item: T): void {
        const wrappedItem = new ItemWrapper(item)
        if (this.itemTree.has(wrappedItem)) {
            const foundNode = <TreeNode<ItemWrapper<T>>>this.itemTree.search(wrappedItem)
            const foundItemWrapped = foundNode.data
            if (foundItemWrapped.isUsed === true) {
                foundItemWrapped.isUsed = false
                this.usedCount--
            }

            this.itemTree.traverseAllChildren(foundItemWrapped, (elem) => {
                if (elem.isUsed === true) {
                    elem.isUsed = false
                    this.usedCount--
                }
            })
        }
    }

    public markAllUnused(): void {
        const root = this.itemTree.root
        if (root === undefined) {
            return
        }
        this.itemTree.traverseAllChildren(<ItemWrapper<T>>root.data, (wrapperElem) => {
            wrapperElem.isUsed = false
        })
        this.usedCount = 0
    }

    public unloadUnusedContent(): void {
        if (this.itemTree.size === 0) {
            return
        }

        const unloadPercent = this.unloadPercent
        const targetSize = this.minSize
        const callbacks = this.callbacks
        const unused = this.itemTree.size - this.usedCount
        const excess = this.itemTree.size - targetSize

        const unusedExcess = Math.min(excess, unused)
        const maxUnload = Math.max(targetSize * unloadPercent, unusedExcess * unloadPercent)
        let nodesToUnload = Math.min(maxUnload, unused)
        nodesToUnload = Math.ceil(nodesToUnload)

        //  TODO: make this strategy more... sophisticated (check the state of cache)
        let unloadItemsNumber = 0
        while (unloadItemsNumber < nodesToUnload) {
            //  Stop if only used content remain
            if (this.itemTree.size === this.usedCount) {
                break
            }
            this.itemTree.traverseAllChildren(
                this.itemTree.root?.data as ItemWrapper<T>,
                (elem: ItemWrapper<T>) => {
                    if (elem.isUsed === false && unloadItemsNumber < nodesToUnload) {
                        if (
                            this.itemTree.removeIfIsLeaf(elem, (wrappedElem) => {
                                const removeCb = callbacks.get(wrappedElem.item) as (
                                    elem: T
                                ) => void
                                removeCb(wrappedElem.item)
                            })
                        ) {
                            unloadItemsNumber++
                        }
                    }
                }
            )
        }
    }

    public scheduleUnload(markAllUnused = true) {
        if (!this.scheduled) {
            this.scheduled = true
            enqueueMicrotask(() => {
                this.scheduled = false
                this.unloadUnusedContent()
                if (markAllUnused) {
                    this.markAllUnused()
                }
            })
        }
    }
}
