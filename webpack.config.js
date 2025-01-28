import path from 'path'
import { fileURLToPath } from 'url'
import CopyPlugin from 'copy-webpack-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const createConfig = (env) => ({
  mode: env === 'docs' ? 'production' : 'development',
  context: path.resolve(__dirname),
  entry: './playground/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, env === 'docs' ? 'docs/playground' : 'dist'),
    clean: true,
    environment: {
      arrowFunction: true,
      const: true,
      destructuring: true,
    },
  },
  devtool: env === 'docs' ? false : 'eval-source-map',
  devServer:
    env === 'docs'
      ? undefined
      : {
          static: {
            directory: path.join(__dirname, 'playground'),
            watch: true,
          },
          port: process.env.PORT || 9000,
          host: '0.0.0.0',
          open: true,
          client: {
            overlay: {
              errors: true,
              warnings: false,
            },
            logging: 'warn',
          },
          compress: true,
          hot: true,
          historyApiFallback: true,
        },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es2020',
                moduleResolution: 'bundler',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins:
    env === 'docs'
      ? [
          new CopyPlugin({
            patterns: [
              { from: 'playground/index.html', to: '.' },
              { from: 'playground/styles.css', to: '.' },
            ],
          }),
        ]
      : [],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.jsx': ['.jsx', '.tsx'],
    },
  },
  performance: {
    hints: env === 'docs' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  cache: {
    type: 'filesystem',
  },
})

export default (env) => createConfig(env.docs ? 'docs' : 'development')
