import path from 'path'
import { fileURLToPath } from 'url'
import CopyPlugin from 'copy-webpack-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const createConfig = (env = {}) => {
  const isDocs = Boolean(env.docs)
  const isDev = Boolean(env.development)
  const isProduction = isDocs || Boolean(env.production)
  const isESM = Boolean(env.esm)
  const isMinified = Boolean(env.minify)

  if (isDev) {
    return {
      mode: 'development',
      context: path.resolve(__dirname),
      entry: './playground/index.ts',
      output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'playground/dist'),
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
            exclude: /node_modules/,
          },
        ],
      },
      devServer: {
        static: {
          directory: path.join(__dirname, 'playground'),
        },
        hot: true,
        open: true,
        port: 8080,
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        extensionAlias: {
          '.js': ['.js', '.ts'],
          '.jsx': ['.jsx', '.tsx'],
        },
      },
    }
  }

  if (isDocs) {
    return {
      mode: 'production',
      context: path.resolve(__dirname),
      entry: './playground/index.ts',
      output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'docs/playground'),
        clean: true,
      },
      devtool: false,
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
            exclude: /node_modules/,
          },
        ],
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            { from: 'playground/index.html', to: '.' },
            { from: 'playground/styles.css', to: '.' },
          ],
        }),
      ],
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        extensionAlias: {
          '.js': ['.js', '.ts'],
          '.jsx': ['.jsx', '.tsx'],
        },
      },
      performance: {
        hints: 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      },
      cache: {
        type: 'filesystem',
      },
    }
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isESM ? 'scroll-snap.esm.js' : isMinified ? 'scroll-snap.min.js' : 'scroll-snap.js',
      ...(isESM
        ? {
            library: {
              type: 'module',
            },
          }
        : {
            library: {
              name: 'scrollSnap',
              type: 'umd',
              export: 'default',
              umdNamedDefine: true,
            },
            globalObject: 'typeof self !== "undefined" ? self : this',
          }),
    },
    optimization: {
      minimize: isMinified,
    },
    experiments: {
      outputModule: isESM,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
  }
}

export default (env = {}) => createConfig(env)
