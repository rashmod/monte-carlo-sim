import { calculateDailyLogReturns } from './returns';
import { gaussianRandom } from './random';
import type { Asset, HistoricalData } from './types';

function alignPrices(assetA: HistoricalData[], assetB: HistoricalData[]) {
	const mapA = new Map(
		assetA.map((data) => [
			data.date.toISOString().split('T')[0],
			{ date: data.date, price: data.price },
		])
	);
	const mapB = new Map(
		assetB.map((data) => [
			data.date.toISOString().split('T')[0],
			{ date: data.date, price: data.price },
		])
	);

	const commonTimestamps = [...mapA.keys()].filter((timestamp) =>
		mapB.has(timestamp)
	);

	const alignedPrices = commonTimestamps.map((timestamp) => {
		const dataA = mapA.get(timestamp);
		const dataB = mapB.get(timestamp);
		if (!dataA || !dataB) throw new Error('Price data not found');

		return { date: dataA.date, priceA: dataA.price, priceB: dataB.price };
	});

	return alignedPrices;
}

function calculateCorrelation(x: number[], y: number[]) {
	const n = x.length;
	if (n !== y.length || n === 0) throw new Error('Invalid input lengths');

	const meanX = x.reduce((a, b) => a + b, 0) / n;
	const meanY = y.reduce((a, b) => a + b, 0) / n;

	let numerator = 0;
	let denomX = 0;
	let denomY = 0;

	for (let i = 0; i < n; i++) {
		const dx = x[i] - meanX;
		const dy = y[i] - meanY;
		numerator += dx * dy;
		denomX += dx * dx;
		denomY += dy * dy;
	}

	return numerator / Math.sqrt(denomX * denomY);
}

export function calculateCorrelationMatrix(assets: Asset[]) {
	const correlationMatrix = [];

	for (let i = 0; i < assets.length; i++) {
		const row = [];
		for (let j = 0; j < assets.length; j++) {
			const alignedPrices = alignPrices(
				assets[i].historicalData,
				assets[j].historicalData
			);

			const returnsA = calculateDailyLogReturns(
				alignedPrices.map((data) => data.priceA)
			);
			const returnsB = calculateDailyLogReturns(
				alignedPrices.map((data) => data.priceB)
			);
			const correlation = calculateCorrelation(returnsA, returnsB);
			row.push(correlation);
		}
		correlationMatrix.push(row);
	}

	return correlationMatrix;
}

// Cholesky decomposition for symmetric positive-definite matrix
export function choleskyDecomposition(correlationMatrix: number[][]) {
	const n = correlationMatrix.length;
	const L = Array.from({ length: n }, () => Array(n).fill(0));

	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			let sum = correlationMatrix[i][j];

			for (let k = 0; k < j; k++) {
				sum -= L[i][k] * L[j][k];
			}

			if (i === j) {
				L[i][j] = Math.sqrt(sum);
			} else {
				L[i][j] = sum / L[j][j];
			}
		}
	}

	return L;
}

export function calculateCorrelatedRandom(choleskyMatrix: number[][]) {
	const n = choleskyMatrix.length;
	const random = Array(n)
		.fill(0)
		.map(() => gaussianRandom());
	const correlated: number[] = Array(n).fill(0);

	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let j = 0; j <= i; j++) {
			sum += choleskyMatrix[i][j] * random[j];
		}
		correlated[i] = sum;
	}

	return correlated;
}

