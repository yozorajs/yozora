import fs from 'fs-extra'
import { FileTestCaseMaster, FileTestCaseMasterProps, FileTestCase } from '@lemon-clown/mocha-test-master'
import { InlineDataNodeType, DataNode } from '@yozora/core'
import { DataNodeParser, dataNodeParser } from '../../src'


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
  answer: DataNode<any>[]
}>


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerParseTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly dataNodeParser: DataNodeParser
  public constructor({
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.parse.answer.json',
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
      const answer = this.dataNodeParser.parseInlineData(content)
      results.push({ content, answer })
    }
    return results
  }

  // override
  public toJSON(data: OutputData): OutputData {
    const stringified = JSON.stringify(data, (key: string, val: any) => {
      switch (key) {
        case 'children':
          return (val == null || val.length <= 0) ? undefined : val
        default:
          return val
      }
    })
    return JSON.parse(stringified)
  }
}
