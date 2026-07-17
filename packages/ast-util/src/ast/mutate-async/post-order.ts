import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { INodeMatcher } from '../collect/misc'
import { createNodeMatcher } from '../collect/misc'
import { createPostorderMutation } from '../mutate/util'

/**
 * This function performs a post-order traversal of an Abstract Syntax Tree (AST) and replaces nodes
 * asynchronously. It does not modify the original AST directly but tries to reuse unchanged nodes
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
 * @returns A promise resolving to a new AST if modified with replaced nodes.
 */
export async function shallowMutateAstInPostorderAsync(
  immutableRoot: Readonly<Root>,
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher | null,
  replace: (
    immutableNode: Readonly<Node>,
    immutableParent: Readonly<Parent>,
    childIndex: number,
  ) => Promise<Node | Node[] | null>,
): Promise<Readonly<Root>> {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)

  const mutation = createPostorderMutation(immutableRoot, isMatched)
  let result = mutation.next()
  while (!result.done) {
    const { node, parent, childIndex } = result.value
    result = mutation.next(await replace(node, parent, childIndex))
  }
  return result.value
}
