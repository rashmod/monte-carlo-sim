export type HistoricalData = {
	date: Date;
	price: number;
};

export type Asset = {
	name: string;
	weight: number;
	rawHistoricalData: string;
	historicalData: { data: HistoricalData[]; errors: string[] }; // daily
	dailyLogReturns: number[]; // continuously compounded
	dailySimpleReturns: number[]; // arithmetic/simple
	dailyMeanLogReturn: number; // mean log return
	dailyLogReturnVolatility: number; // std dev of log returns
	annualizedLogReturn: number; // annualized log return
	annualizedSimpleReturn: number; // annualized simple return
	annualizedLogReturnVolatility: number; // annualized vol of log returns
};

// Return stats represent simple (arithmetic) nominal returns unless noted
export type ReturnStats = {
	average: number;
	median: number;
	p5: number;
	p95: number;
};

export type ReturnStatsWithStdDev = ReturnStats & { stdDev: number };

export type LossProbability = {
	nominal: number;
	real: number;
};

export type DrawdownMilestone =
	| {
			value: number;
			recovered: true;
			duration: number;
			drawdown: number;
			year: number;
	  }
	| {
			value: number;
			recovered: false;
			duration: null;
			drawdown: number;
			year: number;
	  };

export type DrawdownYearStats = {
	medianDrawdown: number;
	medianDuration: number;
	p5Drawdown: number;
	p5Duration: number;
	recoveredPercent: number;
	worstDrawdown: number;
	worstDuration: number;
};

export type CashflowTD = {
	dayIndex: number; // 0,1,2,... representing trading days
	amount: number;
};

export type SimulationWorkerMessage = {
	assets: Asset[];
	numYears: number;
	numSimulations: number;
	inflationRate: number;
	initialAmount: number;
	monthlySIPAmount: number;
	annualRiskFreeRate: number;
};

export type SimulationWorkerResponse = {
	simulationResults: number[][];
	annualReturns: ReturnStatsWithStdDev[];
	portfolioReturns: ReturnStatsWithStdDev[];
	probabilityOfLoss: LossProbability[];
	drawdownStats: DrawdownYearStats[];
	sharpeStats: ReturnStatsWithStdDev[];
};
