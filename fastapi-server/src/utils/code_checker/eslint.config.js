import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

/**
 * ESLint configuration for validating AI-generated React/JSX code
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
    {
        // Apply this configuration to all JavaScript and JSX files
        files: ["**/*.{js,jsx}"],

        // Define the plugins
        plugins: {
            react: pluginReact,
            "react-hooks": pluginReactHooks,
        },

        // Configure language options
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },

            // Define all standard browser global variables
            globals: {
                ...globals.browser,
                React: "readonly",
                JSX: "readonly",
            },
        },

        // Define the rules
        rules: {
            // =================
            // FATAL ERRORS (will cause component to crash/not render)
            // =================

            // Undefined variables cause ReferenceError at runtime
            "no-undef": "error",

            // These cause syntax/runtime errors that break components
            "no-dupe-keys": "error",
            "no-dupe-args": "error",
            "no-unreachable": "error",
            "no-func-assign": "error",
            "no-import-assign": "error",
            "no-obj-calls": "error",
            "no-sparse-arrays": "error",
            "no-unexpected-multiline": "error",
            "use-isnan": "error",
            "valid-typeof": "error",

            // React-specific fatal errors
            "react/jsx-key": "error",
            "react/jsx-no-duplicate-props": "error",
            "react/jsx-no-undef": "error",
            "react/no-children-prop": "error",
            "react/no-danger-with-children": "error",
            "react/no-direct-mutation-state": "error",
            "react/no-find-dom-node": "error",
            "react/no-is-mounted": "error",
            "react/no-render-return-value": "error",
            "react/no-string-refs": "error",
            "react/no-unescaped-entities": "warn",
            "react/require-render-return": "error",

            // React Hooks rules (breaking these causes crashes)
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",

            // =================
            // WARNINGS (style/preference issues, won't break component)
            // =================

            "no-unused-vars": "warn",
            "no-useless-escape": "warn",
            "semi": "warn",
            "quotes": ["warn", "single"],
            "no-console": "warn",
            "no-debugger": "warn",

            // React warnings
            "react/jsx-uses-vars": "warn",
            "react/prop-types": "warn",
            "react/no-unused-prop-types": "warn",
            "react/no-unused-state": "warn",
            "react/prefer-stateless-function": "warn",

            // Modern React - these rules should be off
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off",
        },

        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
