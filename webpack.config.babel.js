import path from 'path'
import webpack from 'webpack'

const PROD = process.env.NODE_ENV === 'production'

module.exports = {
  context: path.resolve(__dirname),
  entry: PROD ? './src/index.js' : './demo/index.js',
  output: {
    path: path.resolve('./dist'),
    filename: 'scroll-snap.js',
    library: 'scroll-snap',
    libraryTarget: 'umd'
  },
  devtool: PROD ? false : '#eval-source-map',
  devServer: {
    contentBase: './demo',
    port: process.env.PORT || 9000,
    host: 'localhost',
    open: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ].concat(
    PROD
      ? [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
            unused: true
          },
          output: {
            comments: false
          }
        })
      ]
      : []
  ),
  module: {
    loaders: [
      {
        test: [/\.js$/, /\.es6$/],
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.es6']
  }
}
