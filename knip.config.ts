import type { KnipConfig } from "knip";

const knipConfig: KnipConfig = {
  entry: ["bin/*", "src/app/**/*.mdx"],
  ignoreDependencies: [
    // This is only explicitly included in order to pin a version for a
    // transitive dependency
    "jsdom",
  ],
  ignoreBinaries: [
    // This is installed outside of npm
    "vale",
  ],
};

export default knipConfig;
