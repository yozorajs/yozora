/* eslint-disable @typescript-eslint/no-var-requires */
import rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import { eslint } from 'rollup-plugin-eslint'
import {
  NodeResolveOptions,
  TypescriptOptions,
  CommonJSOptions,
  PeerDepsExternalOptions,
  EslintOptions,
} from './types/options'


export interface ProdConfigParams {
  manifest: {
    /**
     * 源文件入口
     * source entry file
     */
    source: string
    /**
     * cjs 目标文件入口
     * target entry file of cjs
     */
    main?: string
    /**
     * es 目标文件入口
     * target entry file of es
     */
    module?: string
  }
  /**
   * 插件选项
   */
  pluginOptions?: {
    /**
     * options for rollup-plugin-eslint
     */
    eslintOptions?: EslintOptions,
    /**
     * options for @rollup/plugin-node-resolve
     */
    nodeResolveOptions?: NodeResolveOptions
    /**
     * options for rollup-plugin-typescript2
     */
    typescriptOptions?: TypescriptOptions
    /**
     * options for @rollup/plugin-commonjs
     */
    commonjsOptions?: CommonJSOptions
    /**
     * options for rollup-plugin-peer-deps-external
     */
    peerDepsExternalOptions?: PeerDepsExternalOptions
  }
}


export const createRollupConfig = (props: ProdConfigParams): rollup.RollupOptions[] => {
  // process task
  const { manifest, pluginOptions = {} } = props
  const {
    eslintOptions = {},
    nodeResolveOptions = {},
    typescriptOptions = {},
    commonjsOptions = {},
    peerDepsExternalOptions = {},
  } = pluginOptions
  const config: rollup.RollupOptions = {
    input: manifest.source,
    output: [
      manifest.main && {
        file: manifest.main,
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
      manifest.module && {
        file: manifest.module,
        format: 'es',
        exports: 'named',
        sourcemap: true,
      }
    ].filter(Boolean) as rollup.OutputOptions[],
    plugins: [
      peerDepsExternal(peerDepsExternalOptions),
      nodeResolve({
        browser: true,
        ...nodeResolveOptions,
      }),
      eslint({
        fix: true,
        throwOnError: true,
        exclude: ['*.css', '*.styl', '*.styl.d.ts'],
        ...eslintOptions,
      }),
      typescript({
        clean: true,
        typescript: require('typescript'),
        rollupCommonJSResolveHack: true,
        ...typescriptOptions,
      }),
      commonjs({
        ...commonjsOptions,
      }),
    ] as rollup.Plugin[],
  }

  return [
    config,
  ].filter(Boolean) as rollup.RollupOptions[]
}
