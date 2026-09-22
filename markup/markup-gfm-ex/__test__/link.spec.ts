import type { Link, Root } from '@yozora/ast'
import { DefaultMarkupWeaver } from '@yozora/markup-gfm-ex'

const weaveLink = (link: Link): string =>
  new DefaultMarkupWeaver().weave({
    type: 'root',
    children: [{ type: 'paragraph', children: [link] }],
  } as unknown as Root)

test.each(['mailto:foo@bar.baz', 'xmpp:foo@bar.baz/txt'])(
  'weaves matching protocol link text as an autolink: %s',
  url => {
    expect(
      weaveLink({
        type: 'link',
        url,
        children: [{ type: 'text', value: url }],
      } as unknown as Link),
    ).toBe(url)
  },
)

test('keeps an explicit protocol link when its label differs', () => {
  expect(
    weaveLink({
      type: 'link',
      url: 'mailto:foo@bar.baz',
      children: [{ type: 'text', value: 'email' }],
    } as unknown as Link),
  ).toBe('[email](mailto:foo@bar.baz)')
})
