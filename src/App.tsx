import { useState } from 'react';

type HistoricalData = {
	date: Date;
	price: number;
};

type Asset = {
	name: string;
	weight: number;
	rawHistoricalData: string;
	historicalData: HistoricalData[];
};

function cleanHistoricalData(historicalData: string): HistoricalData[] {
	return historicalData
		.split('\n')
		.map((line) => line.split('\t').map((w) => w.trim()))
		.map(([date, price]) => ({
			date: new Date(date),
			price: Number(price),
		}))
		.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function App() {
	const [numSimulations, setNumSimulations] = useState(1000);
	const [numYears, setNumYears] = useState(10);
	const [inflationRate, setInflationRate] = useState(0.02);
	const [assetName, setAssetName] = useState('');
	const [weight, setWeight] = useState(0.5);
	const [rawHistoricalData, setRawHistoricalData] = useState('');
	const [assets, setAssets] = useState<Asset[]>([]);

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
								onChange={(e) => setAssetName(e.target.value)}
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
						onClick={() =>
							setAssets([
								...assets,
								{
									name: assetName,
									weight,
									rawHistoricalData,
									historicalData:
										cleanHistoricalData(rawHistoricalData),
								},
							])
						}
						className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700'>
						Add Asset
					</button>
				</div>

				<div>
					<h2 className='text-lg font-medium'>Assets</h2>
					<ul className='space-y-2'>
						{assets.map((asset, index) => (
							<li
								key={index}
								className='flex items-center justify-between'>
								<span>{asset.name}</span>
								<span>{asset.weight}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

export default App;
