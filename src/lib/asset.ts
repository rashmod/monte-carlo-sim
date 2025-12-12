import {
	calculateAnnualizedLogReturn,
	calculateAnnualizedSimpleReturn,
	calculateAnnualizedLogVolatility,
	calculateDailyLogReturns,
	calculateDailySimpleReturns,
} from './returns';
import { calculateMean, calculateVolatility } from './stats';
import type { Asset, HistoricalData } from './types';

export function cleanHistoricalData(historicalData: string): {
	data: HistoricalData[];
	errors: string[];
} {
	if (historicalData.trim() === '') {
		throw new Error('Historical data is empty');
	}

	const cleanup = historicalData
		.trim()
		.split('\n')
		.filter((line) => line.trim() !== '')
		.map((line) => line.split('\t').map((w) => w.trim()))
		.map(([date, price]) => {
			let dateObj = new Date(date);
			if (isNaN(dateObj.getTime())) {
				dateObj = new Date(date.split(' ')[0]);
				if (isNaN(dateObj.getTime())) {
					return `Invalid date: ${date}`;
				}
			}
			if (price === undefined || price === '' || isNaN(Number(price))) {
				return `Invalid price: ${price}`;
			}

			return { date: dateObj, price: Number(price) };
		});

	return {
		data: cleanup.filter((data) => typeof data === 'object'),
		errors: cleanup.filter((data) => typeof data === 'string'),
	};
}

export function generateAsset(
	name: string,
	weight: number,
	historicalData: string
): Asset {
	if (name.trim() === '') {
		throw new Error('Name is required');
	}
	if (weight <= 0 || weight > 1) {
		throw new Error('Weight must be between 0 and 1');
	}

	const cleanedHistoricalData = cleanHistoricalData(historicalData);
	const dailyLogReturns = calculateDailyLogReturns(
		cleanedHistoricalData.data.map((data) => data.price)
	);
	const dailySimpleReturns = calculateDailySimpleReturns(
		cleanedHistoricalData.data.map((data) => data.price)
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
