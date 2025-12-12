import { TRADING_DAYS_PER_YEAR } from './constants';
import { calculatePercentile } from './stats';
import type { DrawdownMilestone, DrawdownYearStats } from './types';

export function calculateDrawdownStats(portfolioPaths: number[][]) {
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const results: DrawdownMilestone[][] = [];

	for (let sim = 0; sim < numSimulations; sim++) {
		const simOne = portfolioPaths[sim];
		const milestones: DrawdownMilestone[] = [];

		let peak = simOne[0];
		let peakIndex = 0;

		let maxDrawdown = 0;
		let maxDrawdownPeakIndex = 0;
		let maxDrawdownTroughIndex = 0;

		for (let day = 0; day < numDays; day++) {
			const value = simOne[day];

			// Update peak
			if (value > peak) {
				peak = value;
				peakIndex = day;
			}

			// Calculate drawdown
			const dd = (value - peak) / peak;
			if (dd < maxDrawdown) {
				maxDrawdown = dd;
				maxDrawdownPeakIndex = peakIndex;
				maxDrawdownTroughIndex = day;
			}

			// Yearly milestone
			if (day !== 0 && day % TRADING_DAYS_PER_YEAR === 0) {
				let recovered = false;
				let duration: number | null = null;

				// Check if recovered from max drawdown
				for (let d = maxDrawdownTroughIndex + 1; d <= day; d++) {
					if (simOne[d] >= simOne[maxDrawdownPeakIndex]) {
						duration = d - maxDrawdownTroughIndex;
						recovered = true;
						break;
					}
				}

				if (recovered && duration) {
					milestones.push({
						value,
						recovered,
						duration,
						drawdown: maxDrawdown,
						year: day / TRADING_DAYS_PER_YEAR,
					});
				}

				if (!recovered) {
					milestones.push({
						value,
						recovered,
						duration: null,
						drawdown: maxDrawdown,
						year: day / TRADING_DAYS_PER_YEAR,
					});
				}
			}
		}

		results.push(milestones);
	}

	const statsPerYear: DrawdownYearStats[] = [];

	const numYears = results[0].length;

	for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
		const drawdowns = [];
		const durations = [];

		for (let sim = 0; sim < numSimulations; sim++) {
			const milestone = results[sim][yearIndex];
			drawdowns.push(milestone.drawdown);
			if (milestone.recovered) {
				durations.push(milestone.duration);
			}
		}

		const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
		const sortedDurations = [...durations].sort((a, b) => b - a);

		const medianDrawdown = calculatePercentile(sortedDrawdowns, 50);
		const medianDuration = calculatePercentile(sortedDurations, 50);

		const p5Drawdown = calculatePercentile(sortedDrawdowns, 5);
		const p5Duration = calculatePercentile(sortedDurations, 5);

		const worstDrawdown = sortedDrawdowns[0];
		const worstDuration = sortedDurations[0];

		const recoveredPercent = sortedDurations.length / numSimulations;

		statsPerYear.push({
			medianDrawdown,
			medianDuration,
			p5Drawdown,
			p5Duration,
			recoveredPercent,
			worstDrawdown,
			worstDuration,
		});
	}

	return statsPerYear;
}

