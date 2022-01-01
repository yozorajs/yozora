import type { IDefinition, IRoot } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { loadJSONFixture } from 'jest.setup'
import { calcDefinitionMap, calcIdentifierSet, collectDefinitions } from '../src'

describe('calcIdentifierSet', function () {
  describe('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    test('default', function () {
      const result = calcIdentifierSet(ast, [DefinitionType])
      expect(result).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })

    test('presetIdentifiers', function () {
      const result = calcIdentifierSet(
        ast,
        [DefinitionType],
        [
          {
            identifier: 'foooo',
            label: 'ooooof',
          },
        ],
      )
      expect(result).toMatchSnapshot()
      expect(ast).toEqual(originalAst)
    })
  })
})

describe('collectDefinitions', function () {
  test('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    const result = collectDefinitions(ast)
    expect(result).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('calcDefinitionMap', function () {
  test('basic1', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')

    const { root, definitionMap } = calcDefinitionMap(ast)
    expect(root).toBe(ast)
    expect(ast).toEqual(originalAst)
    expect(definitionMap).toMatchSnapshot()
  })

  test('presetDefinitions', function () {
    const originalAst: Readonly<IRoot> = loadJSONFixture('basic1.ast.json')
    const ast: IRoot = loadJSONFixture('basic1.ast.json')
    const presetDefinitions: IDefinition[] = [
      {
        type: DefinitionType,
        identifier: 'yozora__test_identifier',
        label: 'yozora test label',
        url: '#/',
        title: 'waw',
      },
    ]

    const { root, definitionMap } = calcDefinitionMap(ast, undefined, presetDefinitions)

    expect(root).not.toBe(ast)
    expect(root).toEqual({
      ...ast,
      children: ast.children.concat(presetDefinitions),
    })
    expect(ast).toEqual(originalAst)
    expect(definitionMap).toMatchSnapshot()
  })
})
