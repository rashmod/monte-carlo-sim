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

export function cleanHistoricalData(historicalData: string): HistoricalData[] {
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

export function calculateDailyReturns(historicalData: HistoricalData[]) {
	const dailyReturns = historicalData.map((data, index) => {
		if (index === 0) return 0;
		return (
			(data.price - historicalData[index - 1].price) /
			historicalData[index - 1].price
		);
	});

	return dailyReturns;
}

export function calculateAnnualExpectedReturn(dailyReturns: number[]) {
	const averageDailyReturn =
		dailyReturns.reduce((acc, ret) => acc + ret, 0) / dailyReturns.length;
	return (1 + averageDailyReturn) ** 252 - 1;
}

export function calculateAnnualVolatility(dailyReturns: number[]) {
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
