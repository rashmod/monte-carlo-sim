export type HistoricalData = {
	date: Date;
	price: number;
};

export type Asset = {
	name: string;
	weight: number;
	rawHistoricalData: string;
	historicalData: HistoricalData[];
	dailyReturns: number[];
	annualExpectedReturn: number;
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

function calculateDailyReturns(historicalData: HistoricalData[]) {
	const dailyReturns = historicalData.map((data, index) => {
		if (index === 0) return 0;
		return (
			(data.price - historicalData[index - 1].price) /
			historicalData[index - 1].price
		);
	});

	return dailyReturns;
}

function calculateAnnualExpectedReturn(dailyReturns: number[]) {
	const averageDailyReturn =
		dailyReturns.reduce((acc, ret) => acc + ret, 0) / dailyReturns.length;
	return (1 + averageDailyReturn) ** 252 - 1;
}

function calculateAnnualVolatility(dailyReturns: number[]) {
	const averageDailyReturn =
		dailyReturns.reduce((acc, ret) => acc + ret, 0) / dailyReturns.length;
	const variance =
		dailyReturns.reduce(
			(acc, ret) => acc + (ret - averageDailyReturn) ** 2,
			0
		) /
		(dailyReturns.length - 1);

	return Math.sqrt(variance) * Math.sqrt(252);
}

export function generateAsset(
	name: string,
	weight: number,
	historicalData: string
): Asset {
	const cleanedHistoricalData = cleanHistoricalData(historicalData);
	const dailyReturns = calculateDailyReturns(cleanedHistoricalData);
	const annualExpectedReturn = calculateAnnualExpectedReturn(dailyReturns);
	const annualVolatility = calculateAnnualVolatility(dailyReturns);

	return {
		name,
		weight,
		rawHistoricalData: historicalData,
		historicalData: cleanedHistoricalData,
		dailyReturns,
		annualExpectedReturn,
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

function normalRandomWithMeanStd(mean: number, std: number) {
	return mean + std * gaussianRandom();
}

export function monteCarloSimulation(
	assets: Asset[],
	numSimulations: number,
	numYears: number
) {
	const simulationResults = [];
	for (let i = 0; i < numSimulations; i++) {
		const simulation = [];

		for (let j = 0; j < numYears; j++) {
			let value = 0;
			for (let k = 0; k < assets.length; k++) {
				value +=
					assets[k].weight *
					normalRandomWithMeanStd(
						assets[k].annualExpectedReturn,
						assets[k].annualVolatility
					);
			}
			simulation.push(value);
		}

		simulationResults.push(simulation);
	}

	return simulationResults;
}
