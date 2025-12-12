import {
	INITIAL_ASSET_PRICE,
	TRADING_DAYS_PER_MONTH,
	TRADING_DAYS_PER_YEAR,
} from './constants';
import {
	generateCorrelatedRandom,
	calculateCorrelationMatrix,
	choleskyDecomposition,
} from './matrix';
import type { Asset } from './types';

export function runSimulation(
	assets: Asset[],
	numOfYears: number,
	numOfSimulation: number,
	initialValue = 10000,
	monthlySIPAmount = 0
) {
	const correlationMatrix = calculateCorrelationMatrix(assets);
	const choleskyMatrix = choleskyDecomposition(correlationMatrix);

	const timeSteps = numOfYears * TRADING_DAYS_PER_YEAR;

	const portfolioPaths: number[][] = [];

	for (let sim = 0; sim < numOfSimulation; sim++) {
		const assetsState = assets.map((asset) => {
			return {
				...asset,
				currentPrice: INITIAL_ASSET_PRICE,
				currentUnits:
					(initialValue * asset.weight) / INITIAL_ASSET_PRICE,
			};
		});

		const portfolioPath = [initialValue];

		for (let t = 0; t < timeSteps; t++) {
			const correlatedRandoms = generateCorrelatedRandom(choleskyMatrix);

			const equityReturns = correlatedRandoms.map((random, i) => {
				// GBM drift-adjusted daily log return -> converted to simple return
				return (
					Math.exp(
						assets[i].dailyMeanLogReturn -
							0.5 * assets[i].dailyLogReturnVolatility ** 2 +
							assets[i].dailyLogReturnVolatility * random
					) - 1
				);
			});

			for (let i = 0; i < assetsState.length; i++) {
				assetsState[i].currentPrice *= equityReturns[i] + 1;
			}

			// monthly sip
			const isMonthlySIPDay =
				monthlySIPAmount > 0 &&
				t % TRADING_DAYS_PER_MONTH === 0 &&
				t !== 0;

			if (isMonthlySIPDay) {
				for (let i = 0; i < assetsState.length; i++) {
					const amount = monthlySIPAmount * assetsState[i].weight;
					const price = assetsState[i].currentPrice;
					const units = amount / price;

					assetsState[i].currentUnits += units;
				}
			}

			const totalValue = assetsState.reduce(
				(acc, asset) => acc + asset.currentPrice * asset.currentUnits,
				0
			);

			portfolioPath.push(totalValue);
		}

		portfolioPaths.push(portfolioPath);
	}

	return portfolioPaths;
}
