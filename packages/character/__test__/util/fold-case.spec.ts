import { foldCase } from '../../src'

describe('fold-case', function () {
  test('unicode', function () {
    expect(foldCase('ẞ')).toEqual('ss')
    expect(foldCase('SS')).toEqual('SS')
  })

  test('ascii', function () {
    expect(foldCase('A')).toEqual('A')
    expect(foldCase('a')).toEqual('a')
  })
})
