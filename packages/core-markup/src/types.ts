import type { Node } from '@yozora/ast'

export interface IMarkup {
  /**
   * Opener markers.
   * @param node
   */
  opener?: string
  /**
   * Closer markers.
   * @param node
   */
  closer?: string
  /**
   * Prefix markers in subsequence lines.
   * @param node
   */
  indent?: string
  /**
   * Source contents between `opener` and `closer`.
   */
  content?: string
}

export interface IMarkupWeaveContext {
  /**
   * Weave AST nodes into a content string or markup structure.
   * @param nodes
   */
  weaveNodes(nodes: Node[]): IMarkup
}

export interface IMarkupWeaver<T extends Node = Node> {
  /**
   * Whether the content can be wrapped.
   */
  readonly couldBeWrapped: boolean
  /**
   * Whether the accepted node is block level.
   */
  readonly isBlockLevel: boolean
  /**
   * Weave AST node into a content string or markup structure.
   * @param node
   * @param parent
   * @param childIndex
   */
  weave(node: T, parent: Node, childIndex: number): IMarkup | string
}
