'use strict';
// For instructions about this file refer to
// webpack and webpack-hot-middleware documentation
const webpack = require('webpack');
const path = require('path');
const ExtractText = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CommonChunks = new webpack.optimize.CommonsChunkPlugin({
    names: ['index', 'react'],
    filename: 'js/[name].js',
    minChunks: Infinity
});
const ExtractLess = new ExtractText('css/[name].css');
const Ocurrence = new webpack.optimize.OccurrenceOrderPlugin();
const HtmlPlugin = new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './src/templates/index.html',
    hash: true,
    favicon: './src/images/favicon.ico'
});

const Uglify = new webpack.optimize.UglifyJsPlugin();

const DefinePlugin = new webpack.DefinePlugin({
    "process.env": {
        NODE_ENV: JSON.stringify('production')
    }
});
const HashModuleIds = require('webpack/lib/HashedModuleIdsPlugin')

const LoaderPlugins = new webpack.LoaderOptionsPlugin({
  debug: true,
  options: {
    postcss: require('./postcss.config')
  }
})

module.exports = {
    entry: {
        'index': './src/views/index.js',
        'react': ['react', 'react-dom', 'react-router']
    },
    plugins: [
        Uglify,
        HtmlPlugin,
        Ocurrence,
        DefinePlugin,
        ExtractLess,
        LoaderPlugins,
        CommonChunks,
        new HashModuleIds()
    ],
    module: {
      rules: [
        {
          test: /\.less$/,
          include: [
            path.resolve(__dirname, "../src/components"),
            path.resolve(__dirname, "../src/style"),
            path.resolve(__dirname, "../src/customs"),
            path.resolve(__dirname, "../src/views"),
          ],
          use: ExtractText.extract({
          fallback: 'style-loader',
            use: [
                'css-loader?importLoaders=1', 
                'postcss-loader',
                'less-loader'
            ]
          })
        },
        {
          test: /\.js|jsx$/,
          use: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.(png|jpg|gif|ico)$/,
          use: 'file-loader?limit=10240&name=images/[name].[ext]',
          include: [path.resolve(__dirname, '../src/images')]
        },
        {
          test: /\.(woff|woff2|eot|ttf|svg|swf)/,
          use: 'file-loader?limit=10240&name=fonts/[name].[ext]'
        }
      ]
    },
    resolve: require('./resolve.config'),
    externals: [
      {
        './cptable': 'var cptable'
      }
    ],
    node: {
      fs: false,
      Buffer: false
    }
};