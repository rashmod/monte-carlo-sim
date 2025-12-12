import { describe, it, expect } from 'vitest';
import {
	calculateAnnualizedLogReturn,
	calculateAnnualizedSimpleReturn,
	calculateDailyLogReturns,
	calculateDailySimpleReturns,
	calculateAnnualizedLogVolatility,
	// TODO: add tests for these
	calculateGeometricAnnualPortfolioReturn,
	calculateSimpleTotalPortfolioReturn,
} from '../returns';

describe('Returns', () => {
	describe('log returns', () => {
		describe('daily', () => {
			it('increasing prices', () => {
				const prices = [101, 102, 103, 104, 105];
				const returns = calculateDailyLogReturns(prices);
				const expectedReturns = [
					Math.log(102 / 101),
					Math.log(103 / 102),
					Math.log(104 / 103),
					Math.log(105 / 104),
				];
				expect(returns).toEqual(expectedReturns);
			});

			it('decreasing prices', () => {
				const prices = [105, 104, 103, 102, 101];
				const returns = calculateDailyLogReturns(prices);
				const expectedReturns = [
					Math.log(104 / 105),
					Math.log(103 / 104),
					Math.log(102 / 103),
					Math.log(101 / 102),
				];
				expect(returns).toEqual(expectedReturns);
			});

			it('constant prices', () => {
				const prices = [100, 100, 100, 100, 100];
				const returns = calculateDailyLogReturns(prices);
				const expectedReturns = [0, 0, 0, 0];
				expect(returns).toEqual(expectedReturns);
			});

			it('throws on empty array', () => {
				const prices: number[] = [];
				expect(() => calculateDailyLogReturns(prices)).toThrow(
					'Prices array must contain at least two elements'
				);
			});

			it('throws on single price', () => {
				const prices = [100];
				expect(() => calculateDailyLogReturns(prices)).toThrow(
					'Prices array must contain at least two elements'
				);
			});
		});

		describe('annualized', () => {
			it('zero return', () => {
				const returns = 0;
				const annualized = calculateAnnualizedLogReturn(returns);
				expect(annualized).toBe(0);
			});

			it('positive return', () => {
				const returns = 0.001;
				const annualized = calculateAnnualizedLogReturn(returns);
				expect(annualized).toBeCloseTo(0.286596037284841, 10);
			});

			it('negative return', () => {
				const returns = -0.001;
				const annualized = calculateAnnualizedLogReturn(returns);
				expect(annualized).toBeCloseTo(-0.222755261931054, 10);
			});
		});

		describe('volatility', () => {
			it('positive volatility', () => {
				const dailyVolatility = 0.001;
				const volatility =
					calculateAnnualizedLogVolatility(dailyVolatility);
				expect(volatility).toBeCloseTo(0.01587450786639, 10);
			});

			it('negative volatility', () => {
				const dailyVolatility = -0.001;
				const volatility =
					calculateAnnualizedLogVolatility(dailyVolatility);
				expect(volatility).toBeCloseTo(-0.01587450786639, 10);
			});
		});
	});

	describe('simple returns', () => {
		describe('daily', () => {
			it('increasing prices', () => {
				const prices = [101, 102, 103, 104, 105];
				const returns = calculateDailySimpleReturns(prices);
				const expectedReturns = [
					(102 - 101) / 101,
					(103 - 102) / 102,
					(104 - 103) / 103,
					(105 - 104) / 104,
				];
				expect(returns).toEqual(expectedReturns);
			});

			it('decreasing prices', () => {
				const prices = [105, 104, 103, 102, 101];
				const returns = calculateDailySimpleReturns(prices);
				const expectedReturns = [
					(104 - 105) / 105,
					(103 - 104) / 104,
					(102 - 103) / 103,
					(101 - 102) / 102,
				];
				expect(returns).toEqual(expectedReturns);
			});

			it('constant prices', () => {
				const prices = [100, 100, 100, 100, 100];
				const returns = calculateDailySimpleReturns(prices);
				const expectedReturns = [0, 0, 0, 0];
				expect(returns).toEqual(expectedReturns);
			});

			it('throws on empty array', () => {
				const prices: number[] = [];
				expect(() => calculateDailySimpleReturns(prices)).toThrow(
					'Prices array must contain at least two elements'
				);
			});

			it('throws on single price', () => {
				const prices = [100];
				expect(() => calculateDailySimpleReturns(prices)).toThrow(
					'Prices array must contain at least two elements'
				);
			});
		});

		describe('annualized', () => {
			it('zero return', () => {
				const returns = 0;
				const annualized = calculateAnnualizedSimpleReturn(returns);
				expect(annualized).toBe(0);
			});

			it('positive return', () => {
				const returns = 0.001;
				const annualized = calculateAnnualizedSimpleReturn(returns);
				expect(annualized).toBeCloseTo(0.28643404437615, 10);
			});

			it('negative return', () => {
				const returns = -0.001;
				const annualized = calculateAnnualizedSimpleReturn(returns);
				expect(annualized).toBeCloseTo(-0.22285325392787, 10);
			});
		});
	});
});
