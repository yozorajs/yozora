import fs from 'fs-extra'
import { FileTestCaseMaster, FileTestCaseMasterProps, FileTestCase } from '@lemon-clown/mocha-test-master'
import { InlineDataNodeType, DataNodeTokenFlankingGraph, makeFlankingGraphPrettier } from '@yozora/core'
import {
  InlineDataNodeTokenizer,
  BlockDataNodeTokenizer,
  LineBreakTokenizer,
  TextTokenizer,
  DeleteTokenizer,
  ImageTokenizer,
  InlineCodeTokenizer,
  InlineFormulaTokenizer,
  InlineLinkTokenizer,
  ReferenceLinkTokenizer,
} from '@yozora/parser'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>


/**
 * 输入文件的数据类型
 */
type InputData = {
  type: InlineDataNodeType
  cases: Array<{
    content: string
    description?: string
    expectedHtml?: string
    reason?: string
  }>
}


/**
 * 输出文件的数据类型
 */
type OutputData = Array<{
  content: string
  answer: DataNodeTokenFlankingGraph<any>
}>


class Tokenizer {
  public readonly tokenizers: (InlineDataNodeTokenizer | BlockDataNodeTokenizer)[]

  public constructor() {
    this.tokenizers = []
    const context = undefined as any
    const priority = 0

    // inline tokenizer
    const deleteTokenizer = new DeleteTokenizer(context, priority)
    const imageTokenizer = new ImageTokenizer(context, priority)
    const inlineFormulaTokenizer = new InlineFormulaTokenizer(context, priority)
    const inlineCodeTokenizer = new InlineCodeTokenizer(context, priority)
    const inlineLinkTokenizer = new InlineLinkTokenizer(context, priority)
    const lineBreakTokenizer = new LineBreakTokenizer(context, priority)
    const referenceLinkTokenizer = new ReferenceLinkTokenizer(context, priority)
    const textTokenizer = new TextTokenizer(context, priority)

    this.tokenizers.push(
      deleteTokenizer,
      imageTokenizer,
      inlineCodeTokenizer,
      inlineFormulaTokenizer,
      inlineLinkTokenizer,
      lineBreakTokenizer,
      referenceLinkTokenizer,
      textTokenizer,
    )
  }

  public match(type: InlineDataNodeType, content: string): DataNodeTokenFlankingGraph<typeof type> {
    for (const tokenizer of this.tokenizers) {
      if (tokenizer.type !== type) continue
      return tokenizer.match(content)
    }
    return { type, points: [], edges: [] }
  }
}


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerMatchTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly tokenizer: Tokenizer
  public constructor({
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.match.answer.json',
  }: PickPartial<FileTestCaseMasterProps, 'inputFileNameSuffix' | 'answerFileNameSuffix'>) {
    super({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix })
    this.tokenizer = new Tokenizer()
  }

  // override
  public async consume(kase: FileTestCase): Promise<OutputData | never> {
    const { inputFilePath } = kase
    const input: InputData = await fs.readJSON(inputFilePath)
    const results: OutputData = []
    for (const { content } of input.cases) {
      const answer = this.tokenizer.match(input.type, content)
      const prettierAnswer = makeFlankingGraphPrettier(answer)
      results.push({ content, answer: prettierAnswer })
    }
    return results
  }

  // override
  public toJSON(data: OutputData): OutputData {
    return data
  }
}
