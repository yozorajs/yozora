import type { Alternative, Literal, Node, Parent } from '@yozora/ast'

type ImageAltNode = Node & Alternative & Literal & Parent

/**
 * calc alt
 * An image description has inline elements as its contents. When an image
 * is rendered to HTML, this is standardly used as the image’s alt attribute
 * @see https://github.github.com/gfm/#example-582
 */
export function calcImageAlt(nodes: readonly Node[]): string {
  const values: string[] = []
  const stack: ImageAltNode[] = []
  for (let i = nodes.length - 1; i >= 0; --i) stack.push(nodes[i] as ImageAltNode)

  while (stack.length > 0) {
    const node = stack.pop()!
    if (node.value != null) {
      values.push(node.value)
    } else if (node.alt != null) {
      values.push(node.alt)
    } else if (node.children != null) {
      // Push in reverse so the LIFO traversal preserves source order.
      for (let i = node.children.length - 1; i >= 0; --i) {
        stack.push(node.children[i] as ImageAltNode)
      }
    }
  }
  return values.join('')
}
