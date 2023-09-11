import { TreeCache } from '../../MyClasses.ts/TreeCache'
import { PriorityQueue } from '../utilities/PriorityQueue'
import { Tile } from './Tile'

export class TilesRendererBase {
    readonly rootTileset: Object | null
    readonly root: Object | null

    errorTarget: Number
    errorThreshold: Number
    loadSiblings: Boolean
    displayActiveTiles: Boolean
    maxDepth: Number
    stopAtEmptyTiles: Boolean

    fetchOptions: RequestInit
    /** function to preprocess the url for each individual tile */
    preprocessURL: ((uri: string | URL) => string) | null

    lruCache: TreeCache<Tile>
    parseQueue: PriorityQueue
    downloadQueue: PriorityQueue

    constructor(url: String)
    update(): void
    traverse(
        beforeCb: ((tile: Object, parent: Object, depth: Number) => Boolean) | null,
        afterCb: ((tile: Object, parent: Object, depth: Number) => Boolean) | null
    ): void
    dispose(): void
    resetFailedTiles(): void
}
