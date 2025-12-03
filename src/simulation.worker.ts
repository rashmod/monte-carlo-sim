import {
	calculateAnnualPortfolioReturn,
	calculateMaxDrawdown,
	calculateProbabilityOfLoss,
	calculateTotalPortfolioReturn,
	runSimulation,
	type SimulationWorkerMessage,
	type SimulationWorkerResponse,
} from './lib';

export {};

self.onmessage = (e: MessageEvent<SimulationWorkerMessage>) => {
	const { assets, numYears, numSimulations, inflationRate } = e.data;

	const sim = runSimulation(assets, numYears, numSimulations);
	const annual = calculateAnnualPortfolioReturn(sim);
	const portfolio = calculateTotalPortfolioReturn(sim);
	const probLoss = calculateProbabilityOfLoss(sim, inflationRate);
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
