import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute path to the repository root. */
export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
