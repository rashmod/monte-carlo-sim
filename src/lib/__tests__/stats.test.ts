import { describe, it, expect } from 'vitest';
import {
	calculateMean,
	calculatePercentile,
	calculateVolatility,
} from '../../lib';

describe('Stats Calculation', () => {
	describe('Mean', () => {
		it('calculates for [1,2,3,4,5]', () => {
			const arr = [1, 2, 3, 4, 5];
			const mean = calculateMean(arr);
			expect(mean).toBe(3);
		});

		it('calculates for all zeros', () => {
			const arr = [0, 0, 0, 0, 0];
			const mean = calculateMean(arr);
			expect(mean).toBe(0);
		});

		it('calculates for single value', () => {
			const arr = [5];
			const mean = calculateMean(arr);
			expect(mean).toBe(5);
		});

		it('calculates for two values', () => {
			const arr = [0, 5];
			const mean = calculateMean(arr);
			expect(mean).toBe(2.5);
		});

		it('throws on empty array', () => {
			const arr: number[] = [];
			expect(() => calculateMean(arr)).toThrow(
				'Array must contain at least one element'
			);
		});
	});

	describe('Volatility', () => {
		it('calculates for [1,2,3,4,5]', () => {
			const arr = [1, 2, 3, 4, 5];
			const volatility = calculateVolatility(arr);
			expect(volatility).toBe(Math.SQRT2);
		});

		it('zero for all zeros', () => {
			const arr = [0, 0, 0, 0, 0];
			const volatility = calculateVolatility(arr);
			expect(volatility).toBe(0);
		});

		it('zero for all same value', () => {
			const arr = [1, 1, 1, 1, 1];
			const volatility = calculateVolatility(arr);
			expect(volatility).toBe(0);
		});

		it('zero for single value', () => {
			const arr = [5];
			const volatility = calculateVolatility(arr);
			expect(volatility).toBe(0);
		});

		it('calculates for small numbers', () => {
			const arr = [1e-9, 2e-9];
			const volatility = calculateVolatility(arr);
			expect(volatility).toBe(5e-10);
		});

		it('is equal for shifted arrays', () => {
			const arr1 = [0.1, 0.2, 0.3];
			const arr2 = [1.1, 1.2, 1.3];
			const volatility1 = calculateVolatility(arr1);
			const volatility2 = calculateVolatility(arr2);
			expect(volatility1).toBeCloseTo(volatility2, 10);
		});

		it('doubles when input is doubled', () => {
			const arr1 = [0.1, 0.2, 0.3];
			const arr2 = [0.2, 0.4, 0.6];
			const volatility1 = calculateVolatility(arr1);
			const volatility2 = calculateVolatility(arr2);
			expect(volatility1 * 2).toBeCloseTo(volatility2, 10);
		});

		it('throws on empty array', () => {
			const arr: number[] = [];
			expect(() => calculateVolatility(arr)).toThrow(
				'Array must contain at least one element'
			);
		});
	});

	describe('Percentile', () => {
		it('median of [1,2,3,4,5]', () => {
			const arr = [1, 2, 3, 4, 5];
			const percentile = calculatePercentile(arr, 50);
			expect(percentile).toBe(3);
		});

		it('max value (100th percentile)', () => {
			const arr = [1, 2, 3, 4, 5];
			const percentile = calculatePercentile(arr, 100);
			expect(percentile).toBe(5);
		});

		it('min value (0th percentile)', () => {
			const arr = [1, 2, 3, 4, 5];
			const percentile = calculatePercentile(arr, 0);
			expect(percentile).toBe(1);
		});

		it('median between two values', () => {
			const arr = [10, 20, 30, 40];
			const percentile = calculatePercentile(arr, 50);
			expect(percentile).toBe(25);
		});

		it('throws on empty array', () => {
			const arr: number[] = [];
			expect(() => calculatePercentile(arr, 50)).toThrow(
				'Array must contain at least one element'
			);
		});

		it('throws on percentile > 100', () => {
			const arr = [1, 2, 3, 4, 5];
			expect(() => calculatePercentile(arr, 110)).toThrow(
				'Percentile must be between 0 and 100'
			);
		});

		it('throws on percentile < 0', () => {
			const arr = [1, 2, 3, 4, 5];
			expect(() => calculatePercentile(arr, -10)).toThrow(
				'Percentile must be between 0 and 100'
			);
		});

		it('works for large arrays', () => {
			const arr = new Array(1000).fill(0).map((_, index) => index);
			const percentile = calculatePercentile(arr, 73.5);
			expect(percentile).toBe(734.265);
		});
	});
});
