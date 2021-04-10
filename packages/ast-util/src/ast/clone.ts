import type { Root, YastNode, YastParent } from '@yozora/ast'

/**
 * Shallow clone ast until the match reaches the termination condition.
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `endCondition` function.
 *
 * @param root
 * @param endCondition
 * @returns
 */
export function shallowCloneAst(
  root: Root,
  endCondition: (
    node: YastNode,
    parent: YastParent,
    childIndex: number,
  ) => boolean,
): Root {
  const clone = <T extends YastNode = YastNode>(u: T): T => {
    const { children } = (u as unknown) as YastParent
    if (children == null) return u

    const nextChildren = []
    for (let i = 0; i < children.length; ++i) {
      const v = children[i]
      if (endCondition(v, (u as unknown) as YastParent, i)) break
      nextChildren.push(clone(v))
    }
    return { ...u, children: nextChildren }
  }
  return clone(root)
}
