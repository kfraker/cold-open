<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.sandbox}
	<!-- Shown everywhere except the live site, so it's always clear no real scripts are here.
	     Placeholder styling; story 1.1 restyles it with the design tokens from 0.10. -->
	<p class="sandbox-badge" data-testid="sandbox-badge">
		<strong>SANDBOX</strong> <span>Test data only, not real scripts</span>
	</p>
{/if}

{@render children()}

<style>
	.sandbox-badge {
		margin: 0;
		padding: 0.25rem 1rem;
		background: #ffd23f;
		color: #1a1a1a;
		font:
			0.875rem/1.4 system-ui,
			sans-serif;
		text-align: center;
	}
	.sandbox-badge strong {
		letter-spacing: 0.08em;
	}
</style>
