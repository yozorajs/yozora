import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from './util'
import { createNodeMatcher, createShallowNodeCollector } from './util'

/**
 * Traverse AST and replace nodes in post-order.
 *
 * Note that the root node will not be traversed, that is, the root node will
 * never be passed into the `replace` function as the first parameter.
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
  aimTypesOrNodeMatcher: ReadonlyArray<NodeType> | INodeMatcher | null,
  replace: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => Node | Node[] | null,
): Readonly<Root> {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const traverse = (children: ReadonlyArray<Node>, parent: Readonly<Parent>): Node => {
    // Recursively processing the descendant nodes in post-order traverse.
    const collector0 = createShallowNodeCollector(children as Node[])
    for (let i = 0; i < children.length; ++i) {
      const child = children[i] as Parent
      const subChildren: ReadonlyArray<Node> = child.children

      // Whether to process the subtree recursively.
      const nextChild = subChildren && subChildren.length > 0 ? traverse(subChildren, child) : child
      collector0.add(nextChild, child, i)
    }

    // Processing current layer of nodes.
    const nextChildren: Node[] = collector0.collect()
    const collector1 = createShallowNodeCollector(nextChildren)
    for (let i = 0; i < nextChildren.length; ++i) {
      const child = nextChildren[i]
      const nextChild = isMatched(child) ? replace(child, parent, i) : child
      collector1.add(nextChild, child, i)
    }

    const finalChildren: Node[] = collector1.collect()
    const result: Node =
      finalChildren === children ? parent : { ...parent, children: finalChildren }
    return result
  }
  return traverse(immutableRoot.children, immutableRoot) as Root
}
