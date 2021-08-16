import type { Root, YastNode, YastNodeType, YastParent } from '@yozora/ast'
import type { NodeMatcher } from './util'
import { createNodeMatcher, createShallowNodeCollector } from './util'

/**
 * Traverse AST and replace nodes in post-order.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `replace` function as the first paramter.
 *
 * 需要注意的是，尽管此函数不会直接操作原AST，但它会尽可能地复用未改变的节点；
 * 此外它依赖于 replace 函数将传入的节点视作不可修改的，所以在使用时，需要注意不
 * 要在 replace 中直接修改节点，如果需要修改，应该返回一个新的节点（节点属性可以
 * 复用）
 *
 * It should be noted that although this function does not directly manipulate
 * the original AST, it will reuse unchanged nodes as much as possible. In
 * additional, it relies on the passed-in `replace` function to treat the passed
 * node as immutable, so when using this function, you need to be careful not
 * to modify the node directly in `replace` callback. If you need to perform
 * some changes, you should return a new node (node attributes can be reused).
 *
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param replace
 */
export function shallowMutateAstInPostorder(
  immutableRoot: Readonly<Root>,
  aimTypesOrNodeMatcher: ReadonlyArray<YastNodeType> | NodeMatcher | null,
  replace: (
    immutableNode: Readonly<YastNode>,
    immutableParent: Readonly<YastParent>,
    childIndex: number,
  ) => YastNode | YastNode[] | null,
): Readonly<Root> {
  const isMatched: NodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const traverse = (
    children: ReadonlyArray<YastNode>,
    parent: Readonly<YastParent>,
  ): YastNode => {
    // Recursively processing the descendant nodes in post-order traverse.
    const collector0 = createShallowNodeCollector(children as YastNode[])
    for (let i = 0; i < children.length; ++i) {
      const child = children[i] as YastParent
      const subChildren: ReadonlyArray<YastNode> = child.children

      // Whether to process the subtree recursively.
      if (subChildren != null && subChildren.length > 0) {
        const nextChild = traverse(subChildren, child)
        collector0.conditionalAdd(nextChild, child, i)
      } else {
        collector0.add(child)
      }
    }

    // Processing current layer of nodes.
    const nextChildren: YastNode[] = collector0.collect()
    const collector1 = createShallowNodeCollector(nextChildren)
    for (let i = 0; i < nextChildren.length; ++i) {
      const child = nextChildren[i]
      if (isMatched(child)) {
        const nextChild = replace(child, parent, i)
        collector1.conditionalAdd(nextChild, child, i)
      } else {
        collector1.add(child)
      }
    }

    const finalChildren: YastNode[] = collector1.collect()
    const result: YastNode =
      finalChildren === children
        ? parent
        : { ...parent, children: finalChildren }
    return result
  }
  return traverse(immutableRoot.children, immutableRoot) as Root
}
