import type { Alternative, Literal, Node, Parent } from '@yozora/ast'

/**
 * calc alt
 * An image description has inline elements as its contents. When an image
 * is rendered to HTML, this is standardly used as the image’s alt attribute
 * @see https://github.github.com/gfm/#example-582
 */
export function calcImageAlt(nodes: readonly Node[]): string {
  type INode = Node & Alternative & Literal & Parent

  const values: string[] = []
  const stack: INode[] = []
  for (let i = nodes.length - 1; i >= 0; --i) stack.push(nodes[i] as INode)

  while (stack.length > 0) {
    const node = stack.pop()!
    if (node.value != null) {
      values.push(node.value)
    } else if (node.alt != null) {
      values.push(node.alt)
    } else if (node.children != null) {
      for (let i = node.children.length - 1; i >= 0; --i) {
        stack.push(node.children[i] as INode)
      }
    }
  }
  return values.join('')
}
