import type { Root } from '@yozora/ast'
import { RootType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeCharacters: IEscaper = createCharacterEscaper('`'.split(''))
const _escapeContent: IEscaper = content => {
  return _escapeCharacters(content)
    .replace(/((?:^|\n)[ \t]*)([>])/g, '$1\\$2') // for blockquote
    .replace(/((?:^|\n)[ \t]*)([#]{1,6}[ \t]+\S)/g, '$1\\$2') // for heading
    .replace(/((?:^|\n)[ \t]*)([=]{3,})[ \t]*(\n|$)/g, '$1\\$2$3') // for setext heading
    .replace(/([ \t])([#]+(?:\n|$))/g, '$1\\$2') // for heading
    .replace(/(\n)([-*+][ \t]+\S)/g, '$1\\$2') // for list
    .replace(/(\n)([-_*])([ \t]*\2[ \t]*\2(?:[ \t]|\2)*(?:\n|$))/g, '$1\\$2$3') // for thematicBreak
    .replace(/(\\+)$/, m => (m.length & 1 ? m + '\\' : m))
}

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#root
 */
export class RootMarkupWeaver implements INodeMarkupWeaver<Root> {
  public readonly type = RootType
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = (): boolean => true
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(): INodeMarkup {
    return {}
  }
}
