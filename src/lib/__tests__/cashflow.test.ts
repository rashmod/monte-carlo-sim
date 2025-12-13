import { describe, it, expect } from 'vitest';
import {
	calculateXirr,
	calculateXIRRStats,
	generateCashflowArray,
	TRADING_DAYS_PER_MONTH,
	TRADING_DAYS_PER_YEAR,
} from '../../lib';

describe('generateCashflowArray', () => {
	it('generates cashflow array', () => {
		const simulation = new Array(TRADING_DAYS_PER_YEAR).fill(100);
		const monthlySIPAmount = 200;
		const cashflowArray = generateCashflowArray(
			simulation,
			monthlySIPAmount
		);
		expect(cashflowArray).toHaveLength(
			TRADING_DAYS_PER_YEAR / TRADING_DAYS_PER_MONTH + 1
		);
	});

	it('correct cashflow days', () => {
		const simulation = new Array(TRADING_DAYS_PER_YEAR + 1).fill(100);
		const monthlySIPAmount = 200;
		const cashflowArray = generateCashflowArray(
			simulation,
			monthlySIPAmount
		);
		for (
			let i = 1;
			i < TRADING_DAYS_PER_YEAR / TRADING_DAYS_PER_MONTH;
			i++
		) {
			expect(cashflowArray[i].dayIndex).toBe(i * TRADING_DAYS_PER_MONTH);
		}
		expect(cashflowArray[cashflowArray.length - 1].dayIndex).toBe(
			TRADING_DAYS_PER_YEAR
		);
	});

	it('partial month', () => {
		const simulation = new Array(TRADING_DAYS_PER_MONTH + 10).fill(100);
		const monthlySIPAmount = 200;
		const cashflowArray = generateCashflowArray(
			simulation,
			monthlySIPAmount
		);
		expect(cashflowArray).toHaveLength(3);
	});
});

describe('calculateXirr', () => {
	it('calculates xirr', () => {
		const cashflows = [
			{ dayIndex: 0, amount: -1000 },
			{ dayIndex: 252, amount: 1500 },
		];
		const xirr = calculateXirr(cashflows);
		expect(xirr).toBe(0.5);
	});

	it('calculates xirr with monthly SIP', () => {
		const cashflows = [
			{ dayIndex: 0, amount: -1000 },
			{ dayIndex: 21, amount: -1000 },
			{ dayIndex: 42, amount: -1000 },
			{ dayIndex: 252, amount: 5000 },
		];
		const xirr = calculateXirr(cashflows);
		expect(xirr).toBeCloseTo(0.74452524914, 10);
	});

	it('zero returns', () => {
		const cashflows = [
			{ dayIndex: 0, amount: -1000 },
			{ dayIndex: 252, amount: 1000 },
		];
		const xirr = calculateXirr(cashflows);
		expect(xirr).toBeCloseTo(0, 10);
	});
});
