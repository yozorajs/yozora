import type { Node, NodeType, Root } from '@yozora/ast'

export interface INodeMarkup {
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

export interface INodeMarkupWeaveContext {
  /**
   * Weave AST nodes into a content string or markup structure.
   * @param nodes
   */
  weaveNodes(nodes: Node[]): INodeMarkup
}

export interface INodeMarkupWeaver<T extends Node = Node> {
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
  weave(node: T, parent: Node, childIndex: number): INodeMarkup | string
}

export interface IMarkupWeaver {
  /**
   *
   * @param type
   * @param weaver
   */
  useWeaver(type: NodeType, weaver: INodeMarkupWeaver): IMarkupWeaver
  /**
   *
   * @param ast
   */
  weave(ast: Root): string
}
