export const TRADING_DAYS_PER_YEAR = 252;
export const TRADING_DAYS_PER_MONTH = TRADING_DAYS_PER_YEAR / 12;

const INITIAL_ASSET_PRICE = 1000;

export type HistoricalData = {
	date: Date;
	price: number;
};

export type Asset = {
	name: string;
	weight: number;
	rawHistoricalData: string;
	historicalData: HistoricalData[]; // daily
	dailyLogReturns: number[];
	dailySimpleReturns: number[];
	dailyAverageLogReturn: number;
	dailyVolatility: number;
	annualLogReturn: number;
	annualSimpleReturn: number;
	annualVolatility: number;
};

function cleanHistoricalData(historicalData: string): HistoricalData[] {
	return historicalData
		.trim()
		.split('\n')
		.filter((line) => line.trim() !== '')
		.map((line) => line.split('\t').map((w) => w.trim()))
		.map(([date, price]) => ({
			date: new Date(date),
			price: Number(price),
		}));
}

function calculateMean(nums: number[]) {
	return nums.reduce((acc, num) => acc + num, 0) / nums.length;
}

function calculateVolatility(returns: number[]) {
	const mean = calculateMean(returns);
	const variance =
		returns.reduce((acc, ret) => acc + (ret - mean) ** 2, 0) /
		(returns.length - 1);
	return Math.sqrt(variance);
}

function calculateDailyLogReturns(prices: number[]) {
	const dailyReturns = [];

	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
	}
	return dailyReturns;
}

function calculateDailySimpleReturns(prices: number[]) {
	const dailyReturns = [];

	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
	}
	return dailyReturns;
}

function calculateAnnualLogReturns(averageDailyReturn: number) {
	return Math.E ** (averageDailyReturn * 252) - 1;
}

function calculateAnnualSimpleReturns(averageDailyReturn: number) {
	return (1 + averageDailyReturn) ** 252 - 1;
}

function calculateAnnualVolatility(dailyVolatility: number) {
	return dailyVolatility * Math.sqrt(252);
}

export function generateAsset(
	name: string,
	weight: number,
	historicalData: string
): Asset {
	const cleanedHistoricalData = cleanHistoricalData(historicalData);
	const dailyLogReturns = calculateDailyLogReturns(
		cleanedHistoricalData.map((data) => data.price)
	);
	const dailySimpleReturns = calculateDailySimpleReturns(
		cleanedHistoricalData.map((data) => data.price)
	);

	const dailyAverageLogReturn = calculateMean(dailyLogReturns);
	const dailyAverageSimpleReturn = calculateMean(dailySimpleReturns);
	const dailyVolatility = calculateVolatility(dailyLogReturns);

	const annualLogReturn = calculateAnnualLogReturns(dailyAverageLogReturn);
	const annualSimpleReturn = calculateAnnualSimpleReturns(
		dailyAverageSimpleReturn
	);
	const annualVolatility = calculateAnnualVolatility(dailyVolatility);

	return {
		name,
		weight,
		rawHistoricalData: historicalData,
		historicalData: cleanedHistoricalData,
		dailyLogReturns,
		dailyAverageLogReturn,
		dailySimpleReturns,
		dailyVolatility,
		annualLogReturn,
		annualSimpleReturn,
		annualVolatility,
	};
}

// uses the Box-Muller transform to generate a random number from a normal distribution
function gaussianRandom() {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();
	return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function alignPrices(assetA: HistoricalData[], assetB: HistoricalData[]) {
	const mapA = new Map(
		assetA.map((data) => [
			data.date.toISOString().split('T')[0],
			{ date: data.date, price: data.price },
		])
	);
	const mapB = new Map(
		assetB.map((data) => [
			data.date.toISOString().split('T')[0],
			{ date: data.date, price: data.price },
		])
	);

	const commonTimestamps = [...mapA.keys()].filter((timestamp) =>
		mapB.has(timestamp)
	);

	const alignedPrices = commonTimestamps.map((timestamp) => {
		const dataA = mapA.get(timestamp);
		const dataB = mapB.get(timestamp);
		if (!dataA || !dataB) throw new Error('Price data not found');

		return { date: dataA.date, priceA: dataA.price, priceB: dataB.price };
	});

	return alignedPrices;
}

function calculateCorrelation(x: number[], y: number[]) {
	const n = x.length;
	if (n !== y.length || n === 0) throw new Error('Invalid input lengths');

	const meanX = x.reduce((a, b) => a + b, 0) / n;
	const meanY = y.reduce((a, b) => a + b, 0) / n;

	let numerator = 0;
	let denomX = 0;
	let denomY = 0;

	for (let i = 0; i < n; i++) {
		const dx = x[i] - meanX;
		const dy = y[i] - meanY;
		numerator += dx * dy;
		denomX += dx * dx;
		denomY += dy * dy;
	}

	return numerator / Math.sqrt(denomX * denomY);
}

export function calculateCorrelationMatrix(assets: Asset[]) {
	const correlationMatrix = [];

	for (let i = 0; i < assets.length; i++) {
		const row = [];
		for (let j = 0; j < assets.length; j++) {
			const alignedPrices = alignPrices(
				assets[i].historicalData,
				assets[j].historicalData
			);

			const returnsA = calculateDailyLogReturns(
				alignedPrices.map((data) => data.priceA)
			);
			const returnsB = calculateDailyLogReturns(
				alignedPrices.map((data) => data.priceB)
			);
			const correlation = calculateCorrelation(returnsA, returnsB);
			row.push(correlation);
		}
		correlationMatrix.push(row);
	}

	return correlationMatrix;
}

// Cholesky decomposition for symmetric positive-definite matrix
function choleskyDecomposition(correlationMatrix: number[][]) {
	const n = correlationMatrix.length;
	const L = Array.from({ length: n }, () => Array(n).fill(0));

	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			let sum = correlationMatrix[i][j];

			for (let k = 0; k < j; k++) {
				sum -= L[i][k] * L[j][k];
			}

			if (i === j) {
				L[i][j] = Math.sqrt(sum);
			} else {
				L[i][j] = sum / L[j][j];
			}
		}
	}

	return L;
}

function calculateCorrelatedRandom(choleskyMatrix: number[][]) {
	const n = choleskyMatrix.length;
	const random = Array(n)
		.fill(0)
		.map(() => gaussianRandom());
	const correlated: number[] = Array(n).fill(0);

	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let j = 0; j <= i; j++) {
			sum += choleskyMatrix[i][j] * random[j];
		}
		correlated[i] = sum;
	}

	return correlated;
}

export function runSimulation(
	assets: Asset[],
	numOfYears: number,
	numOfSimulation: number,
	initialValue = 10000,
	monthlySIPAmount = 0
) {
	const correlationMatrix = calculateCorrelationMatrix(assets);
	const choleskyMatrix = choleskyDecomposition(correlationMatrix);

	const timeSteps = numOfYears * TRADING_DAYS_PER_YEAR;

	const portfolioPaths: number[][] = [];

	for (let sim = 0; sim < numOfSimulation; sim++) {
		const assetsState = assets.map((asset) => {
			return {
				...asset,
				currentPrice: INITIAL_ASSET_PRICE,
				currentUnits:
					(initialValue * asset.weight) / INITIAL_ASSET_PRICE,
			};
		});

		const portfolioPath = [initialValue];

		for (let t = 0; t < timeSteps; t++) {
			const correlatedRandoms = calculateCorrelatedRandom(choleskyMatrix);

			const equityReturns = correlatedRandoms.map((random, i) => {
				// this is GBM drift adjusted
				return (
					Math.exp(
						assets[i].dailyAverageLogReturn -
							0.5 * assets[i].dailyVolatility ** 2 +
							assets[i].dailyVolatility * random
					) - 1
				);
			});

			for (let i = 0; i < assetsState.length; i++) {
				assetsState[i].currentPrice *= equityReturns[i] + 1;
			}

			// monthly sip
			const isMonthlySIPDay =
				monthlySIPAmount > 0 &&
				t % TRADING_DAYS_PER_MONTH === 0 &&
				t !== 0;

			if (isMonthlySIPDay) {
				for (let i = 0; i < assetsState.length; i++) {
					const amount = monthlySIPAmount * assetsState[i].weight;
					const price = assetsState[i].currentPrice;
					const units = amount / price;

					assetsState[i].currentUnits += units;
				}
			}

			const totalValue = assetsState.reduce(
				(acc, asset) => acc + asset.currentPrice * asset.currentUnits,
				0
			);

			portfolioPath.push(totalValue);
		}

		portfolioPaths.push(portfolioPath);
	}

	return portfolioPaths;
}

function calculatePercentile(
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

type ReturnStats = {
	average: number;
	median: number;
	p5: number;
	p95: number;
};

export function calculateAnnualPortfolioReturn(
	portfolioPaths: number[][]
): (ReturnStats & { stdDev: number })[] {
	const initialValue = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: (ReturnStats & { stdDev: number })[] = [];

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
	portfolioPaths: number[][]
): ReturnStats[] {
	const initialValue = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: ReturnStats[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const totalReturns: number[] = [];

		for (let sim = 0; sim < numSimulations; sim++) {
			const valueAtDay = portfolioPaths[sim][day];
			const totalReturn = valueAtDay / initialValue - 1;
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

type LossProbability = {
	nominal: number;
	real: number;
};

export function calculateProbabilityOfLoss(
	portfolioPaths: number[][],
	inflationRate: number
): LossProbability[] {
	const initialValue = portfolioPaths[0][0];
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const probabilitiesPerTime: LossProbability[] = [];

	for (
		let day = TRADING_DAYS_PER_YEAR;
		day < numDays;
		day += TRADING_DAYS_PER_YEAR
	) {
		const yearsPassed = day / TRADING_DAYS_PER_YEAR;
		const inflationAdjustedInitialValue =
			initialValue * (1 + inflationRate) ** yearsPassed;

		let nominalLossCount = 0;
		let realLossCount = 0;

		for (let sim = 0; sim < numSimulations; sim++) {
			const valueAtDay = portfolioPaths[sim][day];

			// Nominal loss: value < initial value
			if (valueAtDay < initialValue) {
				nominalLossCount++;
			}

			// Real loss (loss of purchasing power): value < inflation-adjusted initial value
			if (valueAtDay < inflationAdjustedInitialValue) {
				realLossCount++;
			}
		}

		const nominalProbability = nominalLossCount / numSimulations;
		const realProbability = realLossCount / numSimulations;

		probabilitiesPerTime.push({
			nominal: nominalProbability,
			real: realProbability,
		});
	}

	return probabilitiesPerTime;
}

type foo =
	| {
			value: number;
			recovered: true;
			duration: number;
			drawdown: number;
			year: number;
	  }
	| {
			value: number;
			recovered: false;
			duration: null;
			drawdown: number;
			year: number;
	  };

export function calculateMaxDrawdown(portfolioPaths: number[][]) {
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const results: foo[][] = [];

	for (let sim = 0; sim < numSimulations; sim++) {
		const simOne = portfolioPaths[sim];
		const milestones: foo[] = [];

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

	const statsPerYear = [];

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

// Worker message types
export type SimulationWorkerMessage = {
	assets: Asset[];
	numYears: number;
	numSimulations: number;
	inflationRate: number;
	initialAmount: number;
	monthlySIPAmount: number;
};

export type SimulationWorkerResponse = {
	simulationResults: number[][];
	annualReturns: ReturnType<typeof calculateAnnualPortfolioReturn>;
	portfolioReturns: ReturnType<typeof calculateTotalPortfolioReturn>;
	probabilityOfLoss: ReturnType<typeof calculateProbabilityOfLoss>;
	drawdownStats: ReturnType<typeof calculateMaxDrawdown>;
};

export type CashflowTD = {
	dayIndex: number; // 0,1,2,... representing trading days
	amount: number;
};

export function xirrTradingDays(
	cashflows: CashflowTD[],
	guess = 0.1,
	maxIterations = 100,
	tolerance = 1e-7
): number {
	if (cashflows.length < 2) {
		throw new Error('At least two cashflows are required.');
	}

	// Sort by dayIndex
	cashflows = [...cashflows].sort((a, b) => a.dayIndex - b.dayIndex);

	const d0 = cashflows[0].dayIndex;

	const f = (r: number) =>
		cashflows.reduce((sum, cf) => {
			const t = (cf.dayIndex - d0) / 252; // time in years
			return sum + cf.amount / Math.pow(1 + r, t);
		}, 0);

	const fPrime = (r: number) =>
		cashflows.reduce((sum, cf) => {
			const t = (cf.dayIndex - d0) / 252;
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
): CashflowTD[] {
	const cashflows: CashflowTD[] = [];
	const numMonths = simulation.length / TRADING_DAYS_PER_MONTH;

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
				dayIndex: dayIndex + 1,
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
	initialAmount: number,
	monthlySIPAmount: number
): (ReturnStats & { stdDev: number })[] {
	const numSimulations = portfolioPaths.length;
	const numDays = portfolioPaths[0].length;

	const statsPerTime: (ReturnStats & { stdDev: number })[] = [];

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
			const cashflows: CashflowTD[] = [];
			const numMonths = Math.floor(day / TRADING_DAYS_PER_MONTH);

			// Initial investment at day 0
			cashflows.push({
				dayIndex: 0,
				amount: -initialAmount,
			});

			// Monthly SIP investments up to this time point
			for (let i = 1; i <= numMonths; i++) {
				const sipDayIndex = i * TRADING_DAYS_PER_MONTH;

				if (sipDayIndex <= day) {
					cashflows.push({
						dayIndex: sipDayIndex,
						amount: -monthlySIPAmount,
					});
				}
			}

			// Final value at this time point
			cashflows.push({
				dayIndex: day,
				amount: simulationSlice[day],
			});

			// Calculate XIRR for this simulation at this time point
			try {
				const xirr = xirrTradingDays(cashflows);
				xirrValues.push(xirr);
			} catch (error) {
				// Skip invalid XIRR calculations
				console.warn('XIRR calculation failed:', error);
			}
		}

		if (xirrValues.length === 0) continue;

		// Sort for percentile calculations
		const sortedXirr = [...xirrValues].sort((a, b) => a - b);

		const average =
			xirrValues.reduce((acc, ret) => acc + ret, 0) / xirrValues.length;
		const median = calculatePercentile(sortedXirr, 50);
		const p5 = calculatePercentile(sortedXirr, 5);
		const p95 = calculatePercentile(sortedXirr, 95);

		const variance =
			xirrValues.reduce((acc, r) => acc + (r - average) ** 2, 0) /
			xirrValues.length;
		const stdDev = Math.sqrt(variance);

		statsPerTime.push({ average, median, p5, p95, stdDev });
	}

	return statsPerTime;
}
