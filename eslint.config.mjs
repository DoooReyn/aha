import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // 忽略文件配置（替代 .eslintignore）
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'native/**',
      'temp/**',
      'library/**',
      'local/**',
      'profiles/**',
      'dist/**',
      '**/*.min.js',
      '**/*.js',
    ],
  },

  // JavaScript 基础配置
  js.configs.recommended,

  // TypeScript 配置
  ...tseslint.configs.recommended,

  // 自定义规则
  {
    rules: {
      // 基础规则
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',

      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // 语言选项
  {
    languageOptions: {
      globals: {
        // 浏览器全局变量
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
];
