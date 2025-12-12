import { describe, it, expect } from 'vitest';
import { cleanHistoricalData, generateAsset } from '../../lib';

describe('Asset', () => {
	describe('Clean Historical Data', () => {
		it('parses clean, well-formatted data with no errors', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/2/2024 15:30:00'),
					price: 105,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toHaveLength(0);
		});

		it('trims and parses data with varying whitespace and tab spacing', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00    	105
1/3/2024 15:30:00     	110
1/4/2024 15:30:00	    100
1/5/2024 15:30:00	    105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/2/2024 15:30:00'),
					price: 105,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toHaveLength(0);
		});

		it('ignores blank lines and parses data with empty rows', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105


1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/2/2024 15:30:00'),
					price: 105,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toHaveLength(0);
		});

		it('skips rows with invalid dates and collects error messages', () => {
			const historicalData = `1/1/2024 15:30:00	100
21/22/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toEqual([
				'Invalid date: 21/22/2024 15:30:00',
			]);
		});

		it('skips rows with non-numeric prices and collects error messages', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	abc
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toEqual([
				'Invalid price: abc',
			]);
		});

		it('missing price is skipped', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toEqual(['Invalid price: ']);
		});

		it('missing date is skipped', () => {
			const historicalData = `1/1/2024 15:30:00	100
 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toEqual([
				'Invalid date: 15:30:00',
			]);
		});

		it('malformed timestamp is ignored', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 abc	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/2/2024'),
					price: 105,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toHaveLength(0);
		});

		it('missing timestamp is ignored', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const cleanedHistoricalData = cleanHistoricalData(historicalData);
			const expectedHistoricalData = [
				{
					date: new Date('1/1/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/2/2024'),
					price: 105,
				},
				{
					date: new Date('1/3/2024 15:30:00'),
					price: 110,
				},
				{
					date: new Date('1/4/2024 15:30:00'),
					price: 100,
				},
				{
					date: new Date('1/5/2024 15:30:00'),
					price: 105,
				},
			];
			expect(cleanedHistoricalData.data).toEqual(expectedHistoricalData);
			expect(cleanedHistoricalData.errors).toHaveLength(0);
		});

		it('empty historical data throws an error', () => {
			const historicalData = '';
			expect(() => cleanHistoricalData(historicalData)).toThrow(
				'Historical data is empty'
			);
		});
	});

	describe('Generate Asset', () => {
		it('creates Asset with 5 historical price points and correct returns', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(5);
			expect(asset.dailyLogReturns).toHaveLength(4);
			expect(asset.dailySimpleReturns).toHaveLength(4);
		});

		it('throws if only one row of historical data is provided', () => {
			const historicalData = `1/1/2024 15:30:00	100`;
			const name = 'Test Asset';
			const weight = 1;

			expect(() => generateAsset(name, weight, historicalData)).toThrow();
		});

		it('throws if historical data is empty', () => {
			const historicalData = ``;
			const name = 'Test Asset';
			const weight = 1;

			expect(() => generateAsset(name, weight, historicalData)).toThrow();
		});

		it('throws if name is missing', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = '';
			const weight = 1;
			expect(() => generateAsset(name, weight, historicalData)).toThrow(
				'Name is required'
			);
		});

		it('throws if weight is less than 0', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = -1.1;
			expect(() => generateAsset(name, weight, historicalData)).toThrow(
				'Weight must be between 0 and 1'
			);
		});

		it('throws if weight is greater than 1', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1.1;
			expect(() => generateAsset(name, weight, historicalData)).toThrow(
				'Weight must be between 0 and 1'
			);
		});

		it('creates Asset and parses price if time is missing after date', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(5);
			expect(asset.dailyLogReturns).toHaveLength(4);
			expect(asset.dailySimpleReturns).toHaveLength(4);
		});

		it('creates Asset but skips row with missing price', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(4);
			expect(asset.historicalData.errors).toHaveLength(1);
			expect(asset.dailyLogReturns).toHaveLength(3);
			expect(asset.dailySimpleReturns).toHaveLength(3);
		});

		it('creates Asset but skips row with invalid price', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 15:30:00	abc
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(4);
			expect(asset.historicalData.errors).toHaveLength(1);
			expect(asset.dailyLogReturns).toHaveLength(3);
			expect(asset.dailySimpleReturns).toHaveLength(3);
		});

		it('creates Asset but ignores missing timestamp', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(5);
			expect(asset.historicalData.errors).toHaveLength(0);
			expect(asset.dailyLogReturns).toHaveLength(4);
			expect(asset.dailySimpleReturns).toHaveLength(4);
		});

		it('creates Asset but ignores malformed timestamp', () => {
			const historicalData = `1/1/2024 15:30:00	100
1/2/2024 abc	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(5);
			expect(asset.historicalData.errors).toHaveLength(0);
			expect(asset.dailyLogReturns).toHaveLength(4);
			expect(asset.dailySimpleReturns).toHaveLength(4);
		});

		it('creates Asset but skips row with missing date', () => {
			const historicalData = `1/1/2024 15:30:00	100
15:30:00	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(4);
			expect(asset.historicalData.errors).toHaveLength(1);
			expect(asset.dailyLogReturns).toHaveLength(3);
			expect(asset.dailySimpleReturns).toHaveLength(3);
		});

		it('creates Asset but skips row with invalid date', () => {
			const historicalData = `1/1/2024 15:30:00	100
abc	105
1/3/2024 15:30:00	110
1/4/2024 15:30:00	100
1/5/2024 15:30:00	105`;
			const name = 'Test Asset';
			const weight = 1;

			const asset = generateAsset(name, weight, historicalData);
			expect(asset.name).toEqual(name);
			expect(asset.weight).toEqual(weight);
			expect(asset.rawHistoricalData).toEqual(historicalData);
			expect(asset.historicalData.data).toHaveLength(4);
			expect(asset.historicalData.errors).toHaveLength(1);
			expect(asset.dailyLogReturns).toHaveLength(3);
			expect(asset.dailySimpleReturns).toHaveLength(3);
		});
	});
});
