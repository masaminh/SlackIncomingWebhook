module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    "plugin:@typescript-eslint/recommended", 
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint"
],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  "rules": {
      "import/extensions": "off"
  },
  "settings": {
    "import/resolver": {
      "node": {
          "extensions" : [".ts", ".js"]
      },
    }
  }
};
