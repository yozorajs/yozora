import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import type { NodeMatcher } from './util'
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
export function collectNodes<T extends YastNodeType, O extends YastNode<T>>(
  root: Root,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher | null,
): O[] {
  const isMatched: NodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const nodes: O[] = []
  const collect = (u: YastParent): void => {
    const { children } = u
    if (children != null) {
      for (const v of children) collect(v as YastParent)
    }
    if (isMatched(u)) nodes.push(u as unknown as O)
  }
  collect(root)
  return nodes
}
