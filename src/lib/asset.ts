import {
	asAssetWeight,
	asLogReturnVolatility,
	asMeanLogReturn,
	asMeanSimpleReturn,
	asPriceSeries,
} from './brand';
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

	return {
		data: asPriceSeries(cleanup.filter((data) => typeof data !== 'string')),
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
	const assetWeight = asAssetWeight(weight);

	const cleanedHistoricalData = cleanHistoricalData(historicalData);
	const dailyLogReturns = calculateDailyLogReturns(
		cleanedHistoricalData.data
	);
	const dailySimpleReturns = calculateDailySimpleReturns(
		cleanedHistoricalData.data
	);

	const dailyMeanLogReturn = asMeanLogReturn(calculateMean(dailyLogReturns));
	const dailyMeanSimpleReturn = asMeanSimpleReturn(
		calculateMean(dailySimpleReturns)
	);
	const dailyLogReturnVolatility = asLogReturnVolatility(
		calculateVolatility(dailyLogReturns)
	);

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
		weight: assetWeight,
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
