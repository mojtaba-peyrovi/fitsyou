require('dotenv').config();
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const { version } = require('./package.json');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    popup: './extension/src/popup/index.tsx',
    content: './extension/src/content/index.ts',
    badge: './extension/src/content/badge.ts',
    background: './extension/src/background/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat',
    },
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'extension/public',
          to: '.',
          transform(content, absoluteFrom) {
            if (path.basename(absoluteFrom) === 'manifest.json') {
              const manifest = JSON.parse(content.toString());
              manifest.version = version;
              return JSON.stringify(manifest, null, 2);
            }
            return content;
          },
        },
      ],
    }),
    new webpack.DefinePlugin({
      'process.env.POSTHOG_KEY': JSON.stringify(process.env.POSTHOG_KEY ?? ''),
    }),
  ],
};
