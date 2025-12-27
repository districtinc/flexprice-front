import { Price, PRICE_UNIT_TYPE } from '@/models/Price';
import { BILLING_MODEL, PRICE_TYPE } from '@/models/Price';
import { PriceUnit } from '@/models/PriceUnit';
import { getCurrencySymbol } from './helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';

// Helper to get the appropriate symbol for display
const getDisplaySymbol = (price: Price & { pricing_unit?: PriceUnit }): string => {
	// Priority 1: Use pricing_unit.symbol from PriceResponse if available (preferred - has actual symbol like "₿", "€", etc.)
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.pricing_unit?.symbol) {
		return price.pricing_unit.symbol;
	}

	// Priority 2: Fall back to price_unit_config.price_unit (code string like "BTC", "TOK")
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && price.price_unit_config?.price_unit) {
		return price.price_unit_config.price_unit;
	}

	// Priority 3: Use currency symbol for FIAT currencies
	return getCurrencySymbol(price.currency);
};

// Helper to get the appropriate amount for display
const getDisplayAmount = (price: Price): string => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		// For custom price units, prefer price_unit_amount or price_unit_config.amount
		return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
	}
	return price.amount || '0';
};

// Helper to get the appropriate tiers for display
const getDisplayTiers = (price: Price) => {
	if (price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM) {
		return price.price_unit_tiers || null;
	}
	return price.tiers;
};

export const getPriceTableCharge = (price: Price & { pricing_unit?: PriceUnit }, normalizedPrice: boolean = true) => {
	const displaySymbol = getDisplaySymbol(price);
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	if (price.type === PRICE_TYPE.FIXED) {
		return `${displaySymbol}${formatAmount(displayAmount)}`;
	} else {
		if (price.billing_model === BILLING_MODEL.PACKAGE) {
			return `${displaySymbol}${formatAmount(displayAmount)} / ${formatAmount((price.transform_quantity as { divide_by: number }).divide_by.toString())} units`;
		} else if (price.billing_model === BILLING_MODEL.FLAT_FEE) {
			return `${displaySymbol}${formatAmount(displayAmount)} / unit`;
		} else if (price.billing_model === BILLING_MODEL.TIERED) {
			const firstTier = displayTiers?.[0];
			return `Starts at ${normalizedPrice ? displaySymbol : displaySymbol}${formatAmount(firstTier?.unit_amount?.toString() || '0')} / unit`;
		} else {
			return price.display_amount || `${displaySymbol}${formatAmount(displayAmount)}`;
		}
	}
};

export const getActualPriceForTotal = (price: Price) => {
	const displayAmount = getDisplayAmount(price);
	const displayTiers = getDisplayTiers(price);

	let result = 0;
	if (price.billing_model === BILLING_MODEL.PACKAGE) {
		result = parseFloat(displayAmount);
	} else if (price.billing_model === BILLING_MODEL.TIERED) {
		result = parseFloat(String(displayTiers?.[0]?.flat_amount || '0'));
	} else {
		result = parseFloat(displayAmount);
	}

	return result;
};

export const calculateDiscountedPrice = (price: Price, coupon: any) => {
	if (!coupon || price.type !== 'FIXED') return null;

	const originalAmount = parseFloat(price.amount);
	let discountedAmount = originalAmount;

	if (coupon.type === 'fixed') {
		// Fixed amount discount
		const discountAmount = parseFloat(coupon.amount_off || '0');
		discountedAmount = Math.max(0, originalAmount - discountAmount);
	} else if (coupon.type === 'percentage') {
		// Percentage discount
		const discountPercentage = parseFloat(coupon.percentage_off || '0');
		discountedAmount = originalAmount * (1 - discountPercentage / 100);
	}

	return {
		originalAmount,
		discountedAmount,
		savings: originalAmount - discountedAmount,
	};
};
