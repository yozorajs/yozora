import type { Definition, Root } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { describe, expect, test } from 'vitest'
import { loadJSONFixture } from 'vitest.setup'
import { calcDefinitionMap, calcIdentifierSet, collectDefinitions } from '../src'

describe('calcIdentifierSet', function () {
  describe('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

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
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    const result = collectDefinitions(ast)
    expect(result).toMatchSnapshot()
    expect(ast).toEqual(originalAst)
  })
})

describe('calcDefinitionMap', function () {
  test('basic1', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')

    const { root, definitionMap } = calcDefinitionMap(ast)
    expect(root).toBe(ast)
    expect(ast).toEqual(originalAst)
    expect(definitionMap).toMatchSnapshot()
  })

  test('presetDefinitions', function () {
    const originalAst: Readonly<Root> = loadJSONFixture('basic1.ast.json')
    const ast: Root = loadJSONFixture('basic1.ast.json')
    const presetDefinitions: Definition[] = [
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

  test('prototype-named identifiers', function () {
    const definition: Definition = {
      type: DefinitionType,
      identifier: 'constructor',
      label: 'constructor',
      url: '/definition',
    }
    const preset: Definition = {
      type: DefinitionType,
      identifier: '__proto__',
      label: '__proto__',
      url: '/preset',
    }
    const ast: Root = { type: 'root', children: [definition] }

    const { root, definitionMap } = calcDefinitionMap(ast, undefined, [preset])

    expect(Object.getPrototypeOf(definitionMap)).toBeNull()
    expect(definitionMap[definition.identifier]).toBe(definition)
    expect(definitionMap[preset.identifier]).toBe(preset)
    expect(root.children).toEqual(ast.children.concat(preset))
  })
})
