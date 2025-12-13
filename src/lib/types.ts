import type {
	AssetWeight,
	AnnualizedLogReturn,
	AnnualizedSimpleReturn,
	LogReturnSeries,
	LogReturnVolatility,
	MeanLogReturn,
	SimpleReturnSeries,
	AnnualizedLogReturnVolatility,
} from './brand';

export type HistoricalData = {
	date: Date;
	price: number;
};

export type Asset = {
	name: string;
	weight: AssetWeight;
	rawHistoricalData: string;
	historicalData: { data: HistoricalData[]; errors: string[] }; // daily
	dailyLogReturns: LogReturnSeries; // continuously compounded
	dailySimpleReturns: SimpleReturnSeries; // arithmetic/simple
	dailyMeanLogReturn: MeanLogReturn; // mean log return
	dailyLogReturnVolatility: LogReturnVolatility; // std dev of log returns
	annualizedLogReturn: AnnualizedLogReturn; // annualized log return
	annualizedSimpleReturn: AnnualizedSimpleReturn; // annualized simple return
	annualizedLogReturnVolatility: AnnualizedLogReturnVolatility; // annualized vol of log returns
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
};

export type SimulationWorkerResponse = {
	simulationResults: number[][];
	annualReturns: ReturnStatsWithStdDev[];
	portfolioReturns: ReturnStats[];
	probabilityOfLoss: LossProbability[];
	drawdownStats: DrawdownYearStats[];
	sharpeStats: ReturnStatsWithStdDev[];
};
