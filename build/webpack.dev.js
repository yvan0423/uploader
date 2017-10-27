'use strict';
// For instructions about this file refer to
// webpack and webpack-hot-middleware documentation
const webpack = require('webpack');
const path = require('path');
const ExtractText = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');
const dashboard = new Dashboard();
const CommonChunks = new webpack.optimize.CommonsChunkPlugin({
    names: ['index', 'react'],
    filename: 'js/[name].js',
    minChunks: Infinity,
});
const ExtractLess = new ExtractText('css/[name].css');
const Ocurrence = new webpack.optimize.OccurrenceOrderPlugin();
const HotModule = new webpack.HotModuleReplacementPlugin();
const HtmlPlugin = new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './src/templates/index.html',
    hash: false
});

const DefinePlugin = new webpack.DefinePlugin({
    "process.env": {
        NODE_ENV: JSON.stringify('dev')
    }
});


const LoaderPlugins = new webpack.LoaderOptionsPlugin({
  debug: true,
  options: {
    postcss: require('./postcss.config')
  }
})

module.exports = {
    watch: true,
    devtool: 'cheap-source-map',
    entry: {
        'index': ['./build/client.js','./src/views/index.js'],
        'react': ['react', 'react-dom', 'react-router'],
    },
    output: {
        path: path.resolve(__dirname, 'assets'),
        publicPath: '/',
        filename: 'js/[name].js',
        chunkFilename: 'js/[name].js'
    },
    plugins: [
        HotModule,
        HtmlPlugin,
        Ocurrence,
        DefinePlugin,
        ExtractLess,
        LoaderPlugins,
        CommonChunks,
        new DashboardPlugin(dashboard.setData)
    ],
    module: {
      noParse: [/jszip.js$/],
      rules: [
        {
          test: /\.less$/,
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
          exclude: /node_modules/,
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