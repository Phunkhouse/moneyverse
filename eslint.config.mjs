import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    // src/server is framework-free: business rules, database and auth. The operator scripts
    // import it under plain Node, and the app reaches it only through src/app/_lib.
    files: ['src/server/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'next',
                'next/*',
                'react',
                'react/*',
                'react-dom',
                'server-only',
              ],
              message: 'src/server must not depend on Next.js or React.',
            },
            {
              group: ['@/*', '../app/*', '../../app/*'],
              message:
                'src/server uses relative imports and never imports the app.',
            },
          ],
        },
      ],
    },
  },
])
