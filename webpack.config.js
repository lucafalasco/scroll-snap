const path = require('path')

module.exports = {
  context: path.resolve(__dirname),
  entry: './playground/index.ts',
  output: {
    filename: 'playground.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'eval-source-map',
  devServer: {
    static: './playground',
    port: process.env.PORT || 9000,
    host: '0.0.0.0',
    open: true,
    client: { overlay: false },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
}
