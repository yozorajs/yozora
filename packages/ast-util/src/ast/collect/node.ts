import type { Node, NodeType, Parent } from '@yozora/ast'
import type { INodeMatcher } from './misc'
import { createNodeMatcher } from './misc'

/**
 * Collect nodes of the specified type through pre-order traversal.
 *
 * Note that if the matched node has other matching descendant nodes, these
 * descendant nodes will not be collected repeatedly, that is, only the
 * currently matched node will be collected, and will not enter the subtree for
 * collection afterwards.
 *
 * @param root
 * @param aimTypesOrNodeMatcher
 */
export function collectNodes<T extends NodeType, O extends Node<T>>(
  root: Readonly<Parent>,
  aimTypesOrNodeMatcher: readonly NodeType[] | INodeMatcher | null,
): O[] {
  const isMatched: INodeMatcher = createNodeMatcher(aimTypesOrNodeMatcher)
  const nodes: O[] = []
  const stack: Array<{ nodes: readonly Node[]; index: number }> = [{ nodes: [root], index: 0 }]

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]
    if (frame.index >= frame.nodes.length) {
      stack.pop()
      continue
    }

    const node = frame.nodes[frame.index++] as Parent
    if (isMatched(node)) {
      nodes.push(node as unknown as O)
      continue
    }

    if (node.children?.length) stack.push({ nodes: node.children, index: 0 })
  }
  return nodes
}
