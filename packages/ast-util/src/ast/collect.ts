import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from './util'
import { createNodeMatcher } from './util'

/**
 * Collect nodes of the specified type through pre-order traversal.
 *
 * Note that if the matched node has other matching descendant nodes, these
 * descendant nodes will not be collected repeatedly, that is, only the
 * currently matched node will be collected, and will not enter the subtree for
 * collection afterwards.
 *
 * @param root
 * @param aimTypesOrNodeMatcher
 */
export function collectNodes<T extends NodeType, O extends Node<T>>(
  root: Readonly<Root>,
  aimTypesOrNodeMatcher: ReadonlyArray<NodeType> | INodeMatcher | null,
): O[] {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const nodes: O[] = []
  const collect = (u: Parent): void => {
    if (isMatched(u)) {
      nodes.push(u as unknown as O)
      return
    }

    if (u.children) {
      for (const v of u.children) {
        collect(v as Parent)
      }
    }
  }
  collect(root)
  return nodes
}
