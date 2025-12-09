import {
	calculateAnnualPortfolioReturn,
	calculateMaxDrawdown,
	calculateProbabilityOfLoss,
	calculateTotalPortfolioReturn,
	generateCashflowArray,
	runSimulation,
	xirrTradingDays,
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

	// replace annual return with xirr
	const annual = calculateAnnualPortfolioReturn(sim);
	const portfolio = calculateTotalPortfolioReturn(sim);
	const probLoss = calculateProbabilityOfLoss(sim, inflationRate);
	const drawdown = calculateMaxDrawdown(sim);

	const foo = sim.map((simulation) => {
		const cfs = generateCashflowArray(
			simulation,
			numYears,
			initialAmount,
			monthlySIPAmount
		);

		return xirrTradingDays(cfs);
	});

	const average = foo.reduce((acc, curr) => acc + curr, 0) / foo.length;
	const stdDev = Math.sqrt(
		foo.reduce((acc, curr) => acc + (curr - average) ** 2, 0) / foo.length
	);
	console.log(annual.map((a) => a.average));
	console.log(average);

	const response: SimulationWorkerResponse = {
		simulationResults: sim,
		annualReturns: annual,
		portfolioReturns: portfolio,
		probabilityOfLoss: probLoss,
		drawdownStats: drawdown,
	};

	self.postMessage(response);
};
