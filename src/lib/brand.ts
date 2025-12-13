import type { HistoricalData } from './types';

type Brand<T, Name extends string> = T & { readonly __brand: Name };

type ValidNumber = Brand<number, 'ValidNumber'>;
export function asValidNumber(value: number): ValidNumber {
	if (isNaN(value)) {
		throw new Error('Value is not a number');
	}
	if (!Number.isFinite(value)) {
		throw new Error('Value is not a finite number');
	}

	return value as ValidNumber;
}

type PositiveNumber = Brand<number, 'PositiveNumber'>;
export function asPositiveNumber(value: number): PositiveNumber {
	const validNumber = asValidNumber(value);
	if (validNumber <= 0) {
		throw new Error('Value must be greater than 0');
	}
	return value as PositiveNumber;
}

type NonNegativeNumber = Brand<number, 'NonNegativeNumber'>;
export function asNonNegativeNumber(value: number): NonNegativeNumber {
	const validNumber = asValidNumber(value);
	if (validNumber < 0) {
		throw new Error('Value must be greater than or equal to 0');
	}
	return value as NonNegativeNumber;
}

export type AssetWeight = Brand<number, 'AssetWeight'>;
export function asAssetWeight(value: number): AssetWeight {
	const nonNegativeNumber = asNonNegativeNumber(value);
	if (nonNegativeNumber > 1) {
		throw new Error('Value must be less than or equal to 1');
	}
	return value as AssetWeight;
}

export type PriceSeries = Brand<HistoricalData[], 'PriceSeries'>;
export function asPriceSeries(value: HistoricalData[]): PriceSeries {
	if (value.length < 2) {
		throw new Error('Value must be an array of at least 2 HistoricalData');
	}

	for (const data of value) {
		asPositiveNumber(data.price);
		asValidNumber(data.date.getTime());
	}

	return value as PriceSeries;
}

export type LogReturnSeries = Brand<number[], 'LogReturnSeries'>;
export function asLogReturnSeries(value: number[]): LogReturnSeries {
	if (value.length < 2) {
		throw new Error('Value must be an array of at least 2 log returns');
	}

	for (const logReturn of value) {
		asValidNumber(logReturn);
	}

	return value as LogReturnSeries;
}

export type SimpleReturnSeries = Brand<number[], 'SimpleReturnSeries'>;
export function asSimpleReturnSeries(value: number[]): SimpleReturnSeries {
	if (value.length < 2) {
		throw new Error('Value must be an array of at least 2 simple returns');
	}

	for (const simpleReturn of value) {
		asValidNumber(simpleReturn);
	}

	return value as SimpleReturnSeries;
}

export type MeanLogReturn = Brand<number, 'MeanLogReturn'>;
export function asMeanLogReturn(value: number): MeanLogReturn {
	asValidNumber(value);
	return value as MeanLogReturn;
}

export type MeanSimpleReturn = Brand<number, 'MeanSimpleReturn'>;
export function asMeanSimpleReturn(value: number): MeanSimpleReturn {
	asValidNumber(value);
	return value as MeanSimpleReturn;
}

export type LogReturnVolatility = Brand<number, 'LogReturnVolatility'>;
export function asLogReturnVolatility(value: number): LogReturnVolatility {
	asValidNumber(value);
	return value as LogReturnVolatility;
}

export type AnnualizedLogReturn = Brand<number, 'AnnualizedLogReturn'>;
export function asAnnualizedLogReturn(value: number): AnnualizedLogReturn {
	asValidNumber(value);
	return value as AnnualizedLogReturn;
}

export type AnnualizedSimpleReturn = Brand<number, 'AnnualizedSimpleReturn'>;
export function asAnnualizedSimpleReturn(
	value: number
): AnnualizedSimpleReturn {
	asValidNumber(value);
	return value as AnnualizedSimpleReturn;
}
