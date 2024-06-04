const fs = require('fs');
const path = require('path');

const sourceDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'dist',
  'keks-pay-app',
  'keks-pay-component.js'
);
const sampleServerDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'MonriJS',
  'sample-server',
  'public',
  'dist'
);
const bundlesDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'MonriJS',
  'components',
  'src',
  'alternative_payments',
  'bundles'
);
const webPayDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'WebPay',
  'public',
  'dist'
);

const emptyLine =
  '                                                            ';

console.log(emptyLine);
console.log(`Copying bundle..`);

function buildBundles(source, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFile = path.join(targetDir, path.basename(source));
  fs.copyFileSync(source, targetFile);

  // Styling the console log
  const borderColor = '\x1b[34m'; // Blue
  const textColor = '\x1b[32m'; // Green
  const reset = '\x1b[0m'; // Reset to default

  const message = `Copied to: ${targetDir}`;

  const border =
    '----------------------------------------------------------------------------------------------------';

  const formattedMessage = `${textColor}${message}${reset}`;

  // Adjust the length of the message to fit within the border
  const paddedMessage = formattedMessage.padEnd(border.length - 2, ' ');

  console.log(borderColor + border);
  console.log(emptyLine);
  console.log(paddedMessage);
  console.log(emptyLine);
  console.log(borderColor + border + reset);
}

buildBundles(sourceDir, sampleServerDir);
buildBundles(sourceDir, bundlesDir);
buildBundles(sourceDir, webPayDir);
