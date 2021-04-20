import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import { createNodeTypeMatcher } from './util'

/**
 * Traverse AST and replace nodes in pre-order.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `replace` function as the first paramter.
 *
 * @param root
 * @param aimTypes
 * @param replace
 */
export function replaceAST(
  root: Root,
  aimTypes: ReadonlyArray<YastNodeType> | null,
  replace: (
    node: Readonly<YastNode>,
    parent: Readonly<YastParent>,
    childIndex: number,
  ) => YastNode | YastNode[] | void,
): void {
  const isMatched = createNodeTypeMatcher(aimTypes)
  const visit = (u: YastParent): void => {
    let nextChildren: YastNode[] | null = null

    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i]
      let replaced = false
      if (isMatched(v)) {
        const newChild = replace(v, u, i)
        if (newChild != null) {
          replaced = true
          if (nextChildren == null) nextChildren = children.slice(0, i)
          if (Array.isArray(newChild)) nextChildren.push(...newChild)
          else nextChildren.push(newChild)
        }
      }

      // Recursively visit.
      if (!replaced) {
        if ((v as YastParent).children != null) visit(v as YastParent)
        if (nextChildren != null) nextChildren.push(v)
      }
    }

    // Replace children if any of them has been replaced.
    if (nextChildren != null) {
      // eslint-disable-next-line no-param-reassign
      u.children = nextChildren
    }
  }
  visit(root)
}
