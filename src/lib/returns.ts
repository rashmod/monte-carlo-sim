import { TRADING_DAYS_PER_MONTH, TRADING_DAYS_PER_YEAR } from './constants';
import { calculatePercentile } from './stats';
import type { ReturnStats, ReturnStatsWithStdDev } from './types';

// Continuously compounded (log) daily return stream
export function calculateDailyLogReturns(prices: number[]) {
	if (prices.length < 3) {
		throw new Error('At least three prices are required');
	}

	const dailyReturns = [];
	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
	}
	return dailyReturns;
}

// Arithmetic/simple daily return stream
export function calculateDailySimpleReturns(prices: number[]) {
	if (prices.length < 3) {
		throw new Error('At least three prices are required');
	}

	const dailyReturns = [];
	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
	}
	return dailyReturns;
}

// Annualized continuously compounded return from avg daily log return
export function calculateAnnualizedLogReturn(meanDailyLogReturn: number) {
	return Math.E ** (meanDailyLogReturn * TRADING_DAYS_PER_YEAR) - 1;
}

// Annualized simple return from avg daily arithmetic return
export function calculateAnnualizedSimpleReturn(meanDailySimpleReturn: number) {
	return (1 + meanDailySimpleReturn) ** TRADING_DAYS_PER_YEAR - 1;
}

export function calculateAnnualizedLogVolatility(dailyLogVolatility: number) {
	return dailyLogVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

// Geometric annualized portfolio return (CAGR) across simulations
export function calculateGeometricAnnualPortfolioReturn(
	portfolioPaths: number[][]
): ReturnStatsWithStdDev[] {
	const initialValue = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: ReturnStatsWithStdDev[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const yearsPassed = day / TRADING_DAYS_PER_YEAR;

		const annualReturns: number[] = [];

		for (let sim = 0; sim < numSimulations; sim++) {
			const valueAtDay = portfolioPaths[sim][day];
			const annualReturn =
				// CAGR -> geometric mean annual return
				(valueAtDay / initialValue) ** (1 / yearsPassed) - 1;
			annualReturns.push(annualReturn);
		}

		// Sort for percentile calculations
		const sortedReturns = [...annualReturns].sort((a, b) => a - b);

		const average =
			annualReturns.reduce((acc, ret) => acc + ret, 0) / numSimulations;
		const median = calculatePercentile(sortedReturns, 50);
		const p5 = calculatePercentile(sortedReturns, 5);
		const p95 = calculatePercentile(sortedReturns, 95);

		const variance =
			annualReturns.reduce((acc, r) => acc + (r - average) ** 2, 0) /
			numSimulations;
		const stdDev = Math.sqrt(variance);

		statsPerTime.push({ average, median, p5, p95, stdDev });
	}

	return statsPerTime;
}

// Simple (arithmetic) total portfolio return relative to contributed capital
export function calculateSimpleTotalPortfolioReturn(
	portfolioPaths: number[][],
	monthlySIPAmount: number
): ReturnStats[] {
	const initialAmount = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: ReturnStats[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const totalReturns: number[] = [];

		// Calculate total invested amount up to this time point
		const numMonths = Math.floor(day / TRADING_DAYS_PER_MONTH);
		const totalInvested = initialAmount + numMonths * monthlySIPAmount;

		for (let sim = 0; sim < numSimulations; sim++) {
			const valueAtDay = portfolioPaths[sim][day];
			// Total return = (current value - total invested) / total invested
			const totalReturn = (valueAtDay - totalInvested) / totalInvested;
			totalReturns.push(totalReturn);
		}

		// Sort for percentile calculations
		const sortedReturns = [...totalReturns].sort((a, b) => a - b);

		const average =
			totalReturns.reduce((acc, ret) => acc + ret, 0) / numSimulations;
		const median = calculatePercentile(sortedReturns, 50);
		const p5 = calculatePercentile(sortedReturns, 5);
		const p95 = calculatePercentile(sortedReturns, 95);

		statsPerTime.push({ average, median, p5, p95 });
	}

	return statsPerTime;
}
