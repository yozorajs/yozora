import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from './collect/misc'
import { createNodeMatcher } from './collect/misc'

/**
 * Traverse yozora AST in pre-order, and provide an opportunity to perform an
 * action on visited node.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `touch` function as the first parameter.
 *
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param touch
 */
export function traverseAst(
  immutableRoot: Root,
  aimTypesOrNodeMatcher: ReadonlyArray<NodeType> | INodeMatcher | null,
  touch: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => void,
): void {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const visit = (u: Parent): void => {
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i] as Parent
      if (isMatched(v)) touch(v, u, i)

      // Recursively visit.
      if (v.children != null) visit(v)
    }
  }
  visit(immutableRoot)
}
