'use client';

import { Loader } from '@/components/atoms';
import { AlertCircle, CheckCircle, Clock, CreditCard, RefreshCw } from 'lucide-react';

interface Invoice {
	amount_remaining?: number;
	amount_due?: number;
	currency?: string;
}

interface Subscription {
	id: string;
}

interface InvoicesByStatus {
	paid: Invoice[];
	failed: Invoice[];
	pending: Invoice[];
	processing: Invoice[];
	refunded: Invoice[];
}

interface InvoiceIssuesCardProps {
	invoicesByStatus: InvoicesByStatus;
	pastDueSubscriptions: Subscription[];
	isLoading: boolean;
}

export const InvoiceIssuesCard: React.FC<InvoiceIssuesCardProps> = ({ invoicesByStatus, pastDueSubscriptions, isLoading }) => {
	const issuesCount = (invoicesByStatus?.failed?.length || 0) + (pastDueSubscriptions?.length || 0);

	return (
		<div className='bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden'>
			<div className='p-6 border-b border-[#E5E7EB]'>
				<div className='flex items-center justify-between mb-2'>
					<h3 className='text-base font-semibold text-[#111827]'>Invoice Payment Status</h3>
					<CreditCard className='w-5 h-5 text-blue-600' />
				</div>
				<p className='text-xs text-[#6B7280]'>Requires attention (last 7 days)</p>
			</div>
			<div className='p-6'>
				{isLoading ? (
					<div className='flex items-center justify-center py-8'>
						<Loader />
					</div>
				) : (
					<div className='space-y-3'>
						{/* Paid Invoices */}
						<div className='bg-green-50 border border-green-200 rounded-lg p-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<CheckCircle className='w-4 h-4 text-green-600' />
									<p className='text-sm font-medium text-green-900'>Paid</p>
								</div>
								<span className='text-lg font-bold text-green-600'>{invoicesByStatus?.paid?.length || 0}</span>
							</div>
						</div>

						{/* Failed Payments */}
						<div className='bg-red-50 border border-red-200 rounded-lg p-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<AlertCircle className='w-4 h-4 text-red-600' />
									<p className='text-sm font-medium text-red-900'>Failed</p>
								</div>
								<span className='text-lg font-bold text-red-600'>{invoicesByStatus?.failed?.length || 0}</span>
							</div>
						</div>

						{/* Pending Payments */}
						<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<Clock className='w-4 h-4 text-yellow-600' />
									<p className='text-sm font-medium text-yellow-900'>Pending</p>
								</div>
								<span className='text-lg font-bold text-yellow-600'>{invoicesByStatus?.pending?.length || 0}</span>
							</div>
						</div>

						{/* Processing Payments */}
						{(invoicesByStatus?.processing?.length || 0) > 0 && (
							<div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<RefreshCw className='w-4 h-4 text-blue-600' />
										<p className='text-sm font-medium text-blue-900'>Processing</p>
									</div>
									<span className='text-lg font-bold text-blue-600'>{invoicesByStatus?.processing?.length || 0}</span>
								</div>
							</div>
						)}

						{/* Summary */}
						<div className='pt-2 mt-3 border-t border-gray-200'>
							{issuesCount > 0 && (
								<div className='flex items-center justify-between p-3 bg-red-50 rounded-lg mt-2'>
									<p className='text-sm font-medium text-red-700'>Issues Requiring Attention</p>
									<p className='text-xl font-bold text-red-600'>{issuesCount}</p>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default InvoiceIssuesCard;
