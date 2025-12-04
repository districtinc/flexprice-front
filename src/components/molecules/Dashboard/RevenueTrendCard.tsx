'use client';

import { Loader } from '@/components/atoms';
import { DollarSign } from 'lucide-react';

interface RevenueMonth {
	month: string;
	revenue: number;
	currency: string;
}

interface RevenueTrendCardProps {
	revenueData: RevenueMonth[];
	isLoading: boolean;
}

export const RevenueTrendCard: React.FC<RevenueTrendCardProps> = ({ revenueData, isLoading }) => {
	return (
		<div className='bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden'>
			<div className='p-6 border-b border-[#E5E7EB]'>
				<div className='flex items-center justify-between mb-2'>
					<h3 className='text-base font-medium text-[#111827]'>Revenue Trend</h3>
					<DollarSign className='w-5 h-5 text-green-600' />
				</div>
				<p className='text-xs text-[#6B7280]'>Last 3 months</p>
			</div>
			<div className='p-6'>
				{isLoading ? (
					<div className='flex items-center justify-center py-8'>
						<Loader />
					</div>
				) : revenueData && revenueData.length > 0 ? (
					<div className='space-y-2'>
						{revenueData.map((month, index) => {
							return (
								<div key={index} className='flex items-center justify-between py-2 border-[#F3F4F6] last:border-0'>
									<div className='flex-1'>
										<p className='text-sm font-medium text-[#111827]'>{month.month}</p>
									</div>
									<div className='text-right'>
										<p className='text-lg font-semibold text-[#111827]'>
											{new Intl.NumberFormat('en-US', {
												style: 'currency',
												currency: month.currency,
												minimumFractionDigits: 0,
												maximumFractionDigits: 0,
											}).format(month.revenue)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<p className='text-center text-sm text-[#9CA3AF] py-4'>No revenue data available</p>
				)}
			</div>
		</div>
	);
};

export default RevenueTrendCard;
