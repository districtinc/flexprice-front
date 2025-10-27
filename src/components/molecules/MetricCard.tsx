import { formatNumber } from '@/utils/common';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
	title: string;
	value: number;
	currency: string;
	showChangeIndicator?: boolean;
	isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, currency, showChangeIndicator = false, isNegative = false }) => {
	const arrowColor = isNegative ? 'text-[#DC2626]' : 'text-[#16A34A]';

	return (
		<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 rounded-md'>
			<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal'>{title}</p>
			<p className='text-[24px] leading-[28px] font-medium text-[#111827] flex items-center'>
				{getCurrencySymbol(currency)} {formatNumber(value, 2)}
				{showChangeIndicator && (
					<span className={`inline-block ${arrowColor} ml-3`}>{isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}</span>
				)}
			</p>
		</div>
	);
};

export default MetricCard;
