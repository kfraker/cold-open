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
	dev?: boolean;
	location: string;
}

/** Whether an SPDX expression like "(MIT OR Apache-2.0)" is allowed. AND needs every part. */
function allowed(expression: string, dev: boolean): boolean {
	const ok = (id: string) => PERMISSIVE.has(id) || (dev && DEV_ONLY.has(id));
	const clean = expression.replace(/[()]/g, '').trim();
	return clean
		.split(/\s+OR\s+/)
		.some((option) => option.split(/\s+AND\s+/).every((id) => ok(id.trim())));
}

const packages = JSON.parse(
	execSync('npm query "*"', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
) as Package[];
const problems = packages
	// Skip this project itself, and folders SvelteKit generates (node_modules/$app) that aren't packages.
	.filter((p) => p.location !== '' && p.name)
	.flatMap((p) => {
		const license = typeof p.license === 'object' ? p.license.type : p.license;
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
