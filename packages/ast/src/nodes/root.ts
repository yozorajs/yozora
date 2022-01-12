import type { Parent } from '../ast'

export const RootType = 'root'
export type RootType = typeof RootType

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 */
export type Root = Parent<RootType>
