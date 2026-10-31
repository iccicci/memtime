// cSpell:ignore linebreak multilines nonwords
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sortKeys from "eslint-plugin-sort-keys";
import globals from "globals";
import tsEslint from "typescript-eslint";

const jsxWrapMultilines = Object.fromEntries(["arrow", "assignment", "condition", "declaration", "logical", "prop", "return"].map(_ => [_, "never"]));
const overrides = { catch: { after: false }, for: { after: false }, if: { after: false }, switch: { after: false }, while: { after: false } };
const unusedVarsOptions = { argsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true };

export default defineConfig(
  { ignores: ["dist"] },
  {
    extends:         [js.configs.recommended, ...tsEslint.configs.strictTypeChecked, ...tsEslint.configs.stylisticTypeChecked],
    files:           ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion:   2020,
      globals:       globals.browser,
      parserOptions: {
        project:         ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@stylistic":         stylistic,
      import:               importPlugin,
      react,
      "react-hooks":        reactHooks,
      "react-refresh":      reactRefresh,
      "simple-import-sort": simpleImportSort,
      "sort-keys":          sortKeys
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "@stylistic/keyword-spacing":                                ["error", { before: true, overrides }],
      "@typescript-eslint/consistent-indexed-object-style":        ["error", "index-signature"],
      "@typescript-eslint/consistent-type-definitions":            "off",
      "@typescript-eslint/no-confusing-void-expression":           "off",
      "@typescript-eslint/no-dynamic-delete":                      "off",
      "@typescript-eslint/no-empty-function":                      "off",
      "@typescript-eslint/no-empty-interface":                     "off",
      "@typescript-eslint/no-extraneous-class":                    "off",
      "@typescript-eslint/no-namespace":                           "off",
      "@typescript-eslint/no-non-null-assertion":                  "off",
      "@typescript-eslint/no-unused-vars":                         ["error", unusedVarsOptions],
      "@typescript-eslint/prefer-nullish-coalescing":              "off",
      "@typescript-eslint/restrict-template-expressions":          ["error", { allowNumber: true }],
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
      "arrow-body-style":                                          ["error", "as-needed"],
      "arrow-parens":                                              ["error", "as-needed"],
      "arrow-spacing":                                             "error",
      "brace-style":                                               ["error", "1tbs", { allowSingleLine: true }],
      curly:                                                       ["error", "multi-or-nest"],
      eqeqeq:                                                      ["error"],
      "func-style":                                                ["error", "expression", { allowArrowFunctions: true }],
      "import/first":                                              "error",
      "import/newline-after-import":                               "error",
      "import/no-duplicates":                                      "error",
      indent:                                                      ["error", 2],
      "key-spacing":                                               ["error", { align: { afterColon: true, beforeColon: false, on: "value" } }],
      "linebreak-style":                                           ["error", "unix"],
      "max-len":                                                   ["error", { code: 150, ignoreStrings: true }],
      "no-console":                                                "warn",
      "no-mixed-spaces-and-tabs":                                  ["error", "smart-tabs"],
      "prefer-const":                                              ["error", { destructuring: "all" }],
      "prefer-template":                                           "error",
      quotes:                                                      ["error", "double"],
      "react-hooks/exhaustive-deps":                               "off",
      "react-refresh/only-export-components":                      ["warn", { allowConstantExport: true }],
      "react/jsx-wrap-multilines":                                 ["error", jsxWrapMultilines],
      semi:                                                        ["error", "always"],
      "simple-import-sort/exports":                                "error",
      "simple-import-sort/imports":                                "error",
      "sort-keys":                                                 "off",
      "sort-keys/sort-keys-fix":                                   "error",
      "space-before-function-paren":                               ["error", { anonymous: "never", asyncArrow: "always", named: "never" }],
      "space-unary-ops":                                           ["error", { nonwords: false, overrides: { "!": true }, words: true }]
    },
    settings: { react: { version: "18.3" } }
  }
);
