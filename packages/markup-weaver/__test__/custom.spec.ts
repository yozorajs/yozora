import type { Literal, Root } from '@yozora/ast'
import { DefaultMarkupWeaver } from '@yozora/markup-weaver'
import type { INodeMarkup, INodeWeaver } from '../src'

type Mention = Literal<'mention'>
class MentionWeaver implements INodeWeaver<Mention> {
  public readonly type = 'mention'
  public readonly isBlockLevel = (): boolean => false
  public weave(node: Mention): INodeMarkup {
    return { opener: '@' + node.value }
  }
}

describe('custom', function () {
  test('mention', function () {
    const weaver = new DefaultMarkupWeaver()
    weaver.useWeaver(new MentionWeaver())

    const markup = weaver.weave({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'mention',
              value: 'guanghechen',
            },
          ],
        },
      ],
    } as unknown as Root)
    expect(markup).toEqual('@guanghechen')
  })
})
