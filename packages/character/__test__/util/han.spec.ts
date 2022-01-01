import { stripChineseCharacters } from '../../src'

describe('stripChineseCharacters', function () {
  test('han -- han', function () {
    expect(stripChineseCharacters('中文\n中文2')).toEqual('中文中文2')
    expect(stripChineseCharacters('中文；\n中文2')).toEqual('中文；中文2')
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
