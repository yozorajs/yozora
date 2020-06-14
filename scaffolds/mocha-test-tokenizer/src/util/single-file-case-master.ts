import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import {
  TestCase,
  TestCaseAnswerFunc,
  TestCaseGroup,
  TestCaseMaster,
  TestCaseMatchFunc,
} from './case-master'


export interface SingleTestCaseItem {
  /**
   * case description
   */
  description?: string
  /**
   * input content
   */
  input: string
  /**
   * other data
   */
  [key: string]: any
}


/**
 * content type of case file
 */
export interface SingleFileCaseData {
  title: string
  cases: SingleTestCaseItem[]
}


/**
 * test case
 *
 * 测试用例
 */
export interface SingleFileTestCase extends TestCase {
  /**
   * 测试用例文件路径
   */
  readonly filePath: string
}


/**
 * test case group
 *
 * 测试用例组
 */
export interface SingleFileTestCaseGroup
  extends TestCaseGroup<SingleFileTestCase, SingleFileTestCaseGroup> {

}


/**
 * params of  TestCaseMaster.constructor
 */
export interface SingleFileTestCaseMasterProps {
  /**
   * root directory of test cases
   */
  readonly caseRootDirectory: string
  /**
   * The field name for the input data
   *
   * 输入数据的字段名
   */
  readonly inputField: string
  /**
   * The field name for the answer data
   *
   * 答案数据的字段名
   */
  readonly answerField: string
}


export abstract class SingleFileTestCaseMaster<Output, OutputData>
  extends TestCaseMaster<SingleFileTestCase, SingleFileTestCaseGroup> {
  protected readonly inputField: string
  protected readonly answerField: string

  public constructor(props: SingleFileTestCaseMasterProps) {
    super(props.caseRootDirectory)
    this.inputField = props.inputField
    this.answerField = props.answerField
  }

  /**
   * override method
   * @see TestCaseMaster#scan
   */
  public async scan(caseDirectoryOrFile: string, recursive = true): Promise<this> {
    // eslint-disable-next-line no-param-reassign
    caseDirectoryOrFile = path.resolve(this.caseRootDirectory, caseDirectoryOrFile)
    const self = this
    const scan = async (dirOrFile: string): Promise<SingleFileTestCaseGroup> => {
      const stat = fs.statSync(dirOrFile)
      let dir = dirOrFile
      let files: string[] = []
      if (stat.isFile()) {
        const pathParseResult = path.parse(dirOrFile)
        dir = pathParseResult.dir
        files = [pathParseResult.base]
      } else {
        files = await fs.readdir(dirOrFile)
      }

      const caseGroup: SingleFileTestCaseGroup = {
        title: path.relative(self.caseRootDirectory, dir),
        subGroups: [],
        cases: [],
      }

      for (const filename of files) {
        const absoluteFilePath = path.join(dir, filename)
        const stat = await fs.stat(absoluteFilePath)
        if (stat.isDirectory()) {
          // recursive scanning
          if (recursive) {
            const subGroup: SingleFileTestCaseGroup = await scan(absoluteFilePath)

            /**
             * append sub-case groups directly to caseGroup if there are only
             * sub-case groups and no sub-cases
             *
             * 如果只有子案例组而没有子案例，则直接将子案例组追加到 caseGroup 中
             */
            if (subGroup.cases.length > 0) {
              caseGroup.subGroups.push(subGroup)
            } else if (subGroup.subGroups.length > 0) {
              caseGroup.subGroups.push(...subGroup.subGroups)
            }
          }
          continue
        }
        if (stat.isFile()) {
          const { name: title } = path.parse(filename)
          const kase: SingleFileTestCase = {
            title,
            dir,
            filePath: absoluteFilePath,
          }
          caseGroup.cases.push(kase)
          continue
        }
      }

      return caseGroup
    }

    /**
     * append sub-case groups directly to caseGroup if there are only sub-case
     * groups and no sub-cases
     *
     * 如果只有子案例组而没有子案例，则直接将子案例组追加到 caseGroup 中
     */
    const caseGroup = await scan(caseDirectoryOrFile)
    if (caseGroup.cases.length > 0) {
      self._caseGroups.push(caseGroup)
    } else if (caseGroup.subGroups.length > 0) {
      self._caseGroups.push(...caseGroup.subGroups)
    }

    return this
  }

  /**
   * consume input and produce answer
   * @param inputItem
   */
  public abstract async consume(inputItem: SingleTestCaseItem): Promise<Output>

  /**
   * Convert to JSON data
   * @param result
   */
  public abstract toJSON(result: Output): OutputData

  /**
   * Converted to string type for writing to a file
   * @param data
   */
  public stringify(data: OutputData): string {
    const stringifyFilter = (key: string, value: any) => {
      // RegExp to string
      if (value instanceof RegExp) {
        return value.source
      }
      return value
    }
    return JSON.stringify(data, stringifyFilter, 2)
  }

  /**
   * Check if input matches answer
   * @param output  output data
   * @param answerData  answer
   */
  public async check(output: Output, answerData: OutputData): Promise<void> {
    // check data
    const outputData: OutputData = this.toJSON(output)
    expect(outputData).to.deep.equal(answerData)
  }

  /**
   * override method
   * @see TestCaseMaster#answer
   */
  public async answer(doAnswer?: TestCaseAnswerFunc<SingleFileTestCase>): Promise<void> {
    const self = this
    if (doAnswer == null) {
      // eslint-disable-next-line no-param-reassign
      doAnswer = async fileCase => {
        const data = await fs.readJSON(fileCase.filePath)
        for (const caseItem of data.cases) {
          const output: Output = await self.consume(caseItem)
          const outputData: OutputData = self.toJSON(output)
          caseItem[self.answerField] = outputData
        }
        const content: string = await self.stringify(data)
        await fs.writeFile(fileCase.filePath, content, 'utf-8')
      }
    }
    await super.answer(doAnswer)
  }

  /**
   * override method
   * @see TestCaseMaster#test
   */
  public test(doTest?: TestCaseMatchFunc<SingleFileTestCase>): void {
    const self = this
    if (doTest == null) {
      // eslint-disable-next-line no-param-reassign
      doTest = function* (fileCase) {
        const data = fs.readJSONSync(fileCase.filePath)
        yield data.title || fileCase.title
        yield async function () {
          for (const caseItem of data.cases) {
            const answer: OutputData = caseItem[self.answerField]
            const output: Output = await self.consume(caseItem)
            await self.check(output, answer)
          }
        }
      }
    }
    super.test(doTest)
  }
}
