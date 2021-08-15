import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import { createNodeTypeMatcher } from './util'

/**
 * Traverse yozora AST in pre-order, and provide an opportunity to perform an
 * action on visited node.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `mutate` function as the first paramter.
 *
 * @param immutableRoot
 * @param aimTypes
 * @param mutate
 */
export function traverseAst(
  immutableRoot: Root,
  aimTypes: ReadonlyArray<YastNodeType> | null,
  mutate: (
    immutableNode: Readonly<YastNode>,
    immutableParent: Readonly<YastParent>,
    childIndex: number,
  ) => void,
): void {
  const isMatched = createNodeTypeMatcher(aimTypes)
  const visit = (u: YastParent): void => {
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i]
      if (isMatched(v)) mutate(v, u, i)

      // Recursively visit.
      if ((v as YastParent).children != null) visit(v as YastParent)
    }
  }
  visit(immutableRoot)
}
