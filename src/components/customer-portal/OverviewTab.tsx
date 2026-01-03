import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/api/CustomerApi';
import InvoiceApi from '@/api/InvoiceApi';
import { Card } from '@/components/atoms';
import BillingOverviewCard from './BillingOverviewCard';
import SubscriptionsSection from './SubscriptionsSection';
import UsageSection from './UsageSection';

interface OverviewTabProps {
	customerId: string;
}

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
				<div className='h-20 bg-zinc-100 rounded'></div>
			</div>
		</Card>

		{/* Usage Skeleton */}
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

			{/* Current Period Usage */}
			<UsageSection usageData={usage} />
		</div>
	);
};

export default OverviewTab;
