import { Customer } from '@/models';
import { Building2 } from 'lucide-react';

interface PortalHeaderProps {
	customer: Customer;
	tenantName?: string;
}

const PortalHeader = ({ customer, tenantName }: PortalHeaderProps) => {
	return (
		<div className='bg-white border-b border-[#E9E9E9]'>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-4'>
						{/* Customer Avatar */}
						<div className='h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center'>
							<span className='text-lg font-medium text-zinc-600'>
								{customer.name
									?.split(' ')
									.map((n) => n[0])
									.join('')
									.slice(0, 2)
									.toUpperCase() || 'CU'}
							</span>
						</div>
						<div>
							<h1 className='text-xl font-medium text-zinc-950'>{customer.name}</h1>
							{customer.email && <p className='text-sm text-zinc-500'>{customer.email}</p>}
						</div>
					</div>

					{/* Tenant Branding */}
					{tenantName && (
						<div className='hidden sm:flex items-center gap-2 text-zinc-400'>
							<Building2 className='h-4 w-4' />
							<span className='text-sm'>{tenantName}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PortalHeader;
