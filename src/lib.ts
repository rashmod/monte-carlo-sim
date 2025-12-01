const TRADING_DAYS_PER_YEAR = 252;

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
	numOfSimulation: number
) {
	const correlationMatrix = calculateCorrelationMatrix(assets);
	const choleskyMatrix = choleskyDecomposition(correlationMatrix);

	const timeSteps = numOfYears * TRADING_DAYS_PER_YEAR;

	const initialValue = 10000;
	const portfolioPaths: number[][] = [];

	for (let sim = 0; sim < numOfSimulation; sim++) {
		const assetsWithInitialValue = assets.map((asset) => ({
			...asset,
			currentValue: initialValue * asset.weight,
		}));

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

			for (let i = 0; i < assets.length; i++) {
				assetsWithInitialValue[i].currentValue *= equityReturns[i] + 1;
			}

			portfolioPath.push(
				assetsWithInitialValue.reduce(
					(acc, asset) => acc + asset.currentValue,
					0
				)
			);
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

		statsPerTime.push({ average, median, p5, p95 });
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
