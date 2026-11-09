// Helpers for `npm run db:paste-url`, which saves a connection string from the clipboard into
// `.env` without it ever being shown. Pure functions, so they're unit-tested.

/**
 * The connection string inside whatever Neon's "Copy snippet" put on the clipboard: a bare
 * string, `DATABASE_URL=...`, or a `psql '...'` command. Undefined if there isn't one.
 */
export function extractDatabaseUrl(snippet: string): string | undefined {
	return snippet.match(/postgres(?:ql)?:\/\/[^\s'"`]+/)?.[0];
}

/**
 * `.env` text with each given setting set, keeping every other line as it was. A setting that's
 * already there is replaced in place, and any later copy of it is dropped, because the last copy
 * is the one that counts. A new setting is added at the end.
 *
 * Refuses a value that `.env` would misread: Vite expands `$name` in it, and `#`, quotes,
 * spaces or a line break would cut it short. Neon's connection strings contain none of them.
 * The message names the setting, never the value.
 */
export function setEnvValues(text: string, values: Record<string, string>): string {
	for (const [name, value] of Object.entries(values)) {
		if (/[$#'"`\s]/.test(value))
			throw new Error(
				`${name} contains a character .env files can't hold safely ($, #, a quote, a space or a line break).`
			);
	}
	const lines = text === '' ? [] : text.replace(/\r?\n$/, '').split(/\r?\n/);
	const written = new Set<string>();
	const updated = lines.flatMap((line) => {
		const name = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1];
		if (name === undefined || !Object.hasOwn(values, name)) return [line];
		if (written.has(name)) return [];
		written.add(name);
		return [`${name}=${values[name]}`];
	});
	for (const [name, value] of Object.entries(values))
		if (!written.has(name)) updated.push(`${name}=${value}`);
	return updated.join('\n') + '\n';
}
