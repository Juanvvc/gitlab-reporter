// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  // options...
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',

  // Other options include:
  outputDir: undefined,
  assetsDir: undefined,
  runtimeCompiler: undefined,
  productionSourceMap: undefined,
  parallel: undefined,
  css: undefined,

  configureWebpack: {
//    plugins: [new BundleAnalyzerPlugin()],
    resolve: {
      alias: {
        // do not include locales in moment to save space
        moment: 'moment/src/moment'
      }
    }
  }
}
