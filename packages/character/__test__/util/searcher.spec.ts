import { createCodePointSearcher } from '../../src'

describe('createCodePointSearcher', function () {
  test('sorts sparse code points and rejects missing values around their boundaries', function () {
    const codePoints = [80, 10, 60, 30, 10, 70, 50, 20, 40]
    const original = [...codePoints]
    const [search, ordered] = createCodePointSearcher(codePoints)

    expect(ordered).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
    expect(codePoints).toEqual(original)

    for (const codePoint of ordered) {
      expect(search(codePoint), String(codePoint)).toBe(true)
    }
    for (const codePoint of [0, 9, 11, 35, 79, 81, 90]) {
      expect(search(codePoint), String(codePoint)).toBe(false)
    }
  })
})
