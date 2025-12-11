import {
	calculateAnnualPortfolioReturn,
	calculateMaxDrawdown,
	calculateProbabilityOfLoss,
	calculateTotalPortfolioReturn,
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
		inflationRate,
		initialAmount,
		monthlySIPAmount,
	} = e.data;

	const sim = runSimulation(
		assets,
		numYears,
		numSimulations,
		initialAmount,
		monthlySIPAmount
	);

	const annual =
		monthlySIPAmount === 0
			? calculateAnnualPortfolioReturn(sim)
			: calculateXIRRStats(sim, initialAmount, monthlySIPAmount);
	const portfolio = calculateTotalPortfolioReturn(
		sim,
		initialAmount,
		monthlySIPAmount
	);
	const probLoss = calculateProbabilityOfLoss(
		sim,
		inflationRate,
		initialAmount,
		monthlySIPAmount
	);
	const drawdown = calculateMaxDrawdown(sim);

	const response: SimulationWorkerResponse = {
		simulationResults: sim,
		annualReturns: annual,
		portfolioReturns: portfolio,
		probabilityOfLoss: probLoss,
		drawdownStats: drawdown,
	};

	self.postMessage(response);
};
