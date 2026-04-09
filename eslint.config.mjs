import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "public/images/**", "dist/**", "coverage/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        Razorpay: "readonly",
        Cropper: "readonly",
        confirmAction: "readonly",
        showConfirm: "readonly",
        showAlertModal: "readonly",
        showToast: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "prefer-const": "warn"
    }
  },
  {
    files: ["public/js/**/*.js"],
    rules: {
      "no-unused-vars": "off"
    }
  }
];
