<script lang="ts">
	import { onMount } from 'svelte';
	import { pageTitle } from '#lib';

	// The typing benchmark's test page (story 0.9): a plain TipTap editor holding a long sample
	// script. perf/typing.perf.ts types into it and measures each keystroke. The editor is loaded
	// only here, so no other page carries its code. Epic 2's real editor replaces it.
	let mount: HTMLDivElement;
	let status = $state('Loading the sample script…');

	onMount(() => {
		let destroy = () => {};
		import('./bench.ts').then(async ({ startBenchmark }) => {
			const pages = Number(new URLSearchParams(location.search).get('pages') ?? 150);
			const result = await startBenchmark(mount, pages);
			destroy = result.destroy;
			status = `${result.elements} elements, about ${result.pages} pages, loaded in ${Math.round(result.loadMs)} ms.`;
		});
		return () => destroy();
	});
</script>

<svelte:head>
	<title>{pageTitle('Typing benchmark')}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<h1>Typing benchmark</h1>
	<p>A test page for the automated typing-speed check. It isn't part of the app.</p>
	<p role="status" data-testid="bench-status">{status}</p>
	<div class="page" bind:this={mount}></div>
</main>

<style>
	main {
		padding: 1rem;
		font-family: system-ui, sans-serif;
	}
	/* A US Letter page: 1.5-inch left margin, 1-inch right, in 12-point Courier at 10 characters
	   to the inch, so 1ch is a tenth of an inch. */
	.page {
		box-sizing: border-box;
		width: 85ch;
		max-width: 100%;
		padding: 1rem 10ch 1rem 15ch;
		background: #fff;
		color: #111;
		border: 1px solid #ccc;
		font:
			12pt/1.2 'Courier Prime',
			'Courier New',
			monospace;
	}
	.page :global(.ProseMirror) {
		outline: none;
		white-space: pre-wrap;
	}
	.page :global(.el) {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.page :global(.el-scene),
	.page :global(.el-character),
	.page :global(.el-transition) {
		text-transform: uppercase;
	}
	.page :global(.el-scene),
	.page :global(.el-action),
	.page :global(.el-character),
	.page :global(.el-transition) {
		margin-top: 1.2em;
	}
	.page :global(.el-scene),
	.page :global(.el-action) {
		width: 60ch;
	}
	.page :global(.el-character) {
		margin-left: 22ch;
		width: 38ch;
	}
	.page :global(.el-parenthetical) {
		margin-left: 16ch;
		width: 25ch;
	}
	.page :global(.el-dialogue) {
		margin-left: 10ch;
		width: 35ch;
	}
	.page :global(.el-transition) {
		margin-left: 45ch;
		width: 15ch;
	}
</style>
