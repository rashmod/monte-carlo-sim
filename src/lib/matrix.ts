import { calculateDailyLogReturns } from './returns';
import { gaussianRandom } from './random';
import type { Asset, HistoricalData } from './types';

function dayKey(date: Date) {
	return (
		date.getFullYear() +
		'-' +
		String(date.getMonth() + 1).padStart(2, '0') +
		'-' +
		String(date.getDate()).padStart(2, '0')
	);
}

// ? TODO handle duplicate dates
export function alignPrices(
	assetA: HistoricalData[],
	assetB: HistoricalData[]
) {
	let i = 0,
		j = 0;
	const aligned = [];

	while (i < assetA.length && j < assetB.length) {
		const dayA = dayKey(assetA[i].date);
		const dayB = dayKey(assetB[j].date);

		if (dayA === dayB) {
			aligned.push({
				date: assetA[i].date, // keep one reference
				priceA: assetA[i].price,
				priceB: assetB[j].price,
			});
			i++;
			j++;
		} else if (dayA < dayB) {
			i++;
		} else {
			j++;
		}
	}

	return aligned;
}

export function calculateCorrelation(x: number[], y: number[]) {
	const n = x.length;
	if (n !== y.length) throw new Error('Arrays must have the same length');
	if (n <= 1) throw new Error('Arrays must have at least two elements');

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

	if (denomX === 0 || denomY === 0) return 0;

	return numerator / Math.sqrt(denomX * denomY);
}

export function calculateCorrelationMatrix(assets: Asset[]) {
	const correlationMatrix = [];

	for (let i = 0; i < assets.length; i++) {
		const row = [];

		for (let j = 0; j < assets.length; j++) {
			const alignedPrices = alignPrices(
				assets[i].historicalData.data,
				assets[j].historicalData.data
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

	const isSquare = correlationMatrix.every((row) => row.length === n);
	if (!isSquare) {
		throw new Error('Matrix must be square');
	}

	const L = Array.from({ length: n }, () => Array(n).fill(0));

	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			let sum = correlationMatrix[i][j];

			for (let k = 0; k < j; k++) {
				sum -= L[i][k] * L[j][k];
			}

			if (i === j) {
				if (sum <= 0) {
					throw new Error('Matrix is not positive-definite');
				}
				L[i][j] = Math.sqrt(sum);
			} else {
				L[i][j] = sum / L[j][j];
			}
		}
	}

	return L;
}

export function generateCorrelatedRandom(choleskyMatrix: number[][]) {
	const n = choleskyMatrix.length;
	const random = Array.from({ length: n }, () => gaussianRandom());
	const correlated = Array(n).fill(0);

	for (let i = 0; i < n; i++) {
		let sum = 0;
		for (let j = 0; j <= i; j++) {
			sum += choleskyMatrix[i][j] * random[j];
		}
		correlated[i] = sum;
	}

	return correlated;
}
