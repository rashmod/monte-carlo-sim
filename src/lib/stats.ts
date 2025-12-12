import { TRADING_DAYS_PER_YEAR } from './constants';

export function calculateMean(nums: number[]) {
	return nums.reduce((acc, num) => acc + num, 0) / nums.length;
}

export function calculateVolatility(returns: number[]) {
	const mean = calculateMean(returns);
	const variance =
		returns.reduce((acc, ret) => acc + (ret - mean) ** 2, 0) /
		(returns.length - 1);
	return Math.sqrt(variance);
}

export function calculatePercentile(
	sortedArray: number[],
	percentile: number
): number {
	if (sortedArray.length === 0) return 0;
	const index = (percentile / 100) * (sortedArray.length - 1);
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	const weight = index - lower;

	if (lower === upper) {
		return sortedArray[lower];
	}

	return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

export function annualizeMeanAndStd(
	dailyMean: number,
	dailyStd: number
): { meanAnnual: number; stdAnnual: number } {
	return {
		meanAnnual: dailyMean * TRADING_DAYS_PER_YEAR,
		stdAnnual: dailyStd * Math.sqrt(TRADING_DAYS_PER_YEAR),
	};
}

