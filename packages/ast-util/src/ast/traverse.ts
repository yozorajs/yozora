import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from './collect/misc'
import { createNodeMatcher } from './collect/misc'
import type { IAstStackItem } from './util'

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
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher | null,
  touch: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => void,
): void {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const stack: IAstStackItem[] = [
    {
      parent: immutableRoot,
      children: immutableRoot.children,
      childIndex: 0,
    },
  ]

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.childIndex >= frame.children.length) {
      stack.pop()
      continue
    }

    const childIndex = frame.childIndex++
    const child = frame.children[childIndex] as Parent
    if (isMatched(child)) touch(child, frame.parent, childIndex)

    if (child.children != null) {
      stack.push({ parent: child, children: child.children, childIndex: 0 })
    }
  }
}
