import { foldCase } from '../../src'

describe('fold-case', function () {
  test('unicode', function () {
    expect(foldCase('ẞ')).toEqual('ss')
    expect(foldCase('SS')).toEqual('SS')
  })

  test.each([
    ['\u1C80', '\u0432'],
    ['\u1C81', '\u0434'],
    ['\u1C82', '\u043E'],
    ['\u1C83', '\u0441'],
    ['\u1C84', '\u0442'],
    ['\u1C85', '\u0442'],
    ['\u1C86', '\u044A'],
    ['\u1C87', '\u0463'],
    ['\u1C88', '\uA64B'],
  ])('folds %s to %s', function (source, target) {
    expect(foldCase(source)).toEqual(target)
  })

  test('ascii', function () {
    expect(foldCase('A')).toEqual('A')
    expect(foldCase('a')).toEqual('a')
  })
})
