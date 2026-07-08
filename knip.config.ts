import type { KnipConfig } from "knip";

const knipConfig: KnipConfig = {
  entry: ["bin/*", "src/app/**/*.mdx"],
  ignoreDependencies: [
    // This is only explicitly included in order to pin a version for a
    // transitive dependency
    "jsdom",

    // Next.js doesn't support typescript 7 (the native compiler) directly
    // yet, but when this package is present, it skips its build-time type
    // checking (which requires typescript 6's JS API) instead of failing the
    // build. Type checking is enforced separately via `tsc` in CI.
    "@typescript/native-preview",
  ],
  ignoreBinaries: [
    // This is installed outside of npm
    "vale",
  ],
};

export default knipConfig;
