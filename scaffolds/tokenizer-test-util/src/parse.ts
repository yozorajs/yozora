import fs from 'fs-extra'
import { DataNodeType, DataNode } from '@yozora/tokenizer-core'
import { FileTestCaseMaster, FileTestCaseMasterProps, FileTestCase } from './util/file-case-master'


type PickPartial<T, P extends keyof T> = Omit<T, P> & Partial<Pick<T, P>>
type ParseFunc = (content: string) => DataNode[]


/**
 * 输入文件的数据类型
 */
type InputData = {
  type: DataNodeType
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
  answer: DataNode[]
}>


/**
 * DataSchema 编译器测试用例辅助类
 */
export class TokenizerParseTestCaseMaster
  extends FileTestCaseMaster<OutputData, OutputData> {
  private readonly parse: ParseFunc
  public constructor(parse: ParseFunc, {
    caseRootDirectory,
    inputFileNameSuffix = '.input.json',
    answerFileNameSuffix = '.parse.answer.json',
  }: PickPartial<FileTestCaseMasterProps, 'inputFileNameSuffix' | 'answerFileNameSuffix'>) {
    super({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix })
    this.parse = parse
  }

  // override
  public async consume(kase: FileTestCase): Promise<OutputData | never> {
    const { inputFilePath } = kase
    const input: InputData = await fs.readJSON(inputFilePath)
    const results: OutputData = []
    for (const { content } of input.cases) {
      const answer = this.parse(content)
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
