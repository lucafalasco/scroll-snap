const path = require('path')

module.exports = {
  context: path.resolve(__dirname),
  entry: './playground/index.ts',
  output: {
    filename: 'playground.js',
  },
  devtool: '#eval-source-map',
  devServer: {
    contentBase: './playground',
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
