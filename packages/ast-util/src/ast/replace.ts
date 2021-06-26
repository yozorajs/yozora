import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import { createNodeTypeMatcher } from './util'

/**
 * Traverse AST and replace nodes in pre-order.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `replace` function as the first paramter.
 *
 * Note that this function operates directly in the original AST, so it may
 * modify the contents of the original tree. In additional, if the `replace`
 * function returns null, this node will be removed from the original AST.
 *
 * @param mutableRoot
 * @param aimTypes
 * @param replace
 */
export function replaceAST(
  mutableRoot: Root,
  aimTypes: ReadonlyArray<YastNodeType> | null,
  replace: (
    node: Readonly<YastNode>,
    parent: Readonly<YastParent>,
    childIndex: number,
  ) => YastNode | YastNode[] | null,
): void {
  const isMatched = createNodeTypeMatcher(aimTypes)
  const visit = (u: YastParent): void => {
    let nextChildren: YastNode[] | null = null

    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i] as YastParent

      // Pre-order recursive traversal.
      if (v.children != null) visit(v)

      if (isMatched(v)) {
        const newChild = replace(v, u, i)
        if (newChild !== v) {
          if (nextChildren === null) nextChildren = children.slice(0, i)
          if (newChild != null) {
            if (Array.isArray(newChild)) nextChildren.push(...newChild)
            else nextChildren.push(newChild)
          }
          continue
        }
      }

      if (nextChildren !== null) nextChildren.push(v)
    }

    // Replace children if any of them has been replaced (or removed).
    if (nextChildren != null) {
      // eslint-disable-next-line no-param-reassign
      u.children = nextChildren
    }
  }
  visit(mutableRoot)
}
