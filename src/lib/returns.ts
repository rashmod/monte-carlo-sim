import { TRADING_DAYS_PER_MONTH, TRADING_DAYS_PER_YEAR } from './constants';
import { calculatePercentile } from './stats';
import type { ReturnStats, ReturnStatsWithStdDev } from './types';

export function calculateDailyLogReturns(prices: number[]) {
	const dailyReturns = [];

	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
	}
	return dailyReturns;
}

export function calculateDailySimpleReturns(prices: number[]) {
	const dailyReturns = [];

	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
	}
	return dailyReturns;
}

export function calculateAnnualLogReturns(averageDailyReturn: number) {
	return Math.E ** (averageDailyReturn * TRADING_DAYS_PER_YEAR) - 1;
}

export function calculateAnnualSimpleReturns(averageDailyReturn: number) {
	return (1 + averageDailyReturn) ** TRADING_DAYS_PER_YEAR - 1;
}

export function calculateAnnualVolatility(dailyVolatility: number) {
	return dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

export function calculateAnnualPortfolioReturn(
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

export function calculateTotalPortfolioReturn(
	portfolioPaths: number[][],
	initialAmount: number,
	monthlySIPAmount: number
): ReturnStats[] {
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
