import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run keks-pay-app:serve:development',
        production: 'nx run keks-pay-app:serve:production',
      },
      ciWebServerCommand: 'nx run keks-pay-app:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
