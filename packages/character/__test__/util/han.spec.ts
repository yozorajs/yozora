import { stripChineseCharacters, tightenChineseCharacters } from '../../src'

describe('stripChineseCharacters', function () {
  test('han -- han', function () {
    expect(stripChineseCharacters('中文\n中文2')).toEqual('中文中文2')
    expect(stripChineseCharacters('中文；\n中文2')).toEqual('中文；中文2')
    expect(stripChineseCharacters('中\n文\n字')).toEqual('中文字')
    expect(stripChineseCharacters('中\n；\n文')).toEqual('中；文')
  })

  test('han -- english', function () {
    expect(stripChineseCharacters('中文\nEnglish')).toEqual('中文\nEnglish')
    expect(stripChineseCharacters('中文\n.English')).toEqual('中文\n.English')
    expect(stripChineseCharacters('中文；\nEnglish')).toEqual('中文；\nEnglish')
  })

  test('english -- han', function () {
    expect(stripChineseCharacters('English\n中文')).toEqual('English\n中文')
    expect(stripChineseCharacters('English.\n中文')).toEqual('English.\n中文')
    expect(stripChineseCharacters('English\n；中文')).toEqual('English\n；中文')
  })

  test('english -- english', function () {
    expect(stripChineseCharacters('English\nEnglish')).toEqual('English\nEnglish')
    expect(stripChineseCharacters('English.\nEnglish')).toEqual('English.\nEnglish')
    expect(stripChineseCharacters('English\n.English')).toEqual('English\n.English')
  })
})

describe('tightenChineseCharacters', function () {
  test('han -- han', function () {
    expect(tightenChineseCharacters('中 文 字')).toEqual('中文字')
    expect(tightenChineseCharacters('中 \n；\t 文')).toEqual('中；文')
  })

  test('mixed languages', function () {
    expect(tightenChineseCharacters('中 English 文')).toEqual('中 English 文')
  })
})

describe('Han fallback', function () {
  let fallback: typeof import('../../src/util/han')

  beforeAll(async function () {
    vi.resetModules()
    vi.stubGlobal(
      'RegExp',
      new Proxy(RegExp, {
        construct(target, args, newTarget) {
          const [pattern] = args
          if (typeof pattern === 'string' && pattern.includes('\\p{Script=Han}')) {
            throw new SyntaxError('Unicode property escapes are unavailable')
          }
          return Reflect.construct(target, args, newTarget)
        },
      }),
    )

    try {
      fallback = await import('../../src/util/han')
    } finally {
      vi.unstubAllGlobals()
      vi.resetModules()
    }
  })

  test('strips line endings between Han characters while preserving spaces and other text', function () {
    expect(fallback.stripChineseCharacters('中\n\n文\n字')).toBe('中文字')
    expect(fallback.stripChineseCharacters(' 中 文\n字 ')).toBe(' 中 文字 ')
    expect(fallback.stripChineseCharacters('English\n中文\nEnglish')).toBe('English\n中文\nEnglish')
    expect(fallback.stripChineseCharacters('')).toBe('')
  })

  test('tightens Han whitespace while preserving outer whitespace and mixed languages', function () {
    expect(fallback.tightenChineseCharacters('中 \t\n文\u3000字')).toBe('中文字')
    expect(fallback.tightenChineseCharacters(' 中 文 ')).toBe(' 中文 ')
    expect(fallback.tightenChineseCharacters('中 English 文')).toBe('中 English 文')
    expect(fallback.tightenChineseCharacters('')).toBe('')
  })
})
