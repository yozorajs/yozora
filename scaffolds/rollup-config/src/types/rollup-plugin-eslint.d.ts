declare module 'rollup-plugin-eslint' {
  import { Plugin } from 'rollup'
  import { CLIEngine } from 'eslint'

  /**
   * options for rollup-plugin-eslint
   *
   * You can also use eslint configuration in the form of a '.eslintrc.*'
   * file in your project's root. It will be loaded automatically.
   * @see https://github.com/TrySound/rollup-plugin-eslint#options
   */
  export interface EslintOptions extends CLIEngine.Options {
    /**
     * If true, will auto fix source code.
     * @default true
     */
    fix?: boolean
    /**
     * If true, will throw an error if any errors were found.
     * @default true
     */
    throwOnError?: boolean
    /**
     * If true, will throw an error if any warnings were found.
     * @default false
     */
    throwOnWarning?: boolean
    /**
     * A single file, or array of files, to include when linting.
     * @default []
     */
    include?: string | string[]
    /**
     * A single file, or array of files, to exclude when linting.
     * @default []
     */
    exclude?: string | string[]
    /**
     * Custom error formatter or the name of a built-in formatter.
     * @default 'stylish'
     */
    formatter?: string | Function
  }

  export function eslint(options?: EslintOptions): Plugin
  export default eslint
}
