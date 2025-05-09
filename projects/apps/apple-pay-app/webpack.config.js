const path = require('path');
module.exports = {
  entry: {
    'apple-pay-component.js': [
      path.resolve(
        __dirname,
        '../../../dist/apple-pay-app/browser/polyfills.js'
      ),
      path.resolve(__dirname, '../../../dist/apple-pay-app/browser/styles.css'),
      path.resolve(__dirname, '../../../dist/apple-pay-app/browser/main.js')
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, '../../../dist/apple-pay-app')
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
