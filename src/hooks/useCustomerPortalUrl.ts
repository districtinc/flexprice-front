import { useMemo } from 'react';
import AuthService from '@/core/auth/AuthService';
import EnvironmentApi from '@/api/EnvironmentApi';
import { RouteNames } from '@/core/routes/Routes';
import toast from 'react-hot-toast';
import { logger } from '@/utils/common/Logger';

/**
 * Custom hook to generate and manage customer portal URL
 * @param customerId - The customer ID to generate portal URL for
 * @returns Object with portalUrl and copyToClipboard function
 */
export const useCustomerPortalUrl = (customerId: string | undefined) => {
	const portalUrl = useMemo(() => {
		if (!customerId) return null;

		try {
			// Get environment ID
			const envId = EnvironmentApi.getActiveEnvironmentId();

			// Build the customer portal URL
			const baseUrl = window.location.origin;
			const portalPath = `${RouteNames.customerPortal}/${customerId}`;
			const url = new URL(portalPath, baseUrl);

			// Note: Token will be added dynamically when needed
			// For now, return URL structure without token
			if (envId) {
				url.searchParams.set('env_id', envId);
			}

			return url.toString();
		} catch (error) {
			logger.error('Failed to generate customer portal URL', error);
			return null;
		}
	}, [customerId]);

	/**
	 * Generates a complete portal URL with token and copies it to clipboard
	 */
	const copyToClipboard = async () => {
		if (!customerId) {
			toast.error('Customer ID is missing');
			return;
		}

		if (!portalUrl) {
			toast.error('Unable to generate portal URL');
			return;
		}

		try {
			// Get Supabase access token
			const token = await AuthService.getAcessToken();
			if (!token) {
				toast.error('Unable to get access token. Please ensure you are logged in.');
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', token);

			// Copy to clipboard
			await navigator.clipboard.writeText(urlWithToken.toString());
			toast.success('Customer portal link copied to clipboard!');
		} catch (error) {
			logger.error('Failed to copy customer portal link', error);
			toast.error('Failed to copy customer portal link. Please try again.');
		}
	};

	/**
	 * Opens the customer portal in a new tab
	 */
	const openInNewTab = async () => {
		if (!customerId) {
			toast.error('Customer ID is missing');
			return;
		}

		if (!portalUrl) {
			toast.error('Unable to generate portal URL');
			return;
		}

		try {
			// Get Supabase access token
			const token = await AuthService.getAcessToken();
			if (!token) {
				toast.error('Unable to get access token. Please ensure you are logged in.');
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', token);

			// Open in new tab
			window.open(urlWithToken.toString(), '_blank', 'noopener,noreferrer');
		} catch (error) {
			logger.error('Failed to open customer portal', error);
			toast.error('Failed to open customer portal. Please try again.');
		}
	};

	return {
		portalUrl,
		copyToClipboard,
		openInNewTab,
	};
};
