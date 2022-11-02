import path from 'path';
import { Configuration, DefinePlugin, WebpackPluginInstance } from 'webpack';
import 'webpack-dev-server';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { merge } from 'webpack-merge';
const DISTNAME = 'dist'
// wraps env vars injected by webpack cli
interface Env {
  development: boolean;
  hotReload: boolean;
}

function baseConfiguration(env: Env): Configuration {
  return {
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
    mode: env.development ? 'development' : 'production',

    devtool: env.development ? 'source-map' : undefined,

    plugins: [
      new DefinePlugin({
        ENVIRONMENT: JSON.stringify(
          env.development ? 'development' : 'production'
        ),
      }),
    ],
  };
} // end base configuration

function mainConfiguration(env: Env): Configuration {
  return {
    name: 'main',

    context: path.join(__dirname, 'src/main'),
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    target: 'electron-main',

    mode: env.development ? 'development' : 'production',

    externalsPresets: {
      electronMain: true,
    },

    entry: {
      'main-process': './main-process.ts',
    },

    output: {
      filename: '[name].js',
      path: path.join(__dirname, DISTNAME),
      clean: {
        keep: /renderer\//,
      },
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript'],
              plugins: ['@babel/plugin-transform-runtime'],
            },
          },
        },
        {
          test: /\.node$/,
          loader: 'node-loader',
        },
      ],
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: ['../../package.json'], // electron packager need this file to pack the application. not needed during development.
      }),
      new CopyWebpackPlugin({ patterns: [{ from: '../exe', to: 'exe' }] }),
    ],
  };
} // end main configuration

function rendererConfiguration(env: Env): Configuration {
  const babelConfig = {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      '@babel/plugin-transform-runtime',
      env.hotReload && require.resolve('react-refresh/babel'),
    ].filter(Boolean),
  };

  return {
    name: 'renderer',
    context: path.join(__dirname, 'src/renderer'),

    target: 'web',

    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },

    externalsPresets: {
      web: true,
    },

    entry: {
      index: './renderer-main.tsx',
    },

    output: {
      filename: 'scripts/[name].js',
      path: path.join(__dirname, DISTNAME, 'renderer'),
      clean: true,
      globalObject: env.hotReload ? 'self' : undefined, // Hot Module Replacement needs this to work. See: // https://stackoverflow.com/questions/51000346/uncaught-typeerror-cannot-read-property-webpackhotupdate-of-undefined
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babelConfig,
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[hash][ext][query]',
          },
        },
        {
          test: /\.(ttf|otf|woff2?)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[hash][ext][query]',
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        chunks: ['index'],
        template: 'index.html',
      }),
      (env.hotReload &&
        new ReactRefreshWebpackPlugin()) as WebpackPluginInstance,
    ].filter(Boolean),

    devServer: {
      compress: true,
      hot: env.hotReload,
      port: 9000,
      historyApiFallback: {
        disableDotRule: true,
        rewrites: [
        ],
      },
      devMiddleware: {
        writeToDisk: true,
      },
    },
  };
} // end renderer configuration

export default function (e: any) {
  const env: Env = {
    development: !e['production'],
    hotReload: !!e['hot-reload'] && !e['production'], };

  const baseConfig = baseConfiguration(env);
  const mainConfig = merge(baseConfig, mainConfiguration(env));
  const rendererConfig = merge(baseConfig, rendererConfiguration(env));
  return [mainConfig, rendererConfig];
}
