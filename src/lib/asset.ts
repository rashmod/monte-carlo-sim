import {
	calculateAnnualizedLogReturn,
	calculateAnnualizedSimpleReturn,
	calculateAnnualizedLogVolatility,
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

	const dailyMeanLogReturn = calculateMean(dailyLogReturns);
	const dailyMeanSimpleReturn = calculateMean(dailySimpleReturns);
	const dailyLogReturnVolatility = calculateVolatility(dailyLogReturns);

	const annualizedLogReturn =
		calculateAnnualizedLogReturn(dailyMeanLogReturn);
	const annualizedSimpleReturn = calculateAnnualizedSimpleReturn(
		dailyMeanSimpleReturn
	);
	const annualizedLogReturnVolatility = calculateAnnualizedLogVolatility(
		dailyLogReturnVolatility
	);

	return {
		name,
		weight,
		rawHistoricalData: historicalData,
		historicalData: cleanedHistoricalData,
		dailyLogReturns,
		dailySimpleReturns,
		dailyMeanLogReturn,
		dailyLogReturnVolatility,
		annualizedLogReturn,
		annualizedSimpleReturn,
		annualizedLogReturnVolatility,
	};
}

