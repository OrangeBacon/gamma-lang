var path = require('path');
module.exports = {
  entry: {
    lib: './src/lang/index.js',
    editor: './src/editor/index.js',
    index: './src/editor/index.html'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/build'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      { test: /\.html/, use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]'
          }
        },
        'extract-loader',
        {
          loader: 'html-loader?interpolate=require',
          options: {
            attr: ["link:href"],
            interpolate: "require",
          }
        }
      ]},
      { test: /\.css/, use: ['file-loader','extract-loader','css-loader']}
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, "src"),'node_modules']
  },
  devServer: {
    contentBase: path.resolve(__dirname,"build"),
    port: 8080,
    host: '0.0.0.0',
    //https: true,
  }
};