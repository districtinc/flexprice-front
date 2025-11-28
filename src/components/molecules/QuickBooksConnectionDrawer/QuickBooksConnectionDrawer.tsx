import { FC, useState, useEffect } from 'react';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { useMutation } from '@tanstack/react-query';
import ConnectionApi from '@/api/ConnectionApi';
import toast from 'react-hot-toast';
import { CONNECTION_PROVIDER_TYPE, Connection } from '@/models';

interface QuickBooksConnection extends Connection {
	encrypted_secret_data?: {
		realm_id?: string;
		environment?: 'sandbox' | 'production';
		income_account_id?: string;
	};
	sync_config?: {
		invoice?: { inbound: boolean; outbound: boolean };
	};
}

interface QuickBooksConnectionDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	connection?: QuickBooksConnection;
	onSave: (connection: Connection) => void;
}

interface QuickBooksFormData {
	name: string;
	client_id: string;
	client_secret: string;
	redirect_uri: string;
	environment: 'sandbox' | 'production';
	income_account_id: string;
	sync_config: {
		invoice: boolean;
	};
}

const QuickBooksConnectionDrawer: FC<QuickBooksConnectionDrawerProps> = ({ isOpen, onOpenChange, connection, onSave }) => {
	const [formData, setFormData] = useState<QuickBooksFormData>({
		name: '',
		client_id: '',
		client_secret: '',
		redirect_uri: `${window.location.origin}/tools/integrations/quickbooks/oauth/callback`,
		environment: 'sandbox',
		income_account_id: '',
		sync_config: {
			invoice: false,
		},
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	// Reset form on open or when editing connection changes
	useEffect(() => {
		if (isOpen) {
			if (connection) {
				const secretData = connection.encrypted_secret_data || {};
				const syncConfig = connection.sync_config || {};
				setFormData({
					name: connection.name || '',
					client_id: '',
					client_secret: '',
					redirect_uri: `${window.location.origin}/tools/integrations/quickbooks/oauth/callback`,
					environment: (secretData.environment as 'sandbox' | 'production') || 'sandbox',
					income_account_id: secretData.income_account_id || '',
					sync_config: {
						invoice: syncConfig.invoice?.outbound || false,
					},
				});
			} else {
				setFormData({
					name: '',
					client_id: '',
					client_secret: '',
					redirect_uri: `${window.location.origin}/tools/integrations/quickbooks/oauth/callback`,
					environment: 'sandbox',
					income_account_id: '',
					sync_config: {
						invoice: false,
					},
				});
			}
			setErrors({});
		}
	}, [isOpen, connection]);

	const handleChange = (field: keyof QuickBooksFormData, value: string | 'sandbox' | 'production') => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: '' }));
	};

	const handleSyncConfigChange = (category: keyof typeof formData.sync_config, value: boolean) => {
		setFormData((prev) => ({
			...prev,
			sync_config: {
				...prev.sync_config,
				[category]: value,
			},
		}));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Connection name is required';
		}

		// Only validate OAuth credentials when creating new connection
		if (!connection) {
			if (!formData.client_id.trim()) {
				newErrors.client_id = 'Client ID is required';
			}
			if (!formData.client_secret.trim()) {
				newErrors.client_secret = 'Client secret is required';
			}
			if (!formData.redirect_uri.trim()) {
				newErrors.redirect_uri = 'Redirect URI is required';
			}
		}

		// income_account_id is optional
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const { mutate: updateConnection, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			if (!connection) return;

			// Get existing connection to preserve encrypted data
			const existingConnection = await ConnectionApi.Get(connection.id);
			const existingSecretData = (existingConnection as any).encrypted_secret_data || {};

			const payload: any = {
				name: formData.name,
				encrypted_secret_data: {
					provider_type: CONNECTION_PROVIDER_TYPE.QUICKBOOKS,
					...existingSecretData,
					income_account_id: formData.income_account_id || undefined,
				},
				sync_config: {} as Record<string, { inbound: boolean; outbound: boolean }>,
			};

			// Only add invoice config if toggle is true
			if (formData.sync_config.invoice) {
				payload.sync_config.invoice = {
					inbound: false,
					outbound: true,
				};
			}

			return await ConnectionApi.Update(connection.id, payload);
		},
		onSuccess: (response) => {
			toast.success('QuickBooks connection updated successfully');
			if (response) {
				onSave(response);
			}
			onOpenChange(false);
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update connection';
			toast.error(errorMessage);
		},
	});

	const handleSave = () => {
		if (validateForm()) {
			if (connection) {
				updateConnection();
			} else {
				// For new connections, initiate OAuth flow
				initiateOAuth();
			}
		}
	};

	const initiateOAuth = () => {
		// Store form data in sessionStorage to retrieve after OAuth callback
		sessionStorage.setItem(
			'qb_connection_data',
			JSON.stringify({
				name: formData.name,
				client_id: formData.client_id,
				client_secret: formData.client_secret,
				redirect_uri: formData.redirect_uri,
				environment: formData.environment,
				income_account_id: formData.income_account_id,
				sync_config: formData.sync_config,
			}),
		);

		// Generate state for CSRF protection
		const state = generateState();
		sessionStorage.setItem('qb_oauth_state', state);

		// Build OAuth URL
		const scope = 'com.intuit.quickbooks.accounting';
		const responseType = 'code';

		const authUrl =
			`https://appcenter.intuit.com/connect/oauth2?` +
			`client_id=${encodeURIComponent(formData.client_id)}` +
			`&scope=${encodeURIComponent(scope)}` +
			`&redirect_uri=${encodeURIComponent(formData.redirect_uri)}` +
			`&response_type=${responseType}` +
			`&state=${state}`;

		// Close drawer and redirect to QuickBooks OAuth
		onOpenChange(false);
		window.location.href = authUrl;
	};

	const generateState = (): string => {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	};

	const isPending = isUpdating;

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={connection ? 'Edit QuickBooks Connection' : 'Connect to QuickBooks'}
			description={
				connection
					? 'Update your QuickBooks connection settings.'
					: 'Configure your QuickBooks integration. You will be redirected to QuickBooks to authorize the connection.'
			}
			size='lg'>
			<div className='space-y-6 mt-4'>
				{/* Connection Name */}
				<Input
					label='Connection Name'
					placeholder='e.g., QuickBooks Production, QuickBooks Sandbox'
					value={formData.name}
					onChange={(value) => handleChange('name', value)}
					error={errors.name}
					description='A friendly name to identify this QuickBooks connection'
				/>

				{/* Client ID */}
				{!connection && (
					<Input
						label='Client ID'
						placeholder='Enter your QuickBooks OAuth Client ID'
						type='password'
						value={formData.client_id}
						onChange={(value) => handleChange('client_id', value)}
						error={errors.client_id}
						description='Your QuickBooks OAuth Client ID from the Developer Dashboard (Keys & Credentials tab)'
					/>
				)}

				{/* Client Secret */}
				{!connection && (
					<Input
						label='Client Secret'
						placeholder='Enter your QuickBooks OAuth Client Secret'
						type='password'
						value={formData.client_secret}
						onChange={(value) => handleChange('client_secret', value)}
						error={errors.client_secret}
						description='Your QuickBooks OAuth Client Secret from the Developer Dashboard (Keys & Credentials tab)'
					/>
				)}

				{/* Redirect URI */}
				{!connection && (
					<Input
						label='Redirect URI'
						placeholder='https://yourdomain.com/tools/integrations/quickbooks/oauth/callback'
						value={formData.redirect_uri}
						onChange={(value) => handleChange('redirect_uri', value)}
						error={errors.redirect_uri}
						description='OAuth callback URL. This MUST match exactly what you configured in QuickBooks Developer Dashboard under Redirect URIs'
					/>
				)}

				{/* Environment Selection */}
				{!connection && (
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>Environment</label>
						<div className='flex gap-4'>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='radio'
									name='environment'
									value='sandbox'
									checked={formData.environment === 'sandbox'}
									onChange={(e) => handleChange('environment', e.target.value as 'sandbox' | 'production')}
									className='w-4 h-4'
								/>
								<span className='text-sm text-gray-700'>Sandbox</span>
							</label>
							<label className='flex items-center gap-2 cursor-pointer'>
								<input
									type='radio'
									name='environment'
									value='production'
									checked={formData.environment === 'production'}
									onChange={(e) => handleChange('environment', e.target.value as 'sandbox' | 'production')}
									className='w-4 h-4'
								/>
								<span className='text-sm text-gray-700'>Production</span>
							</label>
						</div>
						<p className='text-xs text-gray-500 mt-1'>Select the QuickBooks environment you want to connect to</p>
					</div>
				)}

				{/* Income Account ID */}
				<Input
					label='Income Account ID (Optional)'
					placeholder='79'
					value={formData.income_account_id}
					onChange={(value) => handleChange('income_account_id', value)}
					error={errors.income_account_id}
					description="QuickBooks Income Account ID for Items. If left blank, it defaults to QuickBooks' standard income account (ID: 79)."
				/>

				{/* Sync Configuration Section */}
				<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
					<h3 className='text-sm font-medium text-gray-800 mb-3'>Sync Configuration</h3>
					<p className='text-xs text-gray-600 mb-4'>Configure what data to sync between QuickBooks and Flexprice</p>

					<div className='space-y-4'>
						{/* Invoices */}
						<div className='flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg'>
							<div>
								<label className='text-sm font-medium text-gray-700'>Invoices</label>
								<p className='text-xs text-gray-500'>Push to QuickBooks</p>
							</div>
							<Switch checked={formData.sync_config.invoice} onCheckedChange={(checked) => handleSyncConfigChange('invoice', checked)} />
						</div>
					</div>
				</div>

				{/* OAuth Info Box */}
				{!connection && (
					<div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
						<h3 className='text-sm font-medium text-blue-800 mb-2'>OAuth Authorization Required</h3>
						<p className='text-xs text-blue-700'>
							After clicking "Connect to QuickBooks", you will be redirected to QuickBooks to authorize this connection. Make sure you have
							the Client ID and Client Secret ready from your QuickBooks Developer Dashboard.
						</p>
					</div>
				)}

				{/* Connection Info (when editing) */}
				{connection && (
					<div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-gray-600'>Company ID (Realm ID):</span>
								<span className='text-sm font-mono text-gray-900'>{connection.encrypted_secret_data?.realm_id || 'N/A'}</span>
							</div>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-gray-600'>Environment:</span>
								<span className='text-sm capitalize text-gray-900'>{connection.encrypted_secret_data?.environment || 'N/A'}</span>
							</div>
						</div>
						<p className='text-xs text-gray-500 mt-3'>
							Note: OAuth credentials are encrypted and not displayed for security. To update credentials, delete this connection and create
							a new one.
						</p>
					</div>
				)}

				<Spacer className='!h-4' />

				<div className='flex gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)} className='flex-1' disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} className='flex-1' isLoading={isPending} disabled={isPending}>
						{connection ? 'Update Connection' : 'Connect to QuickBooks'}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default QuickBooksConnectionDrawer;
