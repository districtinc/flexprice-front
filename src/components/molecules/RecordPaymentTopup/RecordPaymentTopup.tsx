import { Button, Input, Select, Textarea, PaymentUrlSuccessDialog, DatePicker, Dialog } from '@/components/atoms';
import { FC, useState, useEffect } from 'react';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { PAYMENT_METHOD_TYPE, PAYMENT_DESTINATION_TYPE, Payment } from '@/models/Payment';
import PaymentApi from '@/api/PaymentApi';
import ConnectionApi from '@/api/ConnectionApi';
import { RecordPaymentPayload } from '@/types/dto/Payment';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LoaderCircleIcon } from 'lucide-react';
import { ServerError } from '@/core/axios/types';
import { CONNECTION_PROVIDER_TYPE } from '@/models/Connection';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
	destination_id: string;
	destination_type: PAYMENT_DESTINATION_TYPE;
	max_amount?: number;
	currency: string;
	onSuccess?: (payment: Payment) => void;
}

interface ValidationErrors {
	amount?: string;
	payment_method_type?: string;
	reference_id?: string;
	description?: string;
	selected_connection_id?: string;
	recorded_at?: string;
}

interface PaymentFormData {
	amount: number;
	payment_method_type: PAYMENT_METHOD_TYPE | '';
	reference_id?: string;
	description?: string;
	selected_connection_id?: string;
	recorded_at?: Date;
}

const RecordPaymentTopup: FC<Props> = ({ isOpen, onOpenChange, destination_id, destination_type, max_amount, currency, onSuccess }) => {
	const [formData, setFormData] = useState<PaymentFormData>({
		amount: max_amount || 0,
		payment_method_type: '',
	});
	const [errors, setErrors] = useState<ValidationErrors>({});
	const [paymentUrlPopup, setPaymentUrlPopup] = useState({
		isOpen: false,
		paymentUrl: '',
		isCopied: false,
	});

	const { data: connectionsResponse } = useQuery({
		queryKey: ['connections', 'published'],
		queryFn: () => ConnectionApi.ListPublished(),
		enabled: isOpen,
	});

	const availableConnections = connectionsResponse?.connections || [];

	const paymentMethodOptions = [
		{ label: 'Offline', value: PAYMENT_METHOD_TYPE.OFFLINE, description: 'Record payment that was processed outside the system' },
		...(availableConnections.length > 0
			? [{ label: 'Payment Link', value: PAYMENT_METHOD_TYPE.PAYMENT_LINK, description: 'Generate a payment link for online payment' }]
			: []),
	];

	const providerOptions = availableConnections
		.map((connection) => {
			if (connection.provider_type === CONNECTION_PROVIDER_TYPE.STRIPE) {
				return { label: 'Stripe', value: connection.id, description: `Process payment through Stripe (${connection.name})` };
			}
			if (connection.provider_type === CONNECTION_PROVIDER_TYPE.RAZORPAY) {
				return { label: 'Razorpay', value: connection.id, description: `Process payment through Razorpay (${connection.name})` };
			}
			if (connection.provider_type === CONNECTION_PROVIDER_TYPE.NOMOD) {
				return { label: 'Nomod', value: connection.id, description: `Process payment through Nomod (${connection.name})` };
			}
			return null;
		})
		.filter((option): option is { label: string; value: string; description: string } => option !== null);

	useEffect(() => {
		if (!isOpen) {
			setFormData({
				amount: max_amount || 0,
				payment_method_type: '',
				reference_id: '',
				description: '',
				selected_connection_id: '',
				recorded_at: undefined,
			});
			setErrors({});
		}
	}, [isOpen, max_amount]);

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {};

		if (!formData.amount || formData.amount <= 0) {
			newErrors.amount = 'Amount is required and must be greater than 0';
		} else if (max_amount && formData.amount > max_amount) {
			newErrors.amount = `Amount cannot exceed ${getCurrencySymbol(currency)}${max_amount}`;
		}

		if (!formData.payment_method_type) {
			newErrors.payment_method_type = 'Payment method is required';
		}

		if (formData.payment_method_type === PAYMENT_METHOD_TYPE.PAYMENT_LINK && !formData.selected_connection_id) {
			newErrors.selected_connection_id = 'Payment provider is required';
		}

		switch (formData.payment_method_type) {
			case PAYMENT_METHOD_TYPE.OFFLINE:
				if (formData.recorded_at && formData.recorded_at > new Date()) {
					newErrors.recorded_at = 'Recorded date cannot be in the future';
				}
				break;
			case PAYMENT_METHOD_TYPE.CARD:
			case PAYMENT_METHOD_TYPE.ACH:
				newErrors.payment_method_type = 'This payment method is not available yet';
				break;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: recordPayment, isPending } = useMutation({
		mutationFn: async (): Promise<Payment> => {
			const selectedConnection = formData.selected_connection_id
				? availableConnections.find((conn) => conn.id === formData.selected_connection_id)
				: null;

			const isPaymentLink = !!selectedConnection;
			let paymentUrls = {};

			if (isPaymentLink) {
				const baseUrl = window.location.origin;
				let redirectUrl = window.location.href;

				if (destination_type === PAYMENT_DESTINATION_TYPE.INVOICE) {
					const urlParams = new URLSearchParams(window.location.search);
					const pageParam = urlParams.get('page') || '1';
					redirectUrl = `${baseUrl}/billing/invoices/${destination_id}?page=${pageParam}`;
				}

				paymentUrls = { success_url: redirectUrl, cancel_url: redirectUrl };
			}

			const payload: RecordPaymentPayload = {
				amount: formData.amount,
				currency,
				destination_id,
				destination_type,
				payment_method_type: formData.payment_method_type as PAYMENT_METHOD_TYPE,
				process_payment: true,
				...(formData.payment_method_type === PAYMENT_METHOD_TYPE.OFFLINE &&
					formData.recorded_at && {
						recorded_at: formData.recorded_at,
					}),
				...(selectedConnection && {
					payment_gateway: selectedConnection.provider_type,
					payment_method_type: PAYMENT_METHOD_TYPE.PAYMENT_LINK,
				}),
				idempotency_key: formData.reference_id,
				metadata: {
					...(formData.description?.trim() && { description: formData.description.trim() }),
					...(formData.payment_method_type === PAYMENT_METHOD_TYPE.OFFLINE && { reference_id: formData.reference_id }),
					...(selectedConnection && { connection_id: selectedConnection.id, connection_name: selectedConnection.name }),
					...paymentUrls,
				},
			};

			return await PaymentApi.createPayment(payload);
		},
		onSuccess: (payment: Payment) => {
			toast.success('Payment recorded successfully');

			onOpenChange(false);

			if (payment.payment_url) {
				setPaymentUrlPopup({ isOpen: true, paymentUrl: payment.payment_url, isCopied: false });
			}

			onSuccess?.(payment);
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Failed to record payment. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (validateForm()) recordPayment();
	};

	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(paymentUrlPopup.paymentUrl);
			setPaymentUrlPopup((prev) => ({ ...prev, isCopied: true }));
			toast.success('Payment URL copied to clipboard!');
			setTimeout(() => setPaymentUrlPopup((prev) => ({ ...prev, isCopied: false })), 2000);
		} catch (error) {
			console.error('Failed to copy payment URL:', error);
			toast.error('Failed to copy payment URL. Please try again or copy manually.');
		}
	};

	const handleGoToLink = () => {
		window.open(paymentUrlPopup.paymentUrl, '_blank');
		setPaymentUrlPopup({ isOpen: false, paymentUrl: '', isCopied: false });
	};

	const handleCloseUrlPopup = () => {
		setPaymentUrlPopup({ isOpen: false, paymentUrl: '', isCopied: false });
	};

	const renderPaymentMethodFields = () => {
		const descriptionField = (
			<Textarea
				label='Description'
				placeholder='Add payment description or notes'
				value={formData.description || ''}
				onChange={(value) => setFormData({ ...formData, description: value })}
				error={errors.description}
			/>
		);

		switch (formData.payment_method_type) {
			case PAYMENT_METHOD_TYPE.OFFLINE:
				return (
					<div className='space-y-3'>
						<Input
							label='Reference ID'
							placeholder='Enter payment reference ID'
							value={formData.reference_id || ''}
							onChange={(value) => setFormData({ ...formData, reference_id: value })}
							error={errors.reference_id}
							description='Enter the reference number or payment details from your payment processor.'
						/>
						<div className='space-y-2 w-full'>
							<DatePicker
								className='w-full'
								label='Recorded At (Optional)'
								popoverTriggerClassName='w-full'
								date={formData.recorded_at}
								setDate={(date) => setFormData({ ...formData, recorded_at: date })}
								placeholder='Select when the payment was recorded (optional)'
								maxDate={new Date()}
							/>
							<p className='text-xs text-muted-foreground'>Optionally select the date when this payment was actually received</p>
							{errors.recorded_at && <p className='text-xs text-red-500'>{errors.recorded_at}</p>}
						</div>
						{descriptionField}
					</div>
				);
			case PAYMENT_METHOD_TYPE.CARD:
			case PAYMENT_METHOD_TYPE.ACH:
				return (
					<div className='space-y-3'>
						<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
							<div className='text-sm text-gray-600'>
								<span className='font-medium'>{formData.payment_method_type}</span> payment processing is not available yet. Please use
								offline payment method instead.
							</div>
						</div>
					</div>
				);
			case PAYMENT_METHOD_TYPE.PAYMENT_LINK:
				return <div className='space-y-3'>{descriptionField}</div>;
			default:
				return null;
		}
	};

	return (
		<>
			<Dialog
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				title='Record Payment'
				className='sm:max-w-[500px]'
				titleClassName='text-lg font-semibold text-[#18181B]'>
				<div className='space-y-4 py-4'>
					<Input
						label='Amount'
						placeholder='0.00'
						variant='formatted-number'
						inputPrefix={getCurrencySymbol(currency)}
						value={formData.amount.toString()}
						onChange={(value) => setFormData({ ...formData, amount: Number(value) || 0 })}
						error={errors.amount}
						description={max_amount ? `Amount Due:${getCurrencySymbol(currency)}${max_amount}` : undefined}
					/>

					<Select
						label='Payment Method'
						placeholder='Select payment method'
						options={paymentMethodOptions}
						value={formData.payment_method_type}
						onChange={(value) => {
							setFormData({
								...formData,
								payment_method_type: value as PAYMENT_METHOD_TYPE,
								selected_connection_id: '',
								reference_id: '',
								description: '',
								recorded_at: undefined,
							});
						}}
						error={errors.payment_method_type}
					/>

					{formData.payment_method_type === PAYMENT_METHOD_TYPE.PAYMENT_LINK && providerOptions.length > 0 && (
						<Select
							label='Payment Provider'
							placeholder='Select payment provider'
							options={providerOptions}
							value={formData.selected_connection_id}
							onChange={(connectionId) => setFormData({ ...formData, selected_connection_id: connectionId })}
							error={errors.selected_connection_id}
						/>
					)}

					{formData.payment_method_type && renderPaymentMethodFields()}

					<div className='pt-2 flex justify-end'>
						<Button variant='outline' onClick={() => onOpenChange(false)} className='mr-2'>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isPending || !formData.payment_method_type} isLoading={isPending}>
							{isPending && <LoaderCircleIcon className='w-4 h-4 animate-spin mr-2' />}
							Record
						</Button>
					</div>
				</div>
			</Dialog>
			<PaymentUrlSuccessDialog
				isOpen={paymentUrlPopup.isOpen}
				paymentUrl={paymentUrlPopup.paymentUrl}
				isCopied={paymentUrlPopup.isCopied}
				onClose={handleCloseUrlPopup}
				onCopyUrl={handleCopyUrl}
				onGoToLink={handleGoToLink}
			/>
		</>
	);
};

export default RecordPaymentTopup;
