import { FC, useState, useEffect } from 'react';
import { Button, DatePicker } from '@/components/atoms';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TerminateLineItemModalProps {
	onCancel: () => void;
	onConfirm: (endDate: string | undefined) => void;
	isLoading?: boolean;
}

const TerminateLineItemModal: FC<TerminateLineItemModalProps> = ({ onCancel, onConfirm, isLoading = false }) => {
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	useEffect(() => {
		setEndDate(undefined);
	}, []);

	const handleConfirm = () => {
		const endDateISO = endDate?.toISOString();
		onConfirm(endDateISO);
	};

	const handleCancel = () => {
		setEndDate(undefined);
		onCancel();
	};

	return (
		<DialogContent className='bg-white sm:max-w-[600px]'>
			<DialogHeader>
				<DialogTitle>Terminate Line Item</DialogTitle>
			</DialogHeader>

			<div className='space-y-6 py-4'>
				<div className='space-y-2'>
					<DatePicker
						label='Effective From (Optional)'
						placeholder='Select effective date'
						date={endDate}
						setDate={setEndDate}
						minDate={new Date()}
						className='w-full'
					/>
					<p className='text-xs text-gray-500'>Leave empty to terminate immediately. Select a future date to schedule termination.</p>
				</div>
			</div>

			<div className='flex justify-end space-x-3 pt-4'>
				<Button variant='outline' onClick={handleCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleConfirm} isLoading={isLoading}>
					Terminate
				</Button>
			</div>
		</DialogContent>
	);
};

export default TerminateLineItemModal;
