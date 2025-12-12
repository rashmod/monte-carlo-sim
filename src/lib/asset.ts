import {
	calculateAnnualLogReturns,
	calculateAnnualSimpleReturns,
	calculateAnnualVolatility,
	calculateDailyLogReturns,
	calculateDailySimpleReturns,
} from './returns';
import { calculateMean, calculateVolatility } from './stats';
import type { Asset, HistoricalData } from './types';

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

