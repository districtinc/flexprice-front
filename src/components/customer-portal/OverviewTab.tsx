import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/api/CustomerApi';
import InvoiceApi from '@/api/InvoiceApi';
import EventsApi from '@/api/EventsApi';
import { Card } from '@/components/atoms';
import { CustomerUsageChart } from '@/components/molecules';
import { WindowSize } from '@/models';
import { GetUsageAnalyticsRequest } from '@/types';
import { cn } from '@/lib/utils';
import BillingOverviewCard from './BillingOverviewCard';
import SubscriptionsSection from './SubscriptionsSection';
import UsageSection from './UsageSection';

interface OverviewTabProps {
	customerId: string;
}

type TimePeriod = '1d' | '7d' | '30d';

const OverviewSkeleton = () => (
	<div className='space-y-6'>
		{/* Billing Overview Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse'>
				<div className='h-5 bg-zinc-100 rounded w-1/4 mb-6'></div>
				<div className='grid grid-cols-2 gap-6'>
					<div>
						<div className='h-4 bg-zinc-100 rounded w-1/3 mb-2'></div>
						<div className='h-8 bg-zinc-100 rounded w-2/3'></div>
					</div>
					<div>
						<div className='h-4 bg-zinc-100 rounded w-1/3 mb-2'></div>
						<div className='h-8 bg-zinc-100 rounded w-2/3'></div>
					</div>
				</div>
			</div>
		</Card>

		{/* Subscriptions Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse space-y-4'>
				<div className='h-5 bg-zinc-100 rounded w-1/4'></div>
				<div className='h-20 bg-zinc-100 rounded'></div>
			</div>
		</Card>

		{/* Usage Chart Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse'>
				<div className='h-5 bg-zinc-100 rounded w-1/4 mb-4'></div>
				<div className='h-48 bg-zinc-100 rounded'></div>
			</div>
		</Card>

		{/* Usage Summary Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse space-y-4'>
				<div className='h-5 bg-zinc-100 rounded w-1/4'></div>
				<div className='space-y-3'>
					<div className='h-12 bg-zinc-100 rounded'></div>
					<div className='h-12 bg-zinc-100 rounded'></div>
				</div>
			</div>
		</Card>
	</div>
);

const OverviewTab = ({ customerId }: OverviewTabProps) => {
	const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

	// Fetch customer to get external_id for analytics
	const { data: customer } = useQuery({
		queryKey: ['portal-customer-overview', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId),
		enabled: !!customerId,
	});

	// Fetch subscriptions
	const {
		data: subscriptionsData,
		isLoading: subscriptionsLoading,
		isError: subscriptionsError,
	} = useQuery({
		queryKey: ['portal-subscriptions', customerId],
		queryFn: () => CustomerApi.getCustomerSubscriptions(customerId),
		enabled: !!customerId,
	});

	// Fetch invoices for billing overview
	const {
		data: invoicesData,
		isLoading: invoicesLoading,
		isError: invoicesError,
	} = useQuery({
		queryKey: ['portal-invoices', customerId],
		queryFn: () => InvoiceApi.getCustomerInvoices(customerId),
		enabled: !!customerId,
	});

	// Fetch usage summary
	const {
		data: usageData,
		isLoading: usageLoading,
		isError: usageError,
	} = useQuery({
		queryKey: ['portal-usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId }),
		enabled: !!customerId,
	});

	// Prepare analytics params based on selected period
	const analyticsParams: GetUsageAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) return null;

		const endDate = new Date();
		const startDate = new Date();

		// Calculate days based on selected period
		const daysMap: Record<TimePeriod, number> = {
			'1d': 1,
			'7d': 7,
			'30d': 30,
		};

		startDate.setDate(startDate.getDate() - daysMap[selectedPeriod]);

		return {
			external_customer_id: customer.external_id,
			window_size: WindowSize.DAY,
			start_time: startDate.toISOString(),
			end_time: endDate.toISOString(),
		};
	}, [customer?.external_id, selectedPeriod]);

	// Fetch usage analytics for chart
	const { data: analyticsData, isError: analyticsError } = useQuery({
		queryKey: ['portal-analytics', customerId, analyticsParams],
		queryFn: () => EventsApi.getUsageAnalytics(analyticsParams!),
		enabled: !!analyticsParams,
	});

	// Handle errors with toast
	useEffect(() => {
		if (subscriptionsError) {
			toast.error('Failed to load subscriptions');
		}
	}, [subscriptionsError]);

	useEffect(() => {
		if (invoicesError) {
			toast.error('Failed to load billing overview');
		}
	}, [invoicesError]);

	useEffect(() => {
		if (usageError) {
			toast.error('Failed to load usage data');
		}
	}, [usageError]);

	useEffect(() => {
		if (analyticsError) {
			toast.error('Failed to load usage analytics');
		}
	}, [analyticsError]);

	const isLoading = subscriptionsLoading || invoicesLoading || usageLoading;

	if (isLoading) {
		return <OverviewSkeleton />;
	}

	const subscriptions = subscriptionsData?.items || [];
	const invoices = invoicesData?.items || [];
	const usage = usageData?.features || [];

	// Get currency from first invoice or subscription
	const currency = invoices[0]?.currency || subscriptions[0]?.currency || 'USD';

	return (
		<div className='space-y-6'>
			{/* Billing Overview */}
			<BillingOverviewCard invoices={invoices} currency={currency} />

			{/* Active Subscriptions */}
			<SubscriptionsSection subscriptions={subscriptions} />

			{/* Usage Analytics Chart */}
			{analyticsData && (
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-base font-medium text-zinc-950'>Usage Analytics</h3>
						<div className='flex items-center gap-1 bg-zinc-50 rounded-lg p-1'>
							{(['1d', '7d', '30d'] as TimePeriod[]).map((period) => (
								<button
									key={period}
									onClick={() => setSelectedPeriod(period)}
									className={cn(
										'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
										selectedPeriod === period ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
									)}>
									{period}
								</button>
							))}
						</div>
					</div>
					<CustomerUsageChart data={analyticsData} />
				</Card>
			)}

			{/* Current Period Usage */}
			<UsageSection usageData={usage} />
		</div>
	);
};

export default OverviewTab;
