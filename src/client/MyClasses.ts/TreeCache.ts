import { TreeNode, Tree } from './Tree'

enum Consts {
    DEFAULT_MAX_SIZE = 800,
    DEFAULT_UNLOAD_PERCENT = 0.05,
}

//  Wrapper for stored objects added in order to provide an availability of required fields
class ItemWrappew<T> {
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
    unloadPercent: number
    itemTree: Tree<ItemWrappew<T>>
    callbacks: Map<T, (elem: T) => void>

    constructor(
        comparator: (first: T, second: T) => number,
        maxSize: number = Consts.DEFAULT_MAX_SIZE,
        unloadPercent: number = Consts.DEFAULT_UNLOAD_PERCENT
    ) {
        this.maxSize = maxSize
        this.unloadPercent = unloadPercent

        //  Make comparator for ItemWrapper
        const translationComparator = (first: ItemWrappew<T>, second: ItemWrappew<T>) => {
            return comparator(first.item, second.item)
        }

        this.itemTree = new Tree(translationComparator)
        this.callbacks = new Map()
    }

    public isFull(): Boolean {
        return this.itemTree.size >= this.maxSize
    }

    public add(item: any, removeCb: (elem: any) => void): Boolean {
        if (this.itemTree.has(item)) {
            return false
        }
        if (this.isFull()) {
            return false
        }
        item.used = true
        this.itemTree.insert(item, item.parent)
        this.callbacks.set(item, removeCb)
        return true
    }
}
