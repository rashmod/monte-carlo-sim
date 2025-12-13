import {
	calculateDrawdownStats,
	calculateGeometricAnnualPortfolioReturn,
	calculateProbabilityOfLoss,
	calculateSharpeRatioStats,
	calculateSimpleTotalPortfolioReturn,
	calculateXIRRStats,
	runSimulation,
	type SimulationWorkerMessage,
	type SimulationWorkerResponse,
} from './lib';

export {};

self.onmessage = (e: MessageEvent<SimulationWorkerMessage>) => {
	const {
		assets,
		numYears,
		numSimulations,
		initialAmount,
		monthlySIPAmount,
		inflationRate,
	} = e.data;

	if (numYears < 1) {
		throw new Error('Number of years must be greater than 1');
	}
	if (numSimulations < 1) {
		throw new Error('Number of simulations must be greater than 1');
	}
	if (initialAmount < 1) {
		throw new Error('Initial amount must be greater than 1');
	}
	if (monthlySIPAmount < 0) {
		throw new Error(
			'Monthly SIP amount must be greater than or equal to 0'
		);
	}
	if (inflationRate < 0) {
		throw new Error('Inflation rate must be greater than or equal to 0');
	}

	const sim = runSimulation(
		assets,
		numYears,
		numSimulations,
		initialAmount,
		monthlySIPAmount
	);

	const annual =
		monthlySIPAmount === 0
			? calculateGeometricAnnualPortfolioReturn(sim)
			: calculateXIRRStats(sim, monthlySIPAmount);
	const portfolio = calculateSimpleTotalPortfolioReturn(
		sim,
		monthlySIPAmount
	);
	const probLoss = calculateProbabilityOfLoss(
		sim,
		inflationRate,
		monthlySIPAmount
	);
	const drawdown = calculateDrawdownStats(sim);
	const sharpe = calculateSharpeRatioStats(sim);

	const response: SimulationWorkerResponse = {
		simulationResults: sim,
		annualReturns: annual,
		portfolioReturns: portfolio,
		probabilityOfLoss: probLoss,
		drawdownStats: drawdown,
		sharpeStats: sharpe,
	};

	self.postMessage(response);
};
