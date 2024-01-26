const VALID_ROLLUP_CONFIG_TYPES = ['lib']
const RAW_ROLLUP_CONFIG_TYPE = process.env.ROLLUP_CONFIG_TYPE ?? ''
const ROLLUP_CONFIG_TYPE = VALID_ROLLUP_CONFIG_TYPES.includes(RAW_ROLLUP_CONFIG_TYPE)
  ? RAW_ROLLUP_CONFIG_TYPE
  : 'lib'

export default async function () {
  const createRollupConfig = await import(`./rollup.config.${ROLLUP_CONFIG_TYPE}.mjs`).then(
    md => md.default,
  )
  return createRollupConfig()
}
