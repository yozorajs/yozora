import type { YastAlternative } from '@yozora/tokenizercore'
import type { YastInlineNode } from '../types/node'


/**
 * calc alt
 * An image description has inline elements as its contents. When an image
 * is rendered to HTML, this is standardly used as the image’s alt attribute
 * @see https://github.github.com/gfm/#example-582
 */
export function calcImageAlt(
  nodes: ReadonlyArray<YastInlineNode>,
): string {
  return nodes
    .map((o: YastInlineNode & YastAlternative & any): string => {
      if (o.value != null) return o.value
      if (o.alt != null) return o.alt
      if (o.children != null) return calcImageAlt(o.children)
      return ''
    }).join('')
}
