import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: {
        default: 'nx run monri-payment-components:serve:development',
        production: 'nx run monri-payment-components:serve:production',
      },
      ciWebServerCommand: 'nx run monri-payment-components:serve-static',
    }),
    baseUrl: 'http://localhost:4200',
  },
});
