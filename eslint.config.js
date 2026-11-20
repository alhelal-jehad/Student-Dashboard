import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

// The layer rules from the architecture doc, enforced mechanically.
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'scripts', '*.config.*'] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { boundaries },
    settings: {
      'boundaries/ignore': ['**/*.test.ts'],
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/elements': [
        {
          partialMatch: false,
          type: 'model',
          pattern: 'src/features/*/model.ts',
          capture: ['feature'],
        },
        {
          partialMatch: false,
          type: 'view',
          pattern: 'src/features/*/view.ts',
          capture: ['feature'],
        },
        {
          partialMatch: false,
          type: 'controller',
          pattern: 'src/features/*/controller.ts',
          capture: ['feature'],
        },
        {
          partialMatch: false,
          type: 'feature-misc',
          pattern: 'src/features/*/!(model|view|controller).*',
          capture: ['feature'],
        },
        { type: 'core', pattern: 'src/core/**' },
        { type: 'app', pattern: 'src/app/**' },
        { type: 'ui', pattern: 'src/shared/ui/**' },
        { type: 'api', pattern: 'src/shared/api/**' },
        { type: 'shared', pattern: 'src/shared/{i18n,config,utils,events}/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'model' } },
              allow: { to: { element: { types: ['api', 'shared', 'core'] } } },
            },
            {
              from: { element: { type: 'view' } },
              allow: { to: { element: { types: ['ui', 'shared', 'core'] } } },
            },
            {
              from: { element: { type: 'controller' } },
              allow: { to: { element: { types: ['shared', 'core'] } } },
            },
            // A feature's own model/view/controller may see its siblings (same captured feature name). Never another feature.
            {
              from: { element: { types: ['model', 'view', 'controller', 'feature-misc'] } },
              allow: {
                to: {
                  element: {
                    types: ['model', 'view', 'controller', 'feature-misc'],
                    captured: { feature: '{{ from.element.captured.feature }}' },
                  },
                },
              },
            },
            // View may import only its own model's types; Model must not import view/controller; Controller may not import ui.
            {
              from: { element: { type: 'model' } },
              disallow: { to: { element: { types: ['view', 'controller'] } } },
            },
            {
              from: { element: { type: 'view' } },
              disallow: { to: { element: { type: 'controller' } } },
            },
            {
              from: { element: { type: 'feature-misc' } },
              allow: { to: { element: { types: ['shared', 'core'] } } },
            },
            {
              from: { element: { type: 'core' } },
              allow: { to: { element: { types: ['shared', 'core'] } } },
            },
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { types: ['ui', 'shared'] } } },
            },
            {
              from: { element: { type: 'api' } },
              allow: { to: { element: { types: ['shared', 'api'] } } },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            // The app layer reaches features only via dynamic import() of controllers.
            {
              from: { element: { type: 'app' } },
              allow: {
                to: { element: { types: ['core', 'shared', 'app', 'ui', 'api', 'controller'] } },
              },
            },
          ],
        },
      ],
      // Safe rendering: never assign markup strings.
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Use textContent or shared/ui/dom helpers.' },
        { property: 'outerHTML', message: 'Use DOM APIs.' },
        { property: 'insertAdjacentHTML', message: 'Use DOM APIs.' },
      ],
    },
  },
  {
    // Models and Controllers never touch the DOM, Tailwind or the animation library.
    files: ['src/features/*/{controller,model}.ts', 'src/core/model.ts', 'src/core/controller.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage', 'sessionStorage'],
      'no-restricted-imports': ['error', { patterns: ['motion', 'motion/*', 'tailwindcss*'] }],
    },
  },
  {
    // vi.fn() mocks are intentionally passed around unbound.
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/unbound-method': 'off' },
  },
);
