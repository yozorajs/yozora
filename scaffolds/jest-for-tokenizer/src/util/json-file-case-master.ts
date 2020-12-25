import type {
  UseCase,
  AnswerUseCase,
  UseCaseGroup,
  TestUseCase,
} from './case-master'
import fs from 'fs-extra'
import path from 'path'
import { UseCaseMaster }from './case-master'


/**
 *
 */
export interface JsonFileUseCaseItem {
  /**
   * Description of the use case
   */
  description: string
  /**
   * Input Content input content
   */
  input: string
}


/**
 * JSON file-based use case
 */
export interface JsonFileUseCase extends UseCase {
  /**
   * File path of the use case
   */
  readonly filepath: string
}


/**
 * JSON file-based use case group
 */
export interface JsonFileUseCaseGroup
  extends UseCaseGroup<JsonFileUseCase, JsonFileUseCaseGroup> {

}


/**
 * Params of JsonFileUseCaseMaster.constructor
 */
export interface JsonFileUseCaseMasterProps {
  /**
   * Root directory of use cases
   */
  readonly caseRootDirectory: string
  /**
   * The field name of the answer data
   */
  readonly answerField: string
}


/**
 * Encapsulates the methods for processing JSON file-based use case
 *
 * @export
 * @abstract
 * @class JsonFileUseCaseMaster
 * @extends {UseCaseMaster<JsonFileUseCase, JsonFileUseCaseGroup>}
 * @template R  type of the result returned from `this.consume()`
 * @template D  type of the result returned from `this.toJSON()`
 */
export abstract class JsonFileUseCaseMaster<R, D>
  extends UseCaseMaster<JsonFileUseCase, JsonFileUseCaseGroup> {

  protected readonly answerField: string

  public constructor(caseRootDirectory: string, answerField: string) {
    super(caseRootDirectory)
    this.answerField = answerField
  }

  /**
   * @override
   * @see UseCaseMaster#scan
   */
  public scan(caseDirectoryOrFile: string, recursive = true): this {
    const self = this

    const scan = (filepath: string, isDir: boolean): JsonFileUseCaseGroup => {
      const [dir, files]: [string, string[]] = isDir
        ? [filepath, fs.readdirSync(filepath)]
        : [path.dirname(filepath), [path.basename(filepath)]]

      const caseGroup: JsonFileUseCaseGroup = {
        title: path.relative(self.caseRootDirectory, dir),
        cases: [],
        subGroups: [],
      }

      for (const filename of files) {
        const absoluteFilePath = path.join(dir, filename)
        const stat = fs.statSync(absoluteFilePath)
        if (stat.isDirectory()) {
          // recursive scanning
          if (recursive) {
            const subGroup: JsonFileUseCaseGroup = scan(absoluteFilePath, true)

            /**
             * Append the subGroup into the caseGroup.subGroups directly if
             * there are only sub case groups and no sub cases
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
          const kase: JsonFileUseCase = { title, dir, filepath: absoluteFilePath }
          caseGroup.cases.push(kase)
          continue
        }
      }

      return caseGroup
    }


    const filepath =  path.resolve(this.caseRootDirectory, caseDirectoryOrFile)
    const caseGroup = scan(filepath, fs.statSync(filepath).isDirectory())
    if (caseGroup.cases.length > 0) {
      self.caseGroups.push(caseGroup)
    } else if (caseGroup.subGroups.length > 0) {
      self.caseGroups.push(...caseGroup.subGroups)
    }

    return this
  }

  /**
   * @override
   * @see UseCaseMaster#answer
   */
  public answerCaseTree(answerUseCase?: AnswerUseCase<JsonFileUseCase>): Promise<void | unknown> {
    const self = this
    if (answerUseCase == null) {
      // eslint-disable-next-line no-param-reassign
      answerUseCase = async fileCase => {
        const data = await fs.readJSON(fileCase.filepath)
        for (const caseItem of data.cases) {
          const output: R = await self.consume(caseItem)
          const outputData: D = self.format(output)
          caseItem[self.answerField] = outputData
        }

        const content: string = self.stringify(data)
        await fs.writeFile(fileCase.filepath, content, 'utf-8')
      }
    }
    return super.answerCaseTree(answerUseCase)
  }

  /**
   * @override
   * @see UseCaseMaster#test
   */
  public runCaseTree(matchUseCase?: TestUseCase<JsonFileUseCase>): void {
    const self = this
    if (matchUseCase == null) {
      // eslint-disable-next-line no-param-reassign
      matchUseCase = function (fileCase) {
        const data = fs.readJSONSync(fileCase.filepath)
        const title = data.title || fileCase.title
        const matchTask = async function () {
          for (const caseItem of data.cases) {
            const output: R = await self.consume(caseItem)
            const answer: D = caseItem[self.answerField]
            self.check(output, answer)
          }
        }
        return { title, matchTask }
      }
    }
    super.runCaseTree(matchUseCase)
  }

  /**
   * Check if input matches answer
   * @param output  output data
   * @param answerData  answer
   */
  public check(output: R, answerData: D): void {
    // check data
    const outputData: D = this.format(output)
    expect(outputData).toEqual(answerData)
  }

  /**
   * Converted to string type for writing to a file
   * @param data
   */
  public stringify(data: D): string {
    const filter = (key: string, value: unknown) => {
      if (value instanceof RegExp) return value.source
      return value
    }
    return JSON.stringify(data, filter, 2)
  }

  /**
   * Consume input and produce answer
   * @param inputItem
   */
  public abstract consume(inputItem: JsonFileUseCaseItem): Promise<R>

  /**
   * Convert to JSON data
   * @param result
   */
  public abstract format(result: R): D
}
