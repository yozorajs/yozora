import type { IRoot, IYastNode, IYastParent, YastNodeType } from '@yozora/ast'
import type { INodeMatcher } from './util'
import { createNodeMatcher } from './util'

/**
 * Traverse yozora AST in pre-order, and provide an opportunity to perform an
 * action on visited node.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `mutate` function as the first parameter.
 *
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param touch
 */
export function traverseAst(
  immutableRoot: IRoot,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | INodeMatcher | null,
  touch: (
    immutableNode: Readonly<IYastNode>,
    immutableParent: Readonly<IYastParent>,
    childIndex: number,
  ) => void,
): void {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const visit = (u: IYastParent): void => {
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i] as IYastParent
      if (isMatched(v)) touch(v, u, i)

      // Recursively visit.
      if (v.children != null) visit(v)
    }
  }
  visit(immutableRoot)
}
