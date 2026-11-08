// cSpell:ignore multilines nonwords

import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @type {import('eslint').Rule.RuleModule} */
const catchRule = {
  create: context => ({
    CatchClause: node => {
      const isValid = node.param?.type === "Identifier" && node.param.name === "error";

      if(! isValid) {
        context.report({
          fix:       fixer => (node.param ? null : fixer.insertTextAfter(context.sourceCode.getFirstToken(node), " (error)")),
          messageId: "missingParam",
          node
        });
      }
    }
  }),
  meta: {
    docs:     { description: "Require catch clauses to declare a parameter named 'error'.", recommended: false },
    fixable:  "code",
    messages: { missingParam: "Catch clause must declare a parameter named 'error'." },
    schema:   [],
    type:     "suggestion"
  }
};

/** @type {import('eslint').Rule.RuleModule} */
const quotes = {
  create: context => ({
    Literal: node => {
      const { raw, value } = node;

      if(typeof value !== "string") return;

      const current = raw[0];
      const hasDouble = value.includes("\"");
      const hasSingle = value.includes("'");
      const preferred = hasDouble && hasSingle ? "`" : hasDouble ? "'" : "\"";

      if(current === preferred) return;

      const preferredLabel = preferred === "`" ? "backticks" : preferred === "'" ? "single quotes" : "double quotes";
      const reason = preferred === "`" ? "both \" and '" : preferred === "'" ? "\"" : "default";

      context.report({
        data: { preferred: preferredLabel, reason },
        fix:  fixer => {
          let wrapped;
          if(preferred === "\"") wrapped = `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
          else if(preferred === "'") wrapped = `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
          else wrapped = `\`${value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\``;

          return fixer.replaceText(node, wrapped);
        },
        messageId: "wrongQuote",
        node
      });
    }
  }),
  meta: { fixable: "code", messages: { wrongQuote: "Prefer {{preferred}} delimiter ({{reason}})." }, schema: [], type: "suggestion" }
};

/* eslint-disable local/smartQuote */
/** @type {import('eslint').Rule.RuleModule} */
const smartQuote = {
  create: context => {
    const smartQuotes = /[‘’“”]/;

    /** @type {(node: import("eslint").Rule.Node, text: string) => void} */
    const check = (node, text) => {
      if(! smartQuotes.test(text)) return;

      context.report({
        fix: fixer =>
          fixer.replaceText(
            node,
            context.sourceCode.getText(node).replace(/[‘’“”]/g, c => {
              if(c === "‘" || c === "’") return "'";
              if(c === "“" || c === "”") return "\"";
              return c;
            })
          ),
        messageId: "smartQuotes",
        node
      });
    };

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      JSXText:         node => check(node, node.value),
      Literal:         node => typeof node.value === "string" && check(node, node.value),
      TemplateElement: node => check(node, node.value.raw)
    };
  },
  meta: {
    docs: {
      description: "Disallow smart quotes (‘ ’ “ ”) and replace them with ASCII quotes.",
      recommended: false
    },
    fixable:  "code",
    messages: {
      smartQuotes: "Use ASCII quotes (' or \") instead of smart quotes (‘ ’ “ ”)."
    },
    schema: [],
    type:   "problem"
  }
};
/* eslint-enable local/smartQuote */

const local = { rules: { catch: catchRule, quotes, smartQuote } };

const jsxWrapMultilines = Object.fromEntries(["arrow", "assignment", "condition", "declaration", "logical", "prop", "return"].map(_ => [_, "never"]));
const overrides = { catch: { after: false }, for: { after: false }, if: { after: false }, switch: { after: false }, while: { after: false } };
const unusedVarsOptions = { argsIgnorePattern: "^_", caughtErrors: "none", ignoreRestSiblings: true };

export default defineConfig([
  { ignores: ["packages/server/dist", "packages/web/dist"] },
  {
    extends:         [js.configs.recommended, ...tsEslint.configs.strictTypeChecked, ...tsEslint.configs.stylisticTypeChecked],
    files:           ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion:   2020,
      globals:       globals.browser,
      parserOptions: {
        project:         ["./packages/web/tsconfig.json", "./packages/server/tsconfig.json", "./packages/shared/tsconfig.json", "./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@stylistic":         stylistic,
      local,
      perfectionist,
      react,
      "react-hooks":        reactHooks,
      "react-refresh":      reactRefresh,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "@stylistic/keyword-spacing":                                ["error", { before: true, overrides }],
      "@stylistic/space-before-function-paren":                    ["error", { anonymous: "never", asyncArrow: "always", catch: "never", named: "never" }],
      "@typescript-eslint/consistent-indexed-object-style":        ["error", "index-signature"],
      "@typescript-eslint/consistent-type-definitions":            "off",
      "@typescript-eslint/consistent-type-imports":                "error",
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
      indent:                                                      ["error", 2],
      "key-spacing":                                               ["error", { align: { afterColon: true, beforeColon: false, on: "value" } }],
      "linebreak-style":                                           ["error", "unix"],
      "local/catch":                                               "error",
      "local/smartQuote":                                          "error",
      "max-len":                                                   ["error", { code: 150, ignoreStrings: true }],
      "no-console":                                                "warn",
      "no-duplicate-imports":                                      ["error", { allowSeparateTypeImports: true }],
      "no-mixed-spaces-and-tabs":                                  ["error", "smart-tabs"],
      "perfectionist/sort-objects":                                ["error", { order: "asc", type: "alphabetical" }],
      "prefer-const":                                              ["error", { destructuring: "all" }],
      "prefer-template":                                           "error",
      quotes:                                                      ["error", "double"],
      "react-refresh/only-export-components":                      ["warn", { allowConstantExport: true }],
      "react/jsx-wrap-multilines":                                 ["error", jsxWrapMultilines],
      "react/no-unescaped-entities":                               ["error", { forbid: ["<", "{"] }],
      semi:                                                        ["error", "always"],
      "simple-import-sort/exports":                                "error",
      "simple-import-sort/imports":                                "error",
      "space-unary-ops":                                           ["error", { nonwords: false, overrides: { "!": true }, words: true }]
    },
    settings: { react: { version: "19" } }
  }
]);
