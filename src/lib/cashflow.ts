import { TRADING_DAYS_PER_MONTH, TRADING_DAYS_PER_YEAR } from './constants';
import { calculateMean, calculatePercentile, calculateVariance } from './stats';
import type { CashflowTD, ReturnStatsWithStdDev } from './types';

export function calculateXirr(
	cashflows: CashflowTD[],
	guess = 0.1,
	maxIterations = 100,
	tolerance = 1e-7
) {
	const d0 = cashflows[0].dayIndex;

	const f = (r: number) =>
		cashflows.reduce((sum, cf) => {
			const t = (cf.dayIndex - d0) / TRADING_DAYS_PER_YEAR; // time in years
			return sum + cf.amount / Math.pow(1 + r, t);
		}, 0);

	const fPrime = (r: number) =>
		cashflows.reduce((sum, cf) => {
			const t = (cf.dayIndex - d0) / TRADING_DAYS_PER_YEAR;
			return sum - (t * cf.amount) / Math.pow(1 + r, t + 1);
		}, 0);

	let r = guess;

	for (let i = 0; i < maxIterations; i++) {
		const npv = f(r);
		const dnpv = fPrime(r);

		if (Math.abs(npv) < tolerance) return r;

		if (dnpv === 0) break;

		const newR = r - npv / dnpv;

		if (!isFinite(newR) || newR <= -1) break;

		r = newR;
	}

	throw new Error('XIRR (trading days) did not converge');
}

export function generateCashflowArray(
	simulation: number[],
	monthlySIPAmount: number
) {
	const cashflows: CashflowTD[] = [];
	const numMonths = Math.floor(simulation.length / TRADING_DAYS_PER_MONTH);

	// Initial investment at day 0
	cashflows.push({
		dayIndex: 0,
		amount: -simulation[0],
	});

	// Monthly SIP investments
	for (let i = 1; i <= numMonths; i++) {
		const dayIndex = i * TRADING_DAYS_PER_MONTH;

		// If this is the last month and matches simulation end, use final value
		if (i === numMonths && dayIndex === simulation.length - 1) {
			cashflows.push({
				dayIndex: dayIndex,
				amount: simulation[dayIndex],
			});
		} else if (dayIndex < simulation.length) {
			// Monthly SIP investment
			cashflows.push({
				dayIndex: dayIndex,
				amount: -monthlySIPAmount,
			});
		}
	}

	// Add final value if not already included
	const finalDayIndex = simulation.length - 1;
	const lastCashflow = cashflows[cashflows.length - 1];
	if (lastCashflow.dayIndex !== finalDayIndex) {
		cashflows.push({
			dayIndex: finalDayIndex,
			amount: simulation[finalDayIndex],
		});
	}

	return cashflows;
}

export function calculateXIRRStats(
	portfolioPaths: number[][],
	monthlySIPAmount: number
): ReturnStatsWithStdDev[] {
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: ReturnStatsWithStdDev[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const xirrValues: number[] = [];

		for (let sim = 0; sim < numSimulations; sim++) {
			// Get simulation up to this time point
			const simulationSlice = portfolioPaths[sim].slice(0, day + 1);

			// Generate cashflows for this time period
			const cashflows = generateCashflowArray(
				simulationSlice,
				monthlySIPAmount
			);

			// Calculate XIRR for this simulation at this time point
			try {
				const xirr = calculateXirr(cashflows);
				xirrValues.push(xirr);
			} catch (error) {
				// Skip invalid XIRR calculations
				console.warn('XIRR calculation failed:', error);
			}
		}

		if (xirrValues.length === 0) continue;

		// Sort for percentile calculations
		const sortedXirr = [...xirrValues].sort((a, b) => a - b);

		const average = calculateMean(xirrValues);
		const variance = calculateVariance(xirrValues, average);
		const stdDev = Math.sqrt(variance);

		const median = calculatePercentile(sortedXirr, 50);
		const p5 = calculatePercentile(sortedXirr, 5);
		const p95 = calculatePercentile(sortedXirr, 95);

		statsPerTime.push({ average, median, p5, p95, stdDev });
	}

	return statsPerTime;
}
