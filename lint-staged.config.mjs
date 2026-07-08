/**
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  "*.{ts,tsx,mjs}": () => "bun tsc",
  "*": () => "bun format",
  // "*.{md,mdx,tsx}": () => "bun vale",
  "*.{ts,tsx,mjs,mdx}": () => "bun knip",
};

export default lintStagedConfig;
