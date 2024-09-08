// @ts-check

import eslintConfigPrettier from "eslint-config-prettier";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	eslintConfigPrettier,
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
		},
	},
);
