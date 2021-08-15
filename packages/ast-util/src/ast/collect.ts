import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import { createNodeTypeMatcher } from './util'

/**
 * Collect nodes of the specified type through pre-order traversal.
 *
 * Note that if the matched node has other matching descendant nodes, these
 * descendant nodes will not be collected repeatedly, that is, only the
 * currently matched node will be collected, and will not enter the subtree for
 * collection afterwards.
 *
 * @param root
 * @param aimTypes
 */
export function collectNodes<T extends YastNodeType, O extends YastNode<T>>(
  root: Root,
  aimTypes: ReadonlyArray<T>,
): O[] {
  const nodes: O[] = []
  const isMatch = createNodeTypeMatcher(aimTypes)
  const collect = (u: YastParent): void => {
    const { children } = u
    if (children != null) {
      for (const v of children) collect(v as YastParent)
    }
    if (isMatch(u)) nodes.push(u as unknown as O)
  }
  collect(root)
  return nodes
}
