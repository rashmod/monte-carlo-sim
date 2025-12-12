import { describe, it, expect } from 'vitest';
import { gaussianRandom } from '../random';

describe('Random', () => {
	it('10k cases', () => {
		const randoms = Array.from({ length: 100000 }, gaussianRandom);
		const mean =
			randoms.reduce((acc, curr) => acc + curr, 0) / randoms.length;
		const stdDev = Math.sqrt(
			randoms.reduce((acc, curr) => acc + (curr - mean) ** 2, 0) /
				randoms.length
		);
		expect(mean).toBeCloseTo(0.0, 2);
		expect(stdDev).toBeCloseTo(1.0, 2);
	});
});
