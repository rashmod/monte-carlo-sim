import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	alignPrices,
	calculateCorrelation,
	calculateCorrelationMatrix,
	choleskyDecomposition,
	generateCorrelatedRandom,
} from '../matrix';
import type { Asset, HistoricalData } from '../types';
import * as randomModule from '../random';

// Mock the random module
vi.mock('../random', () => ({
	gaussianRandom: vi.fn(),
}));

function expectMatrixToBeCloseTo(
	actual: number[][],
	expected: number[][],
	precision: number = 10
) {
	expect(actual).toHaveLength(expected.length);
	for (let i = 0; i < expected.length; i++) {
		expect(actual[i]).toHaveLength(expected[i].length);
		for (let j = 0; j < expected[i].length; j++) {
			expect(actual[i][j]).toBeCloseTo(expected[i][j], precision);
		}
	}
}

describe.skip('alignPrices', () => {
	it('aligns matching dates', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
			{ date: new Date('1/5/2024 15:30:00'), price: 103 },
		];
		const assetB = [
			{ date: new Date('1/2/2024 15:30:00'), price: 50 },
			{ date: new Date('1/3/2024 15:30:00'), price: 51 },
			{ date: new Date('1/4/2024 15:30:00'), price: 52 },
			{ date: new Date('1/5/2024 15:30:00'), price: 53 },
		];

		const aligned = alignPrices(assetA, assetB);
		expect(aligned).toEqual([
			{ date: new Date('1/2/2024 15:30:00'), priceA: 100, priceB: 50 },
			{ date: new Date('1/3/2024 15:30:00'), priceA: 101, priceB: 51 },
			{ date: new Date('1/4/2024 15:30:00'), priceA: 102, priceB: 52 },
			{ date: new Date('1/5/2024 15:30:00'), priceA: 103, priceB: 53 },
		]);
	});

	it('aligns same days with different times', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
			{ date: new Date('1/5/2024 15:30:00'), price: 103 },
		];
		const assetB = [
			{ date: new Date('1/2/2024 5:30:00'), price: 50 },
			{ date: new Date('1/3/2024 5:30:00'), price: 51 },
			{ date: new Date('1/4/2024 5:30:00'), price: 52 },
			{ date: new Date('1/5/2024 5:30:00'), price: 53 },
		];

		const aligned = alignPrices(assetA, assetB);
		expect(aligned).toEqual([
			{ date: new Date('1/2/2024 15:30:00'), priceA: 100, priceB: 50 },
			{ date: new Date('1/3/2024 15:30:00'), priceA: 101, priceB: 51 },
			{ date: new Date('1/4/2024 15:30:00'), priceA: 102, priceB: 52 },
			{ date: new Date('1/5/2024 15:30:00'), priceA: 103, priceB: 53 },
		]);
	});

	it('aligns with partial date overlap', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
		];
		const assetB = [
			{ date: new Date('1/3/2024 5:30:00'), price: 51 },
			{ date: new Date('1/4/2024 5:30:00'), price: 52 },
			{ date: new Date('1/5/2024 5:30:00'), price: 53 },
		];

		const aligned = alignPrices(assetA, assetB);
		expect(aligned).toEqual([
			{ date: new Date('1/3/2024 15:30:00'), priceA: 101, priceB: 51 },
			{ date: new Date('1/4/2024 15:30:00'), priceA: 102, priceB: 52 },
		]);
	});

	it('returns empty for no date overlap', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
			{ date: new Date('1/5/2024 15:30:00'), price: 103 },
		];
		const assetB = [
			{ date: new Date('1/6/2024 5:30:00'), price: 53 },
			{ date: new Date('1/7/2024 5:30:00'), price: 54 },
			{ date: new Date('1/8/2024 5:30:00'), price: 55 },
			{ date: new Date('1/9/2024 5:30:00'), price: 56 },
		];

		const aligned = alignPrices(assetA, assetB);
		expect(aligned).toEqual([]);
	});

	it('aligns with unequal lengths', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
			{ date: new Date('1/5/2024 15:30:00'), price: 103 },
		];

		const assetB = [
			{ date: new Date('1/2/2024 5:30:00'), price: 50 },
			{ date: new Date('1/3/2024 5:30:00'), price: 51 },
			{ date: new Date('1/4/2024 5:30:00'), price: 52 },
		];

		const aligned = alignPrices(assetA, assetB);
		expect(aligned).toEqual([
			{ date: new Date('1/2/2024 15:30:00'), priceA: 100, priceB: 50 },
			{ date: new Date('1/3/2024 15:30:00'), priceA: 101, priceB: 51 },
			{ date: new Date('1/4/2024 15:30:00'), priceA: 102, priceB: 52 },
		]);
	});

	it('throws with empty asset data', () => {
		const assetA = [
			{ date: new Date('1/2/2024 15:30:00'), price: 100 },
			{ date: new Date('1/3/2024 15:30:00'), price: 101 },
			{ date: new Date('1/4/2024 15:30:00'), price: 102 },
			{ date: new Date('1/5/2024 15:30:00'), price: 103 },
		];
		const assetB: HistoricalData[] = [];

		expect(() => alignPrices(assetA, assetB)).toThrow(
			'One of the assets has no prices'
		);
	});
});

describe.skip('calculateCorrelation', () => {
	it('returns 1 for perfect positive', () => {
		const x = [1, 2, 3, 4, 5];
		const y = [2, 4, 6, 8, 10];
		const correlation = calculateCorrelation(x, y);
		expect(correlation).toBe(1);
	});

	it('returns 0 for no correlation', () => {
		const x = [1, 2, 3, 4, 5];
		const y = [4, 1, 4, 1, 4];
		const correlation = calculateCorrelation(x, y);
		expect(correlation).toBe(0);
	});

	it('throws on length mismatch', () => {
		const x = [1, 2, 3, 4, 5];
		const y = [1, 2, 3, 4];
		expect(() => calculateCorrelation(x, y)).toThrow(
			'Arrays must have the same length'
		);
	});

	it('throws on empty input', () => {
		const x: number[] = [];
		const y: number[] = [];
		expect(() => calculateCorrelation(x, y)).toThrow(
			'Arrays must have at least two elements'
		);
	});

	it('returns 0 for zero variance', () => {
		const x = [1, 1, 1, 1, 1];
		const y = [1, 2, 3, 4, 5];
		const correlation = calculateCorrelation(x, y);
		expect(correlation).toBe(0);
	});
});

describe('calculateCorrelationMatrix', () => {
	it('computes correlations for multiple assets', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 2 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 6 },
						{ date: new Date('1/5/2024 15:30:00'), price: 8 },
						{ date: new Date('1/6/2024 15:30:00'), price: 10 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 5 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 2 },
						{ date: new Date('1/6/2024 15:30:00'), price: 1 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);
		const expected = [
			[1, 1, 0.8082469598],
			[1, 1, 0.8082469598],
			[0.8082469598, 0.8082469598, 1],
		];

		expectMatrixToBeCloseTo(correlationMatrix, expected);
	});

	it('all identical assets', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);
		const expected = [
			[1, 1, 1],
			[1, 1, 1],
			[1, 1, 1],
		];

		expectMatrixToBeCloseTo(correlationMatrix, expected);
	});

	it('is symmetric', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 2 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 6 },
						{ date: new Date('1/5/2024 15:30:00'), price: 8 },
						{ date: new Date('1/6/2024 15:30:00'), price: 10 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 5 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 2 },
						{ date: new Date('1/6/2024 15:30:00'), price: 1 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);

		for (let i = 0; i < correlationMatrix.length; i++) {
			for (let j = 0; j < correlationMatrix[i].length; j++) {
				expect(correlationMatrix[i][j]).toBe(correlationMatrix[j][i]);
			}
		}
	});

	it('diagonal values are 1', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 2 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 6 },
						{ date: new Date('1/5/2024 15:30:00'), price: 8 },
						{ date: new Date('1/6/2024 15:30:00'), price: 10 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 5 },
						{ date: new Date('1/3/2024 15:30:00'), price: 4 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 2 },
						{ date: new Date('1/6/2024 15:30:00'), price: 1 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);

		for (let i = 0; i < correlationMatrix.length; i++) {
			expect(correlationMatrix[i][i]).toBe(1);
		}
	});

	it('matrix with zero variance column', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 2 },
						{ date: new Date('1/3/2024 15:30:00'), price: 1 },
						{ date: new Date('1/4/2024 15:30:00'), price: 2 },
						{ date: new Date('1/5/2024 15:30:00'), price: 3 },
						{ date: new Date('1/6/2024 15:30:00'), price: 4 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 1 },
						{ date: new Date('1/4/2024 15:30:00'), price: 1 },
						{ date: new Date('1/5/2024 15:30:00'), price: 1 },
						{ date: new Date('1/6/2024 15:30:00'), price: 1 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);
		const expected = [
			[1, 0],
			[0, 0],
		];

		expect(correlationMatrix).toHaveLength(expected.length);
		for (let i = 0; i < expected.length; i++) {
			expect(correlationMatrix[i]).toHaveLength(expected[i].length);
			for (let j = 0; j < expected[i].length; j++) {
				expect(correlationMatrix[i][j]).toBe(expected[i][j]);
			}
		}
	});

	it('handles partial date overlap', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/2/2024 15:30:00'), price: 1 },
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
					],
					errors: [],
				},
			},
			{
				historicalData: {
					data: [
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);
		const expected = [
			[1, 1],
			[1, 1],
		];
		expectMatrixToBeCloseTo(correlationMatrix, expected);
	});

	it('works with single asset', () => {
		const assets = [
			{
				historicalData: {
					data: [
						{ date: new Date('1/3/2024 15:30:00'), price: 2 },
						{ date: new Date('1/4/2024 15:30:00'), price: 3 },
						{ date: new Date('1/5/2024 15:30:00'), price: 4 },
						{ date: new Date('1/6/2024 15:30:00'), price: 5 },
					],
					errors: [],
				},
			},
		] as unknown as Asset[];
		const correlationMatrix = calculateCorrelationMatrix(assets);
		const expected = [[1]];
		expectMatrixToBeCloseTo(correlationMatrix, expected);
	});

	it('throws with no assets', () => {
		const assets: Asset[] = [];
		expect(() => calculateCorrelationMatrix(assets)).toThrow(
			'At least one asset is required'
		);
	});
});

describe('choleskyDecomposition', () => {
	it('decomposes 3x3 matrix', () => {
		const correlationMatrix = [
			[1, 0.5, 0.5],
			[0.5, 1, 0.5],
			[0.5, 0.5, 1],
		];
		const choleskyMatrix = choleskyDecomposition(correlationMatrix);
		const expected = [
			[1, 0, 0],
			[0.5, 0.86602540378, 0],
			[0.5, 0.28867513459, 0.81649658093],
		];
		expectMatrixToBeCloseTo(choleskyMatrix, expected);
	});

	it('decomposes 1x1 matrix', () => {
		const correlationMatrix = [[1]];
		const choleskyMatrix = choleskyDecomposition(correlationMatrix);
		const expected = [[1]];
		expectMatrixToBeCloseTo(choleskyMatrix, expected);
	});

	it('decomposes identity matrix', () => {
		const correlationMatrix = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1],
		];
		const choleskyMatrix = choleskyDecomposition(correlationMatrix);
		const expected = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1],
		];
		expectMatrixToBeCloseTo(choleskyMatrix, expected);
	});

	it('throws on non-positive-definite', () => {
		const correlationMatrix = [
			[1, 1],
			[1, 1],
		];
		expect(() => choleskyDecomposition(correlationMatrix)).toThrow(
			'Matrix is not positive-definite'
		);
	});

	it('throws on empty', () => {
		const correlationMatrix: number[][] = [];
		expect(() => choleskyDecomposition(correlationMatrix)).toThrow(
			'Matrix must be non-empty'
		);
	});

	it('throws on non-square', () => {
		const correlationMatrix = [
			[1, 1],
			[1, 1, 1],
		];
		expect(() => choleskyDecomposition(correlationMatrix)).toThrow(
			'Matrix must be square'
		);
	});

	it('works for size 1 matrix', () => {
		const correlationMatrix = [[1]];
		const choleskyMatrix = choleskyDecomposition(correlationMatrix);
		const expected = [[1]];
		expectMatrixToBeCloseTo(choleskyMatrix, expected);
	});

	it('matrix is lower triangular', () => {
		const correlationMatrix = [
			[1, 0.5, 0.5],
			[0.5, 1, 0.5],
			[0.5, 0.5, 1],
		];
		const choleskyMatrix = choleskyDecomposition(correlationMatrix);

		for (let i = 0; i < choleskyMatrix.length; i++) {
			for (let j = 0; j < choleskyMatrix[i].length; j++) {
				if (j > i) {
					expect(choleskyMatrix[i][j]).toBe(0);
				}
			}
		}
	});
});

describe('generateCorrelatedRandom', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('generates correlated numbers', () => {
		// Mock gaussianRandom to return predictable values
		vi.mocked(randomModule.gaussianRandom)
			.mockReturnValueOnce(1)
			.mockReturnValueOnce(2);

		const choleskyMatrix = [
			[1, 0],
			[2, 3],
		];

		const correlatedRandom = generateCorrelatedRandom(choleskyMatrix);

		const expected = [1, 8];
		expect(correlatedRandom).toEqual(expected);
		expect(randomModule.gaussianRandom).toHaveBeenCalledTimes(2);
	});

	it('generates from identity', () => {
		vi.mocked(randomModule.gaussianRandom)
			.mockReturnValueOnce(0.5)
			.mockReturnValueOnce(-1.2);

		const choleskyMatrix = [
			[1, 0],
			[0, 1],
		];
		const correlatedRandom = generateCorrelatedRandom(choleskyMatrix);
		const expected = [0.5, -1.2];
		expect(correlatedRandom).toEqual(expected);
		expect(randomModule.gaussianRandom).toHaveBeenCalledTimes(2);
	});

	it('single variable matrix', () => {
		vi.mocked(randomModule.gaussianRandom).mockReturnValueOnce(0.5);

		const choleskyMatrix = [[1]];
		const correlatedRandom = generateCorrelatedRandom(choleskyMatrix);
		const expected = [0.5];
		expect(correlatedRandom).toEqual(expected);
		expect(randomModule.gaussianRandom).toHaveBeenCalledTimes(1);
	});
});
