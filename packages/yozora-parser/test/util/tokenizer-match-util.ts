import fs from 'fs-extra'
import { FileTestCaseMaster, FileTestCaseMasterProps, FileTestCase } from '@lemon-clown/mocha-test-master'
import { InlineDataNodeType } from '@yozora/core'
import { DataNodeParser, DataNodeTokenPosition, dataNodeParser } from '@yozora/parser'


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
  answer: DataNodeTokenPosition<any>[]
}>


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerMatchTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly dataNodeParser: DataNodeParser
  public constructor({
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.match.answer.json',
  }: PickPartial<FileTestCaseMasterProps, 'inputFileNameSuffix' | 'answerFileNameSuffix'>) {
    super({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix })
    this.dataNodeParser = dataNodeParser
  }

  // override
  public async consume(kase: FileTestCase): Promise<OutputData | never> {
    const { inputFilePath } = kase
    const input: InputData = await fs.readJSON(inputFilePath)
    const results: OutputData = []
    for (const { content } of input.cases) {
      const answer = this.dataNodeParser.matchInlineData(content)
      results.push({ content, answer })
    }
    return results
  }

  // override
  public toJSON(data: OutputData): OutputData {
    return data
  }
}
