/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte'],
	overrides: [
		{ files: '*.svelte', options: { parser: 'svelte' } },
		// Match .editorconfig: spaces for YAML and JSON.
		{ files: ['*.yml', '*.yaml', '*.json'], options: { useTabs: false, tabWidth: 2 } }
	]
};

export default config;
