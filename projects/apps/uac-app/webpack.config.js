const path = require('path');
module.exports = {
  entry: {
    'uac-component.js': [
      path.resolve(
        __dirname,
        '../../../dist/uac-app/browser/polyfills.js'
      ),
      path.resolve(__dirname, '../../../dist/uac-app/browser/styles.css'),
      path.resolve(__dirname, '../../../dist/uac-app/browser/main.js')
    ]
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, '../../../dist/uac-app')
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
