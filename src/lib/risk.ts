import { TRADING_DAYS_PER_MONTH, TRADING_DAYS_PER_YEAR } from './constants';
import {
	calculatePercentile,
	calculateVolatility,
	calculateMean,
	annualizeSimpleMeanAndStd,
	calculateVariance,
} from './stats';
import type { LossProbability, ReturnStatsWithStdDev } from './types';

export function calculateProbabilityOfLoss(
	portfolioPaths: number[][],
	inflationRate: number,
	monthlySipAmount: number
): LossProbability[] {
	const initialAmount = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const probabilitiesPerTime: LossProbability[] = [];
	const TRADING_DAYS_MONTH = Math.round(TRADING_DAYS_PER_YEAR / 12);

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const yearsPassed = day / TRADING_DAYS_PER_YEAR;

		const monthsPassed = Math.floor(day / TRADING_DAYS_MONTH);

		// --- Inflation-adjusted investment ---
		let inflationAdjustedInvested =
			initialAmount * Math.pow(1 + inflationRate, yearsPassed);

		for (let m = 1; m <= monthsPassed; m++) {
			const yearsSinceContribution = yearsPassed - m / 12;
			inflationAdjustedInvested +=
				monthlySipAmount *
				Math.pow(1 + inflationRate, yearsSinceContribution);
		}

		// --- Nominal total invested ---
		const totalInvested = initialAmount + monthsPassed * monthlySipAmount;

		let nominalLossCount = 0;
		let realLossCount = 0;

		for (let sim = 0; sim < numSimulations; sim++) {
			const valueAtDay = portfolioPaths[sim][day];

			if (valueAtDay < totalInvested) nominalLossCount++;

			if (valueAtDay < inflationAdjustedInvested) realLossCount++;
		}

		probabilitiesPerTime.push({
			nominal: nominalLossCount / numSimulations,
			real: realLossCount / numSimulations,
		});
	}

	return probabilitiesPerTime;
}

export function calculateSharpeRatio(
	portfolioPath: number[],
	monthlySIPAmount: number,
	annualRiskFreeRate: number
) {
	const n = portfolioPath.length;
	const sipSchedule = new Array(n).fill(0);

	for (
		let day = TRADING_DAYS_PER_MONTH;
		day < n;
		day += TRADING_DAYS_PER_MONTH
	) {
		const idx = day + 1;
		if (idx < n) sipSchedule[idx] = monthlySIPAmount;
	}

	const dailyRiskFreeRate =
		Math.pow(1 + annualRiskFreeRate, 1 / TRADING_DAYS_PER_YEAR) - 1;

	const dailyReturns: number[] = [];

	for (let t = 1; t < n; t++) {
		const prevValue = portfolioPath[t - 1];
		const sipAtT = sipSchedule[t]; // SIP added at end of day t

		// return = (V_t - V_(t-1) - SIP_today) / V_(t-1)
		const r = (portfolioPath[t] - prevValue - sipAtT) / prevValue;
		dailyReturns.push(r);
	}

	const mean = calculateMean(dailyReturns);
	const stdDev = calculateVolatility(dailyReturns);

	// Daily Sharpe
	const sharpeDaily = (mean - dailyRiskFreeRate) / stdDev;

	// Annualized Sharpe
	return sharpeDaily * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

// TODO this is wrong
export function calculateSharpeRatioStats(
	portfolioPaths: number[][]
): ReturnStatsWithStdDev[] {
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: ReturnStatsWithStdDev[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const sharpeValues: number[] = [];

		for (let sim = 0; sim < numSimulations; sim++) {
			const path = portfolioPaths[sim].slice(0, day + 1);
			if (path.length < 2) continue;

			// Arithmetic/simple daily returns derived from path
			const dailyReturns = path
				.slice(1)
				.map((value, idx) => (value - path[idx]) / path[idx])
				.filter((r) => Number.isFinite(r));

			if (dailyReturns.length === 0) continue;

			const meanDaily =
				dailyReturns.reduce((acc, r) => acc + r, 0) /
				dailyReturns.length;

			const varianceDaily =
				dailyReturns.reduce((acc, r) => acc + (r - meanDaily) ** 2, 0) /
				dailyReturns.length;
			const stdDaily = Math.sqrt(varianceDaily);

			if (stdDaily === 0) continue;

			const { meanAnnual, stdAnnual } = annualizeSimpleMeanAndStd(
				meanDaily,
				stdDaily
			);

			const sharpe = meanAnnual / stdAnnual; // risk-free assumed 0
			if (Number.isFinite(sharpe)) sharpeValues.push(sharpe);
		}

		if (sharpeValues.length === 0) continue;

		const sortedSharpe = [...sharpeValues].sort((a, b) => a - b);

		const average = calculateMean(sharpeValues);
		const variance = calculateVariance(sharpeValues, average);
		const stdDev = Math.sqrt(variance);

		const median = calculatePercentile(sortedSharpe, 50);
		const p5 = calculatePercentile(sortedSharpe, 5);
		const p95 = calculatePercentile(sortedSharpe, 95);

		statsPerTime.push({ average, median, p5, p95, stdDev });
	}

	return statsPerTime;
}
