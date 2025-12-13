import { BaseModel, Metadata } from './base';
import Customer from './Customer';
import { Subscription } from './Subscription';
import { PAYMENT_STATUS } from '@/constants/payment';
import { TaxApplied } from './Tax';
import Decimal from 'decimal.js';

export interface Invoice extends BaseModel {
	readonly customer_id: string;
	readonly subscription_id: string;
	readonly invoice_type: INVOICE_TYPE;
	readonly invoice_status: INVOICE_STATUS;
	readonly payment_status: PAYMENT_STATUS;
	readonly billing_period: BILLING_CADENCE;
	readonly currency: string;
	readonly invoice_pdf_url: string;
	readonly amount_due: number;
	readonly subtotal: number;
	readonly total: number;
	readonly amount_paid: number;
	readonly amount_remaining: number;
	readonly invoice_number: string;
	readonly idempotency_key: string;
	readonly billing_sequence: number;
	readonly description: string;
	readonly due_date: string;
	readonly period_start: string;
	readonly period_end: string;
	readonly paid_at: string;
	readonly finalized_at: string;
	readonly billing_reason: INVOICE_BILLING_REASON;
	readonly line_items: LineItem[];
	readonly total_tax: number;
	readonly version: number;
	readonly tenant_id: string;
	readonly subscription: Subscription;
	readonly customer?: Customer;
	readonly total_discount?: number;
	readonly taxes?: TaxApplied[];
	readonly total_credits_applied?: Decimal;
}

export interface LineItem extends BaseModel {
	readonly id: string;
	readonly invoice_id: string;
	readonly customer_id: string;
	readonly subscription_id: string;
	readonly price_id: string;
	readonly plan_id: string;
	readonly plan_display_name: string;
	readonly price_type: string;
	readonly display_name: string;
	readonly amount: number;
	readonly quantity: string;
	readonly currency: string;
	readonly period_start: string;
	readonly period_end: string;
	readonly metadata: Metadata;
	readonly credits_applied: Decimal;
	readonly wallet_transaction_id?: string;
	readonly discount_applied: Decimal;
}

export enum INVOICE_TYPE {
	SUBSCRIPTION = 'SUBSCRIPTION',
	ONE_OFF = 'ONE_OFF',
	CREDIT = 'CREDIT',
}

export enum INVOICE_CADENCE {
	ARREAR = 'ARREAR',
	ADVANCE = 'ADVANCE',
}

export enum BILLING_CADENCE {
	RECURRING = 'RECURRING',
	ONETIME = 'ONETIME',
}

export enum INVOICE_STATUS {
	DRAFT = 'DRAFT',
	FINALIZED = 'FINALIZED',
	VOIDED = 'VOIDED',
}

export enum INVOICE_BILLING_REASON {
	SUBSCRIPTION_CREATE = 'SUBSCRIPTION_CREATE',
	SUBSCRIPTION_CYCLE = 'SUBSCRIPTION_CYCLE',
	SUBSCRIPTION_UPDATE = 'SUBSCRIPTION_UPDATE',
	MANUAL = 'MANUAL',
}
