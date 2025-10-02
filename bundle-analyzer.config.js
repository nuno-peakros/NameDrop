/**
 * Bundle Analyzer Configuration
 * 
 * This configuration sets up webpack-bundle-analyzer for:
 * - Analyzing bundle size and composition
 * - Identifying optimization opportunities
 * - Monitoring bundle changes over time
 * - Generating detailed reports
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
  analyzerMode: 'server',
  analyzerPort: 8888,
  analyzerHost: 'localhost',
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
  statsOptions: {
    source: false,
    modules: false,
    chunks: false,
    chunkModules: false,
    chunkOrigins: false,
    providedExports: false,
    usedExports: false,
    optimizationBailout: false,
    reasons: false,
    depth: false,
    maxModules: 0,
    cached: false,
    cachedAssets: false,
    children: false,
    context: false,
    performance: true,
    timings: true,
    builtAt: true,
    version: true,
    hash: true,
    publicPath: true,
    assets: true,
    entrypoints: true,
    chunksSort: 'size',
    modulesSort: 'size',
    assetsSort: 'size',
    excludeAssets: /\.map$/,
    excludeModules: /node_modules/,
  },
})

module.exports = withBundleAnalyzer
