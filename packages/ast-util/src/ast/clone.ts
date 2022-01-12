import type { IYastNode, IYastParent, Root } from '@yozora/ast'

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
  endCondition: (node: IYastNode, parent: IYastParent, childIndex: number) => boolean,
): Root {
  const clone = (u: IYastParent): IYastParent => {
    const nextChildren = []
    const { children } = u
    for (let i = 0; i < children.length; ++i) {
      const v = children[i] as IYastParent
      if (endCondition(v, u, i)) break

      const nextChild = v.children == null ? v : clone(v)
      nextChildren.push(nextChild)
    }
    return { ...u, children: nextChildren }
  }
  return clone(root) as Root
}
