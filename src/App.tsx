import { useMemo, useState } from 'react';
import {
	calculateAnnualPortfolioReturn,
	calculateMaxDrawdown,
	calculateProbabilityOfLoss,
	calculateTotalPortfolioReturn,
	// calculateCorrelationMatrix,
	generateAsset,
	type Asset,
	type SimulationWorkerMessage,
	type SimulationWorkerResponse,
} from './lib';
import { defaultAssets } from './data/defaultAssets';

const timeHorizons = [3, 5, 7, 10, 15, 20, 25, 30];
const simulationWorker = new URL('./simulation.worker.ts', import.meta.url);

function App() {
	const [numSimulations, setNumSimulations] = useState(10);
	const [numYears, setNumYears] = useState(5);
	const [inflationRate, setInflationRate] = useState(0.02);
	const [assetName, setAssetName] = useState('');
	const [weight, setWeight] = useState(0.5);
	const [rawHistoricalData, setRawHistoricalData] = useState('');
	const [assets, setAssets] = useState<Asset[]>(defaultAssets);

	const [show, setShow] = useState({
		assetForm: false,
		simulationResults: false,
	});

	// const correlationMatrix = useMemo(
	// 	() => calculateCorrelationMatrix(assets),
	// 	[assets]
	// );

	const totalWeight = useMemo(() => {
		return assets.reduce((acc, asset) => acc + asset.weight, 0);
	}, [assets]);

	const [simulationResults, setSimulationResults] = useState<number[][]>([]);
	const [annualReturns, setAnnualReturns] = useState<
		ReturnType<typeof calculateAnnualPortfolioReturn>
	>([]);
	const [portfolioReturns, setPortfolioReturns] = useState<
		ReturnType<typeof calculateTotalPortfolioReturn>
	>([]);
	const [probabilityOfLoss, setProbabilityOfLoss] = useState<
		ReturnType<typeof calculateProbabilityOfLoss>
	>([]);
	const [drawdownStats, setDrawdownStats] = useState<
		ReturnType<typeof calculateMaxDrawdown>
	>([]);
	const [isLoading, setIsLoading] = useState(false);

	const handleRunSimulation = () => {
		setIsLoading(true);

		const worker = new Worker(simulationWorker, { type: 'module' });

		worker.onmessage = (event: MessageEvent<SimulationWorkerResponse>) => {
			const {
				simulationResults: sim,
				annualReturns: annual,
				portfolioReturns: portfolio,
				probabilityOfLoss: probLoss,
				drawdownStats: drawdown,
			} = event.data;

			setSimulationResults(sim);
			setAnnualReturns(annual);
			setPortfolioReturns(portfolio);
			setProbabilityOfLoss(probLoss);
			setDrawdownStats(drawdown);

			setIsLoading(false);
			worker.terminate();
		};

		worker.onerror = (error) => {
			console.error('Worker error:', error);
			setIsLoading(false);
			worker.terminate();
		};

		const message: SimulationWorkerMessage = {
			assets,
			numYears,
			numSimulations,
			inflationRate,
		};

		worker.postMessage(message);
	};

	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<div className='max-w-5xl mx-auto space-y-6'>
				<div className='flex gap-4'>
					<div className='flex-1 space-y-2'>
						<label
							htmlFor='num-simulations'
							className='block text-sm font-medium'>
							Number of Simulations
						</label>
						<input
							type='number'
							id='num-simulations'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
							value={numSimulations}
							onChange={(e) =>
								setNumSimulations(Number(e.target.value))
							}
						/>
					</div>

					<div className='flex-1 space-y-2'>
						<label
							htmlFor='num-years'
							className='block text-sm font-medium'>
							Number of Years
						</label>
						<input
							type='number'
							id='num-years'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
							value={numYears}
							onChange={(e) =>
								setNumYears(Number(e.target.value))
							}
						/>
					</div>

					<div className='flex-1 space-y-2'>
						<label
							htmlFor='inflation-rate'
							className='block text-sm font-medium'>
							Inflation Rate
						</label>
						<input
							type='number'
							id='inflation-rate'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
							value={inflationRate}
							onChange={(e) =>
								setInflationRate(Number(e.target.value))
							}
						/>
					</div>
				</div>

				<button
					onClick={handleRunSimulation}
					disabled={isLoading}
					className='px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'>
					{isLoading && (
						<svg
							className='animate-spin h-5 w-5 text-white'
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'>
							<circle
								className='opacity-25'
								cx='12'
								cy='12'
								r='10'
								stroke='currentColor'
								strokeWidth='4'></circle>
							<path
								className='opacity-75'
								fill='currentColor'
								d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
						</svg>
					)}
					{isLoading ? 'Running Simulation...' : 'Run Simulation'}
				</button>

				<div className='space-y-4'>
					<button
						onClick={() => {
							setShow((prev) => ({
								...prev,
								assetForm: !prev.assetForm,
							}));
						}}
						className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600'>
						{show.assetForm ? 'Hide' : 'Show'} Asset Form
					</button>

					{show.assetForm && (
						<div className='space-y-4'>
							<div className='flex gap-4'>
								<div className='flex-1 space-y-2'>
									<label
										htmlFor='annual-return'
										className='block text-sm font-medium'>
										Asset Name
									</label>
									<input
										type='text'
										id='annual-return'
										className='w-full px-3 py-2 border border-gray-300 rounded-md'
										value={assetName}
										onChange={(e) =>
											setAssetName(e.target.value)
										}
									/>
								</div>

								<div className='flex-1 space-y-2'>
									<label
										htmlFor='weight'
										className='block text-sm font-medium'>
										Weight
									</label>
									<input
										type='number'
										id='weight'
										className='w-full px-3 py-2 border border-gray-300 rounded-md'
										value={weight}
										onChange={(e) =>
											setWeight(Number(e.target.value))
										}
									/>
								</div>
							</div>

							<div className='space-y-2'>
								<label
									htmlFor='historical-data'
									className='block text-sm font-medium'>
									Historical Data
								</label>
								<textarea
									rows={10}
									id='historical-data'
									className='w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm'
									onChange={(e) =>
										setRawHistoricalData(e.target.value)
									}
								/>
							</div>

							<button
								onClick={() => {
									const newAsset = generateAsset(
										assetName,
										weight,
										rawHistoricalData
									);

									setAssets([...assets, newAsset]);
								}}
								className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700'>
								Add Asset
							</button>
						</div>
					)}
				</div>

				<div className='space-y-4'>
					<h2 className='text-lg font-medium'>Assets</h2>
					{totalWeight !== 1 && (
						<p className='text-red-500 text-sm'>
							The sum of the weights must be 100%. Current sum:{' '}
							{(totalWeight * 100).toFixed(2)}%
						</p>
					)}
					{assets.length > 0 && (
						<table className='w-full border border-gray-300 rounded-md'>
							<thead>
								<tr className='bg-gray-100'>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Asset Name
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Weight
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Annual Return
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Volatility
									</th>
								</tr>
							</thead>
							<tbody>
								{assets.map((asset, index) => (
									<tr
										key={index}
										className='border-t border-gray-300'>
										<td className='px-4 py-2'>
											{asset.name}
										</td>
										<td className='px-4 py-2'>
											<div className='flex items-center gap-2'>
												<input
													type='range'
													min={0}
													max={1}
													step={0.01}
													value={asset.weight}
													onChange={(e) =>
														setAssets(
															assets.map((a, i) =>
																i === index
																	? {
																			...a,
																			weight: Number(
																				e
																					.target
																					.value
																			),
																	  }
																	: a
															)
														)
													}
													className='flex-1'
												/>
												<span className='text-sm w-12 text-right'>
													{(
														asset.weight * 100
													).toFixed(1)}
													%
												</span>
											</div>
										</td>
										<td className='px-4 py-2 text-sm'>
											{(
												asset.annualSimpleReturn * 100
											).toFixed(2)}
											%
										</td>
										<td className='px-4 py-2 text-sm'>
											{(
												asset.annualVolatility * 100
											).toFixed(2)}
											%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				<div className='space-y-4'>
					<h2 className='text-lg font-medium'>Simulation Results</h2>
					<button
						onClick={() =>
							setShow((prev) => ({
								...prev,
								simulationResults: !prev.simulationResults,
							}))
						}
						className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-600'>
						{show.simulationResults ? 'Hide' : 'Show'} Simulation
						Results
					</button>

					{show.simulationResults && simulationResults.length > 0 && (
						<div className='overflow-x-auto'>
							<table className='w-full border border-gray-300 rounded-md'>
								<thead>
									<tr className='bg-gray-100'>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Simulation
										</th>
										{Array.from(
											{
												length: simulationResults[0]
													.length,
											},
											(_, i) => (
												<th
													key={i}
													className='px-4 py-2 text-left text-sm font-medium'>
													Day {i}
												</th>
											)
										)}
									</tr>
								</thead>
								<tbody>
									{simulationResults
										.slice(0, 5)
										.map((simulation, index) => (
											<tr
												key={index}
												className='border-t border-gray-300'>
												<td className='px-4 py-2 text-sm'>
													{index + 1}
												</td>
												{simulation.map(
													(value, yearIndex) => (
														<td
															key={yearIndex}
															className='px-4 py-2 font-mono text-right text-sm'>
															{value.toFixed(4)}
														</td>
													)
												)}
											</tr>
										))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{simulationResults.length > 0 && (
					<div className='space-y-4'>
						<h2 className='text-lg font-medium'>Results</h2>

						<div className='overflow-x-auto'>
							<table className='w-full border border-gray-300 rounded-md'>
								<thead>
									<tr className='bg-gray-100'>
										<th
											rowSpan={2}
											className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
											Time horizon
										</th>
										<th
											colSpan={4}
											className='px-4 py-2 text-center text-sm font-medium border-r border-gray-300'>
											Total Portfolio Return
										</th>
										<th
											colSpan={4}
											className='px-4 py-2 text-center text-sm font-medium border-r border-gray-300'>
											Annualized Return
										</th>
										<th
											colSpan={2}
											className='px-4 py-2 text-center text-sm font-medium border-r border-gray-300'>
											Probability
										</th>
										<th
											colSpan={7}
											className='px-4 py-2 text-center text-sm font-medium border-r border-gray-300'>
											Drawdown
										</th>
										<th
											colSpan={2}
											className='px-4 py-2 text-center text-sm font-medium'>
											Other Metrics
										</th>
									</tr>
									<tr className='bg-gray-100'>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Average
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Median
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											P5
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
											P95
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Average
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Median
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											P5
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
											P95
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Loss
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
											Loss of Purchasing Power
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Median
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Median Duration
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Worst (p5)
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Worst Duration
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Max
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Max Duration
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
											Recovered
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Volatility
										</th>
										<th className='px-4 py-2 text-left text-sm font-medium'>
											Sharpe Ratio
										</th>
									</tr>
								</thead>
								<tbody className='font-mono'>
									{timeHorizons.map((timeHorizon) => {
										const stats =
											annualReturns[timeHorizon - 1];
										const portfolioStats =
											portfolioReturns[timeHorizon - 1];
										const drawdownStat =
											drawdownStats[timeHorizon - 1];

										if (!stats) return null;

										return (
											<tr
												key={timeHorizon}
												className='border-t border-gray-300'>
												<td className='px-4 py-2 text-sm border-r border-gray-300'>
													{timeHorizon} years
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														portfolioStats.average *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														portfolioStats.median *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														portfolioStats.p5 * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right border-r border-gray-300'>
													{(
														portfolioStats.p95 * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														stats.average * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														stats.median * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(stats.p5 * 100).toFixed(
														2
													)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right border-r border-gray-300'>
													{(stats.p95 * 100).toFixed(
														2
													)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														probabilityOfLoss[
															timeHorizon - 1
														].nominal * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right border-r border-gray-300'>
													{(
														probabilityOfLoss[
															timeHorizon - 1
														].real * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														drawdownStat.medianDrawdown *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{drawdownStat.medianDuration.toFixed(
														2
													)}{' '}
													days
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														drawdownStat.p5Drawdown *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{drawdownStat.p5Duration.toFixed(
														2
													)}{' '}
													days
												</td>
												<td className='px-4 py-2 text-sm text-right '>
													{(
														drawdownStat.worstDrawdown *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{drawdownStat.worstDuration.toFixed(
														2
													)}{' '}
													days
												</td>
												<td className='px-4 py-2 text-sm text-right border-r border-gray-300'>
													{(
														drawdownStat.recoveredPercent *
														100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{(
														stats.stdDev * 100
													).toFixed(2)}
													%
												</td>
												<td className='px-4 py-2 text-sm text-right'>
													{0}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
