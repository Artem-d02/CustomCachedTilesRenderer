import { flattenJSON } from 'three/src/animation/AnimationUtils'
import { TreeNode, Tree } from './Tree'
import { LRUCache } from '3d-tiles-renderer'

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
    private _lastUsed: number
    constructor(item: T) {
        this._item = item
        this._lastUsed = Date.now()
    }
    get item(): T {
        return this._item
    }
    get isUsed(): Boolean {
        return this._isUsed
    }
    get lastUsed(): number {
        return this._lastUsed
    }
    set isUsed(isUsed: Boolean) {
        this._isUsed = isUsed
    }
    set lastUsed(lastUsed: number) {
        this._lastUsed = lastUsed
    }
}

export class TreeCache<T> extends LRUCache {
    maxSize: number
    minSize: number
    unloadPercent: number
    itemTree: Tree<ItemWrapper<T>>
    callbacks: Map<T, (elem: T) => void>

    usedCount: number = 0

    scheduled: Boolean = false

    //  Deprecated!
    unloadPriorityCallback: any = null

    constructor(
        comparator: (first: T, second: T) => number,
        maxSize: number = Consts.DEFAULT_MAX_SIZE,
        minSize: number = Consts.DEFAULT_MIN_SIZE,
        unloadPercent: number = Consts.DEFAULT_UNLOAD_PERCENT
    ) {
        super()
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
            foundItemWrapped.lastUsed = Date.now()

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
                parentNode.data.lastUsed = Date.now()
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

        let unloadItemsNumber = 0
        while (unloadItemsNumber < nodesToUnload) {
            //  Stop if only used content remain
            if (this.itemTree.size === this.usedCount) {
                break
            }
            type Pair = {
                wrappedItem: ItemWrapper<T>
                lastUsed: number
            }
            const unusedItemSet: Pair[] = []
            this.itemTree.traverseAllChildren(
                this.itemTree.root?.data as ItemWrapper<T>,
                (wrapper) => {
                    //  If element is a leaf add it to the list of possible removable object
                    if (this.itemTree.isLeaf(wrapper) && wrapper.isUsed === false) {
                        unusedItemSet.push({
                            wrappedItem: wrapper,
                            lastUsed: wrapper.lastUsed,
                        })
                    }
                }
            )
            unusedItemSet.sort((a: Pair, b: Pair) => {
                return a.lastUsed - b.lastUsed
            })
            let index = 0
            while (unloadItemsNumber < nodesToUnload) {
                //  If all elements in unusedItemSet were deleted - go to the next outer iteration
                if (index === unusedItemSet.length) {
                    //  problem
                    break
                }
                const elemInTree = unusedItemSet[index++].wrappedItem
                const rmCb = callbacks.get(elemInTree.item) as (elem: T) => void
                if (
                    this.itemTree.removeIfIsLeaf(elemInTree, (wrappedItem) =>
                        rmCb(wrappedItem.item)
                    )
                ) {
                    unloadItemsNumber++
                }
                callbacks.delete(elemInTree.item)
            }
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
