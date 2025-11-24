export type HistoricalData = {
	date: Date;
	price: number;
};

export type Asset = {
	name: string;
	weight: number;
	rawHistoricalData: string;
	historicalData: HistoricalData[]; // daily
	dailyReturns: number[];
	dailyAverageReturn: number;
	dailyVolatility: number;
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

function calculateDailyReturns(prices: number[]) {
	const dailyReturns = [];

	for (let i = 1; i < prices.length; i++) {
		dailyReturns.push(Math.log(prices[i] / prices[i - 1]));
	}
	return dailyReturns;
}

export function generateAsset(
	name: string,
	weight: number,
	historicalData: string
): Asset {
	const cleanedHistoricalData = cleanHistoricalData(historicalData);
	const dailyReturns = calculateDailyReturns(
		cleanedHistoricalData.map((data) => data.price)
	);

	const dailyAverageReturn = calculateMean(dailyReturns);
	const dailyVolatility = calculateVolatility(dailyReturns);

	return {
		name,
		weight,
		rawHistoricalData: historicalData,
		historicalData: cleanedHistoricalData,
		dailyReturns,
		dailyAverageReturn,
		dailyVolatility,
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

			const returnsA = calculateDailyReturns(
				alignedPrices.map((data) => data.priceA)
			);
			const returnsB = calculateDailyReturns(
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

	const TRADING_DAYS_PER_YEAR = 252;
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
						assets[i].dailyAverageReturn -
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
