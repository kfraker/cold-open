// Fails if any installed package has a license that isn't compatible with this MIT project.
//
//   node scripts/check-licenses.ts
//
// Permissive licenses are allowed everywhere. MPL-2.0 (file-level copyleft) is allowed only in
// development tools, which are never shipped. Anything else, or a missing license, fails.
import { execSync } from 'node:child_process';

const PERMISSIVE = new Set([
	'MIT',
	'ISC',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'Apache-2.0',
	'BlueOak-1.0.0',
	'0BSD',
	'CC0-1.0',
	'CC-BY-4.0',
	'Unlicense',
	'Python-2.0'
]);
const DEV_ONLY = new Set(['MPL-2.0']);

interface Package {
	name?: string;
	version: string;
	license?: string | { type: string };
	licenses?: ({ type: string } | string)[];
	dev?: boolean;
	location: string;
}

/**
 * Whether an SPDX license expression is allowed, for example "(MIT OR Apache-2.0) AND BSD-3-Clause".
 * OR needs one allowed side, AND needs both, and AND binds tighter than OR. A "WITH" exception
 * only adds permissions, so it's judged by its base license. Anything unparseable fails.
 */
function allowed(expression: string, dev: boolean): boolean {
	const tokens = expression.match(/\(|\)|[^\s()]+/g) ?? [];
	let i = 0;
	const fail = () => {
		throw new Error(`Can't read license expression "${expression}"`);
	};
	const license = (): boolean => {
		const token = tokens[i++];
		if (token === '(') {
			const result = or();
			if (tokens[i++] !== ')') fail();
			return result;
		}
		if (!token || token === ')' || /^(AND|OR|WITH)$/.test(token)) fail();
		if (tokens[i] === 'WITH') i += 2;
		return PERMISSIVE.has(token!) || (dev && DEV_ONLY.has(token!));
	};
	const and = (): boolean => {
		let result = license();
		while (tokens[i] === 'AND') {
			i++;
			result = license() && result;
		}
		return result;
	};
	const or = (): boolean => {
		let result = and();
		while (tokens[i] === 'OR') {
			i++;
			result = and() || result;
		}
		return result;
	};
	try {
		const result = or();
		return i === tokens.length && result;
	} catch {
		return false;
	}
}

/** The license expression a package declares, including the old `licenses` array form. */
function licenseOf(p: Package): string | undefined {
	if (typeof p.license === 'string') return p.license;
	if (p.license) return p.license.type;
	const list = p.licenses?.map((l) => (typeof l === 'string' ? l : l.type));
	return list?.length ? `(${list.join(' OR ')})` : undefined;
}

const packages = JSON.parse(
	execSync('npm query "*"', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
) as Package[];
const problems = packages
	// Skip this project itself, and folders SvelteKit generates (node_modules/$app) that aren't packages.
	.filter((p) => p.location !== '' && p.name)
	.flatMap((p) => {
		const license = licenseOf(p);
		if (!license) return [`${p.name}@${p.version}: no license`];
		return allowed(license, p.dev === true) ? [] : [`${p.name}@${p.version}: ${license}`];
	});

if (problems.length) {
	console.error(
		`Packages with licenses not allowed in this MIT project:\n- ${problems.join('\n- ')}`
	);
	process.exit(1);
}
console.log(
	`License check passed: ${packages.filter((p) => p.name).length - 1} packages, all compatible with MIT.`
);
