import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { Page, Card, Input, Button, DatePicker, Select, FeatureMultiSelect } from '@/components/atoms';
import CostAnalyticsApi from '@/api/CostAnalyticsApi';
import toast from 'react-hot-toast';
import { Loader, RefreshCw } from 'lucide-react';
import { GetCombinedAnalyticsRequest, GetCombinedAnalyticsResponse } from '@/types/dto/CostAnalytics';
import Feature from '@/models/Feature';

// Type guard to check if data is GetCombinedAnalyticsResponse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isCombinedAnalytics = (data: any): data is GetCombinedAnalyticsResponse => {
	return 'total_revenue' in data && 'margin' in data;
};
import { WindowSize } from '@/models';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { CostAnalyticItem } from '@/types/dto/CostAnalytics';
import { formatNumber } from '@/utils/common';
import { ApiDocsContent } from '@/components/molecules';

const windowSizeOptions = [
	{ label: 'Minute', value: WindowSize.MINUTE },
	{ label: '15 Minute', value: WindowSize.FIFTEEN_MIN },
	{ label: '30 Minute', value: WindowSize.THIRTY_MIN },
	{ label: 'Hour', value: WindowSize.HOUR },
	{ label: '3 Hour', value: WindowSize.THREE_HOUR },
	{ label: '6 Hour', value: WindowSize.SIX_HOUR },
	{ label: '12 Hour', value: WindowSize.TWELVE_HOUR },
	{ label: 'Day', value: WindowSize.DAY },
	{ label: 'Week', value: WindowSize.WEEK },
];

const CostAnalyticsPage: React.FC = () => {
	const { updateBreadcrumb } = useBreadcrumbsStore();

	// Filter states
	const [customerId, setCustomerId] = useState<string>('');
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
	const [sources, setSources] = useState<string>('');
	const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
	const [endDate, setEndDate] = useState<Date>(new Date());
	const [windowSize, setWindowSize] = useState<WindowSize>(WindowSize.HOUR);

	// Prepare API parameters
	const apiParams: GetCombinedAnalyticsRequest | null = useMemo(() => {
		const params: GetCombinedAnalyticsRequest = {
			include_time_series: true,
			include_revenue: true,
		};

		if (customerId.trim()) {
			params.external_customer_id = customerId.trim();
		}

		if (selectedFeatures.length > 0) {
			params.meter_ids = selectedFeatures.map((feature) => feature.meter_id);
		}

		if (sources.trim()) {
			params.sources = sources
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s);
		}

		if (startDate) {
			params.start_time = startDate.toISOString();
		}

		if (endDate) {
			params.end_time = endDate.toISOString();
		}

		if (windowSize) {
			params.window_size = windowSize;
		}

		return params;
	}, [customerId, selectedFeatures, sources, startDate, endDate, windowSize]);

	// Debounced API parameters with 300ms delay
	const [debouncedApiParams, setDebouncedApiParams] = useState<GetCombinedAnalyticsRequest | null>(null);

	useEffect(() => {
		if (apiParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedApiParams(apiParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedApiParams(null);
		}
	}, [apiParams]);

	const {
		data: costData,
		isLoading: costLoading,
		error: costError,
	} = useQuery({
		queryKey: ['cost-analytics', debouncedApiParams],
		queryFn: async () => {
			if (!debouncedApiParams) {
				throw new Error('API parameters not available');
			}
			return await CostAnalyticsApi.getCombinedAnalytics(debouncedApiParams);
		},
		enabled: !!debouncedApiParams,
	});

	useEffect(() => {
		updateBreadcrumb(1, 'Usage Tracking');
		updateBreadcrumb(2, 'Cost Analytics');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const resetFilters = () => {
		setCustomerId('');
		setSelectedFeatures([]);
		setSources('');
		setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)));
		setEndDate(new Date());
		setWindowSize(WindowSize.HOUR);
	};

	if (costError) {
		toast.error('Error fetching cost data');
	}

	const handleStartDateChange = (date: Date | undefined) => {
		if (date) {
			setStartDate(date);
		}
	};

	const handleEndDateChange = (date: Date | undefined) => {
		if (date) {
			setEndDate(date);
		}
	};

	return (
		<Page heading='Cost Analytics'>
			<ApiDocsContent tags={['Cost Analytics']} />
			<div className='space-y-6'>
				{/* Filters Section */}
				<Card className='overflow-visible'>
					<div className='p-6'>
						<div className='flex flex-col space-y-4'>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-medium text-gray-900'>Filters</h3>
								<div className='flex items-center space-x-2'>
									<Button variant='ghost' size='sm' onClick={resetFilters} className='h-8 px-2 text-xs text-gray-500 hover:text-gray-700'>
										<RefreshCw className='h-3.5 w-3.5 mr-1' />
										Reset
									</Button>
								</div>
							</div>

							{/* Compact Filter Section */}
							<div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
								<div className='col-span-1'>
									<Input
										label='Customer ID'
										placeholder='External customer ID'
										value={customerId}
										onChange={setCustomerId}
										className='text-sm'
									/>
								</div>
								<div className='col-span-1'>
									<Input
										label='Sources'
										placeholder='Enter sources (comma-separated)'
										value={sources}
										onChange={setSources}
										className='text-sm'
									/>
								</div>
								<div className='col-span-1'>
									<FeatureMultiSelect
										label='Features'
										placeholder='Select features'
										values={selectedFeatures.map((f) => f.id)}
										onChange={setSelectedFeatures}
										className='text-sm'
									/>
								</div>
								<div className='col-span-1'>
									<Select
										label='Window Size'
										className='w-full text-sm'
										onChange={(value) => setWindowSize(value as WindowSize)}
										value={windowSize}
										options={windowSizeOptions.map((option) => ({ label: option.label, value: option.value }))}
									/>
								</div>
							</div>

							{/* Date Range Selection */}
							<div className='flex flex-wrap items-center gap-3'>
								<div className='flex items-center gap-2'>
									<DatePicker label='From' date={startDate} setDate={handleStartDateChange} placeholder='Start date' maxDate={endDate} />
									<span className='text-gray-400 flex items-center px-2'>→</span>
									<DatePicker label='To' date={endDate} setDate={handleEndDateChange} placeholder='End date' minDate={startDate} />
								</div>
							</div>
						</div>
					</div>
				</Card>

				{/* Summary Metrics */}
				{costLoading ? (
					<Card>
						<div className='p-6'>
							<div className='flex items-center justify-center py-12'>
								<Loader />
							</div>
						</div>
					</Card>
				) : (
					costData &&
					(() => {
						const revenue = isCombinedAnalytics(costData) ? costData.total_revenue : '0';
						const margin = isCombinedAnalytics(costData) ? costData.margin : '0';
						const marginPercent = isCombinedAnalytics(costData) ? costData.margin_percent : '0';
						const roi = isCombinedAnalytics(costData) ? costData.roi : '0';
						const roiPercent = isCombinedAnalytics(costData) ? costData.roi_percent : '0';

						const marginValue = parseFloat(margin || '0');
						const roiValue = parseFloat(roi || '0');
						const marginTextClass = marginValue >= 0 ? 'text-green-700' : 'text-red-500';
						const roiTextClass = roiValue >= 0 ? 'text-green-700' : 'text-red-500';

						return (
							<Card>
								<div className='p-6'>
									<h3 className='text-lg font-medium text-gray-900 mb-4'>Cost Analytics</h3>
									<div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
										<div className='rounded-lg border border-gray-200 px-5 py-4'>
											<p className='text-sm text-gray-600 font-normal mb-2'>Revenue</p>
											<p className='text-xl font-normal text-gray-900'>
												{formatNumber(parseFloat(revenue || '0'), 2)} {costData.currency}
											</p>
										</div>
										<div className='rounded-lg border border-gray-200 px-5 py-4'>
											<p className='text-sm text-gray-600 font-normal mb-2'>Cost</p>
											<p className='text-xl font-normal text-gray-900'>
												{formatNumber(parseFloat(costData.total_cost || '0'), 2)} {costData.currency}
											</p>
										</div>
										<div className='rounded-lg border border-gray-200 px-5 py-4'>
											<p className='text-sm text-gray-600 font-normal mb-2'>Margin</p>
											<p className={`text-xl font-normal ${marginTextClass}`}>
												{formatNumber(marginValue, 2)} ({formatNumber(parseFloat(marginPercent || '0'), 2)}%)
											</p>
										</div>
										<div className='rounded-lg border border-gray-200 px-5 py-4'>
											<p className='text-sm text-gray-600 font-normal mb-2'>ROI</p>
											<p className={`text-xl font-normal ${roiTextClass}`}>
												{formatNumber(roiValue, 2)} ({formatNumber(parseFloat(roiPercent || '0'), 2)}%)
											</p>
										</div>
										<div className='rounded-lg border border-gray-200 px-5 py-4'>
											<p className='text-sm text-gray-600 font-normal mb-2'>Total Events</p>
											<p className='text-xl font-normal text-gray-900'>{formatNumber(costData.total_events || 0)}</p>
										</div>
									</div>
								</div>
							</Card>
						);
					})()
				)}

				{/* Cost Data Table */}
				{costLoading ? (
					<div className='mt-6'>
						<h1 className='text-lg font-medium text-gray-900 mb-4'>Cost Breakdown</h1>
						<Card>
							<div className='p-12'>
								<div className='flex items-center justify-center'>
									<Loader />
								</div>
							</div>
						</Card>
					</div>
				) : (
					costData && (
						<div className='mt-6'>
							<CostDataTable items={costData.cost_analytics} />
						</div>
					)
				)}
			</div>
		</Page>
	);
};

const CostDataTable: React.FC<{ items: CostAnalyticItem[] }> = ({ items }) => {
	// Define table columns
	const columns: ColumnData<CostAnalyticItem>[] = [
		{
			title: 'Meter Name',
			render: (row: CostAnalyticItem) => {
				return <span>{row.meter_name || row.meter?.name || row.meter_id}</span>;
			},
		},
		{
			title: 'Source',
			render: (row: CostAnalyticItem) => row.source || '-',
		},
		{
			title: 'Total Quantity',
			render: (row: CostAnalyticItem) => {
				return <span>{formatNumber(parseFloat(row.total_quantity || '0'))}</span>;
			},
		},
		{
			title: 'Total Cost',
			render: (row: CostAnalyticItem) => {
				return (
					<span>
						{formatNumber(parseFloat(row.total_cost || '0'), 2)} {row.currency}
					</span>
				);
			},
		},
		{
			title: 'Events',
			render: (row: CostAnalyticItem) => formatNumber(row.total_events),
		},
	];

	// Prepare data for the table
	const tableData = items.map((item, index) => ({
		...item,
		// Ensure we have all required fields for the table
		id: item.meter_id || `cost-${index}`,
	}));

	return (
		<>
			<h1 className='text-lg font-medium text-gray-900 mb-4'>Cost Breakdown</h1>
			<FlexpriceTable columns={columns} data={tableData} showEmptyRow />
		</>
	);
};

export default CostAnalyticsPage;
