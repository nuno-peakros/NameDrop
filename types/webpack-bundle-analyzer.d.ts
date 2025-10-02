declare module 'webpack-bundle-analyzer' {
  export class BundleAnalyzerPlugin {
    constructor(options?: {
      analyzerMode?: 'server' | 'static' | 'disabled';
      openAnalyzer?: boolean;
      [key: string]: unknown;
    });
  }
}
