const path = require('path');
module.exports = {
  entry: {
    'mastercard-c2p-component.js': [
      path.resolve(
        __dirname,
        '../../../dist/mastercard-c2p-app/browser/polyfills.js'
      ),
      path.resolve(__dirname, '../../../dist/mastercard-c2p-app/browser/styles.css'),
      path.resolve(__dirname, '../../../dist/mastercard-c2p-app/browser/main.js')
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, '../../../dist/mastercard-c2p-app')
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
