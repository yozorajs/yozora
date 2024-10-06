import { checkDepsInfo } from '@guanghechen/monorepo'
import path from 'node:path'
import url from 'node:url'

const WORKSPACE_ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')
const workspaceNames = ['packages', 'tokenizers', 'scaffolds']
const deps = await checkDepsInfo(WORKSPACE_ROOT, workspaceNames)
console.log(deps)
