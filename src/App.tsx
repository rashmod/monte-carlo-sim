function App() {
	return (
		<div className='min-h-screen bg-gray-50 p-8'>
			<div className='max-w-2xl mx-auto space-y-6'>
				<div className='flex gap-4'>
					<div className='space-y-2'>
						<label
							htmlFor='num-simulations'
							className='block text-sm font-medium'>
							Number of Simulations
						</label>
						<input
							type='number'
							id='num-simulations'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
						/>
					</div>

					<div className='space-y-2'>
						<label
							htmlFor='num-years'
							className='block text-sm font-medium'>
							Number of Years
						</label>
						<input
							type='number'
							id='num-years'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
						/>
					</div>

					<div className='space-y-2'>
						<label
							htmlFor='inflation-rate'
							className='block text-sm font-medium'>
							Inflation Rate
						</label>
						<input
							type='number'
							id='inflation-rate'
							className='w-full px-3 py-2 border border-gray-300 rounded-md'
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
						className='w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm'></textarea>
				</div>
			</div>
		</div>
	);
}

export default App;
