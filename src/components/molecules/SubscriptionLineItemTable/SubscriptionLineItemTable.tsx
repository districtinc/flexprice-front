import { Card, CardHeader, NoDataCard } from '@/components/atoms';
import { ChargeValueCell, ColumnData, FlexpriceTable, TerminateLineItemModal, DropdownMenu } from '@/components/molecules';
import { formatDateShort } from '@/utils/common/helper_functions';
import { LineItem } from '@/models/Subscription';
import { FC, useState, useCallback, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { ENTITY_STATUS } from '@/models/base';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';
import { Dialog } from '@/components/ui/dialog';

interface Props {
	data: LineItem[];
	onEdit?: (lineItem: LineItem) => void;
	onTerminate?: (lineItemId: string, endDate?: string) => void;
	isLoading?: boolean;
}

const SubscriptionLineItemTable: FC<Props> = ({ data, onEdit, onTerminate, isLoading }) => {
	const [showTerminateModal, setShowTerminateModal] = useState(false);
	const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);
	const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

	// ===== DROPDOWN STATE HELPERS =====
	const setDropdownOpen = useCallback((lineItemId: string, isOpen: boolean) => {
		setDropdownOpenStates((prev) => ({ ...prev, [lineItemId]: isOpen }));
	}, []);

	const closeDropdown = useCallback(
		(lineItemId: string) => {
			setDropdownOpen(lineItemId, false);
		},
		[setDropdownOpen],
	);

	const closeAllDropdowns = useCallback(() => {
		setDropdownOpenStates({});
	}, []);

	// ===== HANDLERS =====
	const handleEditClick = useCallback(
		(lineItem: LineItem) => {
			closeDropdown(lineItem.id);
			onEdit?.(lineItem);
		},
		[closeDropdown, onEdit],
	);

	const handleTerminateClick = useCallback(
		(lineItem: LineItem) => {
			closeDropdown(lineItem.id);
			setSelectedLineItem(lineItem);
			setShowTerminateModal(true);
		},
		[closeDropdown],
	);

	const handleTerminateConfirm = (endDate: string | undefined) => {
		if (selectedLineItem) {
			onTerminate?.(selectedLineItem.id, endDate);
		}
		setShowTerminateModal(false);
		setSelectedLineItem(null);
	};

	const handleTerminateCancel = () => {
		setShowTerminateModal(false);
		setSelectedLineItem(null);
	};

	const handleDialogChange = (open: boolean) => {
		if (!open) {
			setShowTerminateModal(false);
			setSelectedLineItem(null);
		}
	};

	// ===== EFFECTS =====
	// Close all dropdowns when modal opens (additional safety measure)
	useEffect(() => {
		if (showTerminateModal) {
			closeAllDropdowns();
		}
	}, [showTerminateModal, closeAllDropdowns]);

	const columns: ColumnData<LineItem>[] = [
		{
			title: 'Display Name',
			fieldName: 'display_name',
		},
		{
			title: 'Billing Period',
			render: (row) => formatBillingPeriodForDisplay(row.billing_period),
		},
		{
			title: 'Charge',
			render: (row) => <div className='flex items-center gap-2'>{row.price ? <ChargeValueCell data={row.price} /> : '--'}</div>,
		},
		{
			title: 'Start Date',
			render: (row) => formatDateShort(row.start_date),
		},
		{
			title: 'End Date',
			render(row) {
				const defaultEndDate = '0001-01-01T00:00:00Z';
				const hasValidEndDate = row.end_date && row.end_date.trim() !== '' && row.end_date !== defaultEndDate;
				return <span>{hasValidEndDate ? formatDateShort(row.end_date) : '--'}</span>;
			},
		},
		{
			fieldVariant: 'interactive',
			width: '30px',
			hideOnEmpty: true,
			render: (row) => {
				const isArchived = row.status === ENTITY_STATUS.ARCHIVED;
				const defaultEndDate = '0001-01-01T00:00:00Z';
				const hasEndDate = !!(row.end_date && row.end_date.trim() !== '' && row.end_date !== defaultEndDate);
				const isDisabled = isArchived || hasEndDate;
				const isDropdownOpen = dropdownOpenStates[row.id] || false;

				return (
					<DropdownMenu
						isOpen={isDropdownOpen}
						onOpenChange={(open) => setDropdownOpen(row.id, open)}
						options={[
							{
								label: 'Edit',
								icon: <Pencil />,
								onSelect: (e: Event) => {
									e.preventDefault();
									handleEditClick(row);
								},
								disabled: isDisabled,
							},
							{
								label: 'Terminate',
								icon: <Trash2 />,
								onSelect: (e: Event) => {
									e.preventDefault();
									handleTerminateClick(row);
								},
								disabled: isDisabled,
							},
						]}
					/>
				);
			},
		},
	];

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title='Subscription Line Items' />
				<div className='p-4'>
					<div className='animate-pulse space-y-4'>
						<div className='h-4 bg-gray-200 rounded w-3/4'></div>
						<div className='h-4 bg-gray-200 rounded w-1/2'></div>
						<div className='h-4 bg-gray-200 rounded w-5/6'></div>
					</div>
				</div>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return <NoDataCard title='Subscription Line Items' subtitle='No line items found for this subscription' />;
	}

	return (
		<>
			{/* Terminate Line Item Modal */}
			<Dialog open={showTerminateModal} onOpenChange={handleDialogChange}>
				{selectedLineItem && (
					<TerminateLineItemModal onCancel={handleTerminateCancel} onConfirm={handleTerminateConfirm} isLoading={isLoading} />
				)}
			</Dialog>

			<Card variant='notched'>
				<CardHeader title='Subscription Line Items' />
				<FlexpriceTable showEmptyRow={false} data={data} columns={columns} />
			</Card>
		</>
	);
};

export default SubscriptionLineItemTable;
