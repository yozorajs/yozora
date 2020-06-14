import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import {
  TestCase,
  TestCaseGroup,
  TestCaseHandleFunc,
  TestCaseMaster,
} from './case-master'


/**
 * test case
 *
 * 测试用例
 */
export interface FileTestCase extends TestCase {
  /**
   * file path of input data
   *
   * 输入文件的路径
   */
  readonly inputFilePath: string
  /**
   * file path of the located the expected result of the inputFilePath
   *
   * inputFilePath 定义的数据对应的答案数据所在的文件路径
   */
  readonly answerFilePath: string
}


/**
 * test case group
 *
 * 测试用例组
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileTestCaseGroup extends TestCaseGroup<FileTestCase, FileTestCaseGroup> { }


/**
 * params of  TestCaseMaster.constructor
 */
export interface FileTestCaseMasterProps {
  /**
   * root directory of test cases
   */
  caseRootDirectory: string
  /**
   * filename suffix of input data file
   *
   * 文件的文件名后缀
   */
  inputFileNameSuffix: string
  /**
   * filename suffix of the located the expected result of the inputFilePath
   *
   * inputFilePath 定义的数据对应的答案数据所在的文件路径后缀
   */
  answerFileNameSuffix: string
}


export abstract class FileTestCaseMaster<T, D> extends TestCaseMaster<FileTestCase, FileTestCaseGroup> {
  protected readonly inputFileNameSuffix: string
  protected readonly answerFileNameSuffix: string

  public constructor({ caseRootDirectory, inputFileNameSuffix, answerFileNameSuffix }: FileTestCaseMasterProps) {
    super(caseRootDirectory)
    this.inputFileNameSuffix = inputFileNameSuffix
    this.answerFileNameSuffix = answerFileNameSuffix
  }

  /**
   * override method
   * @see TestCaseMaster#scan
   */
  public async scan(caseDirectory: string, recursive = true): Promise<this> {
    // eslint-disable-next-line no-param-reassign
    caseDirectory = path.resolve(this.caseRootDirectory, caseDirectory)
    const self = this
    const scan = async (dir: string): Promise<FileTestCaseGroup> => {
      const caseGroup: FileTestCaseGroup = {
        title: path.relative(self.caseRootDirectory, dir),
        subGroups: [],
        cases: [],
      }

      const files: string[] = await fs.readdir(dir)
      for (const filename of files) {
        const absoluteFilePath = path.join(dir, filename)
        const stat = await fs.stat(absoluteFilePath)
        if (stat.isDirectory()) {
          // recursive scanning
          if (recursive) {
            const subGroup: FileTestCaseGroup = await scan(absoluteFilePath)

            /**
             * append sub-case groups directly to caseGroup if there are only sub-case groups and no sub-cases
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
          if (!filename.endsWith(self.inputFileNameSuffix)) continue
          const title = filename.slice(0, -self.inputFileNameSuffix.length)
          const answerFilePath = absoluteFilePath.slice(0, -self.inputFileNameSuffix.length) + self.answerFileNameSuffix
          const kase: FileTestCase = {
            title,
            dir,
            inputFilePath: absoluteFilePath,
            answerFilePath,
          }
          caseGroup.cases.push(kase)
          continue
        }
      }

      return caseGroup
    }

    /**
     * append sub-case groups directly to caseGroup if there are only sub-case groups and no sub-cases
     *
     * 如果只有子案例组而没有子案例，则直接将子案例组追加到 caseGroup 中
     */
    const caseGroup = await scan(caseDirectory)
    if (caseGroup.cases.length > 0) {
      self._caseGroups.push(caseGroup)
    } else if (caseGroup.subGroups.length > 0) {
      self._caseGroups.push(...caseGroup.subGroups)
    }

    return this
  }

  /**
   * Compile test case data and get output data
   * @param kase
   */
  public abstract async consume(kase: FileTestCase): Promise<T>

  /**
   * Convert to JSON data
   * @param result
   */
  public abstract toJSON(result: T): D

  /**
   * Converted to string type for writing to a file
   * @param data
   */
  public stringify(data: D): string {
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
   * @param answer  answer
   */
  public async check(output: T, answer: T): Promise<void> {
    // check data
    const outputData: D = this.toJSON(output)
    const answerData: D = answer as any
    expect(outputData).to.deep.equal(answerData)
  }

  /**
   * override method
   * @see TestCaseMaster#answer
   */
  public async answer(doAnswer?: TestCaseHandleFunc<FileTestCase>): Promise<void> {
    const self = this
    if (doAnswer == null) {
      // eslint-disable-next-line no-param-reassign
      doAnswer = async kase => {
        const output: T = await self.consume(kase)
        const data: D = await self.toJSON(output)
        const content: string = await self.stringify(data)
        await fs.writeFile(kase.answerFilePath, content, 'utf-8')
      }
    }
    super.answer(doAnswer)
  }

  /**
   * override method
   * @see TestCaseMaster#test
   */
  public test(doTest?: TestCaseHandleFunc<FileTestCase>): void {
    const self = this
    if (doTest == null) {
      // eslint-disable-next-line no-param-reassign
      doTest = async kase => {
        if (!fs.existsSync(kase.answerFilePath)) {
          throw new Error(`answer file (${ kase.answerFilePath }) not found`)
        }
        const answer: T = await fs.readJSON(kase.answerFilePath)
        const output: T = await self.consume(kase)
        await self.check(output, answer)
      }
    }
    super.test(doTest)
  }
}
