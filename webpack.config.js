const path = require('path')

module.exports = {
  context: path.resolve(__dirname),
  entry: './demo/src/index.ts',
  output: {
    path: path.resolve(`${__dirname}/demo/dist`),
    filename: 'scroll-snap.js',
    library: 'scroll-snap',
    libraryTarget: 'umd',
  },
  devtool: '#eval-source-map',
  devServer: {
    contentBase: './demo/src',
    port: process.env.PORT || 9000,
    host: '0.0.0.0',
    open: true,
    stats: 'minimal',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: require.resolve('ts-loader'),
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
