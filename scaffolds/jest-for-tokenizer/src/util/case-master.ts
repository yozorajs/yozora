/**
 * Use case
 */
export interface UseCase {
  /**
   * The use case title
   */
  readonly title: string
  /**
   * Where the use case located
   */
  readonly dir: string
}


/**
 * Use case group
 */
export interface UseCaseGroup<I extends UseCase, G extends UseCaseGroup<I, G>> {
  /**
   * Title of the use case group
   */
  readonly title: string
  /**
   * Use cases of current group
   */
  readonly cases: I[]
  /**
   * Sub use case group
   */
  readonly subGroups: UseCaseGroup<I, G>[]
}


/**
 * Generate answer for the give use case
 */
export type AnswerUseCase<I extends UseCase> =
  (kase: I) => Promise<void>


/**
 * Create a test for the give use case
 */
export type TestUseCase<I extends UseCase> =
  (kase: I) => { title: string, matchTask: () => Promise<void> }


/**
 * Encapsulates the methods for processing use case
 *
 * @export
 * @abstract
 * @class UseCaseMaster
 * @template I  type of the UseCase
 * @template G  type of the UseCaseGroup
 */
export abstract class UseCaseMaster<
  I extends UseCase,
  G extends UseCaseGroup<I, G>
  > {

  protected readonly caseRootDirectory: string
  protected readonly caseGroups: G[]

  public constructor(caseRootDirectory: string) {
    this.caseRootDirectory = caseRootDirectory
    this.caseGroups = []
  }

  /**
   * Scan potential test case directory to generate TestCase entries
   *
   * @param caseDirectory absolute path represent the test case root directory
   * @param recursive     whether to scan recursively
   */
  public abstract scan(caseDirectory: string, recursive: boolean): this

  /**
   * Get the list of TestCaseGroup
   */
  public collect(): G[] {
    return this.caseGroups.slice()
  }

  /**
   * Collect TestCaseGroup list, and flat them to TestCase list
   */
  public collectAndFlat(): I[] {
    const cases: I[] = []
    const recursiveCollect = (caseGroup: G): void => {
      if (caseGroup.cases != null) {
        cases.push(...caseGroup.cases)
      }

      if (caseGroup.subGroups !== null) {
        for (const subGroup of caseGroup.subGroups) {
          recursiveCollect(subGroup as G)
        }
      }
    }

    this.caseGroups.forEach(recursiveCollect)
    return cases
  }

  /**
   * Generate answers
   * @param answerUseCase
   */
  public answerCaseTree(answerUseCase?: AnswerUseCase<I>): Promise<void | unknown> {
    const tasks: Promise<void>[] = []
    const answerUseCaseGroup = async (caseGroup: G): Promise<void> => {
      // Test group.cases
      for (const kase of caseGroup.cases) {
        if (answerUseCase != null) {
          const task = answerUseCase(kase)
          tasks.push(task)
        }
      }

      // Test sub groups
      for (const subGroup of caseGroup.subGroups) {
        const task = answerUseCaseGroup(subGroup as G)
        tasks.push(task)
      }
    }

    // Generate answers
    this.caseGroups.forEach(answerUseCaseGroup)

    // Wait all tasks completed
    return Promise.all(tasks)
  }

  /**
   * run test
   * @param matchUseCase
   */
  public runCaseTree(matchUseCase?: TestUseCase<I>): void {
    const matchUseCaseGroup = (caseGroup: G) => {
      describe(caseGroup.title, function () {
        // Test current group use cases
        for (const kase of caseGroup.cases) {
          if (matchUseCase != null) {
            const { title, matchTask } = matchUseCase(kase)
            test(title, matchTask)
          }
        }

        // Test sub groups
        for (const subGroup of caseGroup.subGroups) {
          matchUseCaseGroup(subGroup as G)
        }
      })
    }

    // Run test
    this.caseGroups.forEach(matchUseCaseGroup)
  }
}
