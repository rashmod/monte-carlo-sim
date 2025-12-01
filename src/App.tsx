import { useMemo, useState } from 'react';
import {
	calculateAnnualPortfolioReturn,
	// calculateCorrelationMatrix,
	generateAsset,
	runSimulation,
	type Asset,
} from './lib';
import { defaultAssets } from './data/defaultAssets';

const timeHorizons = [3, 5];

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

	const simulationResults = useMemo(() => {
		const sim = runSimulation(assets, numYears, numSimulations);

		return sim;
	}, [assets, numSimulations, numYears]);

	const averageAnnualReturns = useMemo(() => {
		return calculateAnnualPortfolioReturn(simulationResults);
	}, [simulationResults]);

	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<div className='max-w-2xl mx-auto space-y-6'>
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
										colSpan={3}
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
										Worst (p5)
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium border-r border-gray-300'>
										Max
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Volatility
									</th>
									<th className='px-4 py-2 text-left text-sm font-medium'>
										Sharpe Ratio
									</th>
								</tr>
							</thead>
							<tbody>
								{timeHorizons.map((timeHorizon) => {
									const stats =
										averageAnnualReturns[timeHorizon - 1];
									return (
										<tr
											key={timeHorizon}
											className='border-t border-gray-300'>
											<td className='px-4 py-2 text-sm border-r border-gray-300'>
												{timeHorizon} years
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right border-r border-gray-300'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{(stats.average * 100).toFixed(
													2
												)}
												%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{(stats.median * 100).toFixed(
													2
												)}
												%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{(stats.p5 * 100).toFixed(2)}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right border-r border-gray-300'>
												{(stats.p95 * 100).toFixed(2)}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right border-r border-gray-300'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right border-r border-gray-300'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}%
											</td>
											<td className='px-4 py-2 text-sm font-mono text-right'>
												{0}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
