const path = require('path');
module.exports = {
  entry: {
    'google-pay-bundle.js': [
      path.resolve(
        __dirname,
        '../../../dist/google-pay-app/browser/polyfills.js'
      ),
      path.resolve(__dirname, '../../../dist/google-pay-app/browser/styles.css'),
      path.resolve(__dirname, '../../../dist/google-pay-app/browser/main.js')
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, '../../../dist/google-pay-app')
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
