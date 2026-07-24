import { DefaultMarkupWeaver } from '@yozora/markup-weaver'
import Parser from '@yozora/parser'
import fs from 'node:fs'
import path from 'node:path'
import { repositoryRoot } from '../../internal/repository.mjs'
import config from './config.json'

const fixtureDirectory = path.join(repositoryRoot, 'fixtures/gfm')
const parser = new Parser({ defaultParseOptions: { shouldReservePosition: true } })
const weaver = new DefaultMarkupWeaver()
const markupAnswerExcludedExamples = new Set(config.markupAnswerExcludedExamples)

function normalizeAst(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, node) => {
      if (node?.type == null || node.position == null) return node
      const { type, position, ...data } = node
      return { type, position, ...data }
    }),
  )
}

let updatedCount = 0
for (const filename of fs.readdirSync(fixtureDirectory).sort()) {
  if (!/^#\d{3}[.]json$/.test(filename)) continue

  const filepath = path.join(fixtureDirectory, filename)
  const fixture = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  const testcase = fixture.cases?.[0]
  if (fixture.cases?.length !== 1 || testcase == null || typeof testcase.input !== 'string') {
    throw new TypeError(`Invalid GFM fixture ${filename}`)
  }

  const exampleId = filename.slice(0, -5)
  const needsMarkupAnswer = !Object.hasOwn(testcase, 'markupAnswer')
  const needsParseAnswer = !Object.hasOwn(testcase, 'parseAnswer')
  const excludesMarkupAnswer = markupAnswerExcludedExamples.has(exampleId)

  const shouldGenerateMarkupAnswer = needsMarkupAnswer && !excludesMarkupAnswer
  if (!shouldGenerateMarkupAnswer && !needsParseAnswer) continue

  const ast = parser.parse(testcase.input)
  const nextCase = {
    description: testcase.description,
    input: testcase.input,
    ...(!needsMarkupAnswer && { markupAnswer: testcase.markupAnswer }),
    ...(shouldGenerateMarkupAnswer && {
      markupAnswer: weaver.weave(ast),
    }),
    htmlAnswer: testcase.htmlAnswer,
    parseAnswer: needsParseAnswer ? normalizeAst(ast) : testcase.parseAnswer,
  }
  fs.writeFileSync(filepath, `${JSON.stringify({ ...fixture, cases: [nextCase] }, null, 2)}\n`)
  updatedCount += 1
}

console.log(`Updated answers in ${updatedCount} GFM fixtures`)
