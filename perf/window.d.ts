// The controls the typing benchmark's test page exposes (src/routes/bench/typing/bench.ts).
export {};

declare global {
	interface Window {
		__typingBench: {
			loadMs: number;
			cursorAt(fraction: number): void;
			reset(): void;
			stats(): { keystrokes: number; p50: number; p95: number; max: number; samples: number[] };
		};
	}
}
