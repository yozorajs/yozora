import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from '../collect/misc'
import { createNodeMatcher, createShallowNodeCollector } from '../collect/misc'

/**
 * This function performs a post-order traversal of an Abstract Syntax Tree (AST) and replaces nodes
 * synchronously. It does not modify the original AST directly but tries to reuse unchanged nodes
 * whenever possible. The function relies on the replace callback function to treat the passed node
 * as immutable. If any changes are needed, a new node should be returned instead of modifying the
 * existing one.
 *
 * Notes: The root node is not traversed or passed into the `replace` function.
 *
 * @param immutableRoot The root node of the AST.
 * @param aimTypesOrNodeMatcher An array of node types or an `INodeMatcher` object used to determine
 *        which nodes to replace. Can be `null` if no specific types or matcher are provided.
 * @param replace A callback function that accepts an immutable node, its parent node, and the index
 *        of the child node. It should return a promise resolving to a new node or an array of nodes
 *        to replace the original node(s), or `null` if the original node should be remove.
 * @returns A new AST if modified with replaced nodes.
 *
 * @param immutableRoot
 * @param aimTypesOrNodeMatcher
 * @param replace
 */
export function shallowMutateAstInPostorder(
  immutableRoot: Readonly<Root>,
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher | null,
  replace: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => Node | Node[] | null,
): Readonly<Root> {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const traverse = (children: readonly Node[], parent: Readonly<Parent>): Node => {
    // Recursively processing the descendant nodes in post-order traverse.
    const collector0 = createShallowNodeCollector(children as Node[])
    for (let i = 0; i < children.length; ++i) {
      const child = children[i] as Parent
      const subChildren: readonly Node[] = child.children

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
