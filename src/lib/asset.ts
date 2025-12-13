import {
	calculateAnnualizedLogReturn,
	calculateAnnualizedSimpleReturn,
	calculateAnnualizedLogVolatility,
	calculateDailyLogReturns,
	calculateDailySimpleReturns,
} from './returns';
import { calculateMean, calculateVolatility } from './stats';
import type { Asset } from './types';

export function cleanHistoricalData(historicalData: string) {
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

	const data = cleanup.filter((data) => typeof data !== 'string');
	if (data.length < 3) {
		throw new Error('At least three data points are required');
	}
	for (const dataPoint of data) {
		if (isNaN(dataPoint.price)) {
			throw new Error('Price is not a number');
		}
		if (!Number.isFinite(dataPoint.price)) {
			throw new Error('Price is not a finite number');
		}
		if (dataPoint.price <= 0) {
			throw new Error('Price is not a positive number');
		}
		if (isNaN(dataPoint.date.getTime())) {
			throw new Error('Date is not a number');
		}
	}

	return {
		data,
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

	if (isNaN(weight)) {
		throw new Error('Weight is not a number');
	}
	if (!Number.isFinite(weight)) {
		throw new Error('Weight is not a finite number');
	}
	if (weight < 0) {
		throw new Error('Weight is not a positive number');
	}
	if (weight > 1) {
		throw new Error('Weight is not a less than or equal to 1');
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
