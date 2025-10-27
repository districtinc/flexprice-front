import { AxiosClient } from '@/core/axios/verbs';
import {
	GetCostAnalyticsRequest,
	GetCostAnalyticsResponse,
	GetCombinedAnalyticsRequest,
	GetCombinedAnalyticsResponse,
} from '@/types/dto/CostAnalytics';

class CostAnalyticsApi {
	private static baseUrl = '/analytics';

	/**
	 * Get cost analytics for customers and costsheets
	 * @Summary Get cost analytics
	 * @Description Retrieve cost analytics with breakdown by meter, customer, and time. If start_time and end_time are not provided, defaults to last 7 days.
	 * @param payload Cost analytics request (start_time/end_time optional - defaults to last 7 days)
	 * @returns Cost analytics response
	 */
	public static async getCostAnalytics(payload: GetCostAnalyticsRequest): Promise<GetCostAnalyticsResponse> {
		return await AxiosClient.post<GetCostAnalyticsResponse>(`${this.baseUrl}/cost`, payload);
	}

	/**
	 * Get combined cost and revenue analytics with derived metrics
	 * @Summary Get combined revenue and cost analytics
	 * @Description Retrieve combined analytics with ROI, margin, and detailed breakdowns. If start_time and end_time are not provided, defaults to last 7 days.
	 * @param payload Combined analytics request (start_time/end_time optional - defaults to last 7 days)
	 * @returns Combined analytics response with ROI, margin, and cost analytics
	 */
	public static async getCombinedAnalytics(payload: GetCombinedAnalyticsRequest): Promise<GetCombinedAnalyticsResponse> {
		return Promise.resolve(dummydata);
		return await AxiosClient.post<GetCombinedAnalyticsResponse>(`${this.baseUrl}/combined`, payload);
	}
}

export default CostAnalyticsApi;

const dummydata: any = {
	cost_analytics: [
		{
			meter_id: 'meter_01K8FJSTJ458PY4NEDAPS1WA84',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '0',
			total_quantity: '0',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8FK2821H8Q27REZGMPC7H5Z',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8FJSTJ458PY4NEDAPS1WA84',
				event_name: 'api_call_2',
				name: 'Feat 2',
				aggregation: {
					type: 'SUM',
					field: 'data',
					multiplier: '1',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T06:20:28.612551Z',
				updated_at: '2025-10-26T06:20:28.612551Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
		{
			meter_id: 'meter_01K8GEC865C4NG2N2HCVB3S3SS',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '7156',
			total_quantity: '14312',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8GEEPK4J2J7AXZEPEE8Q4QQ',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8GEC865C4NG2N2HCVB3S3SS',
				event_name: 'api_feature_new',
				name: 'Feture New',
				aggregation: {
					type: 'SUM',
					field: 'data',
					multiplier: '1',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T14:22:23.941867Z',
				updated_at: '2025-10-26T14:22:23.941867Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
		{
			meter_id: 'meter_01K8GBVWRQP7E3MBDGD32KAY2T',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '0',
			total_quantity: '0',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8GD0SPF44VZ605DQFXX8XZD',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8GBVWRQP7E3MBDGD32KAY2T',
				event_name: 'api_weighted_sum',
				name: 'Feat weigh Sum',
				aggregation: {
					type: 'SUM',
					field: 'data',
					multiplier: '1',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T13:38:30.807416Z',
				updated_at: '2025-10-26T13:38:30.807416Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
		{
			meter_id: 'meter_01K8FJV1X17YV0384GJRSF8TW8',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '0',
			total_quantity: '0',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8FK2820FGFRM7K06ADJDBFQ',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8FJV1X17YV0384GJRSF8TW8',
				event_name: 'feat_max',
				name: 'feat max',
				aggregation: {
					type: 'MAX',
					field: 'data',
					multiplier: '1',
					bucket_size: 'HOUR',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T06:21:08.897834Z',
				updated_at: '2025-10-26T06:21:08.897834Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
		{
			meter_id: 'meter_01K8FJS874FN2486CHQSBZ2TJJ',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '0',
			total_quantity: '0',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8FK2821H8Q27REZGMVN7K1X',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8FJS874FN2486CHQSBZ2TJJ',
				event_name: 'api_call',
				name: 'Feat 1',
				aggregation: {
					type: 'SUM',
					field: 'data',
					multiplier: '1',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T06:20:09.828935Z',
				updated_at: '2025-10-26T06:20:09.828935Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
		{
			meter_id: 'meter_01K8FJTAHNAS017SD5TX4BDRHH',
			customer_id: 'cust_01K8GEF9SPWM799Q20NB8T414K',
			external_customer_id: 'cust-customer-3',
			total_cost: '0',
			total_quantity: '0',
			total_events: 0,
			currency: 'USD',
			price_id: 'price_01K8FK2820FGFRM7K06C0FY6Q3',
			costsheet_v2_id: 'cost_v2_01K8FK06RX2A9A0WXNQ9D0C6Y8',
			meter: {
				id: 'meter_01K8FJTAHNAS017SD5TX4BDRHH',
				event_name: 'feat_3',
				name: 'Feat 3',
				aggregation: {
					type: 'COUNT',
					multiplier: '1',
				},
				filters: [],
				reset_usage: 'BILLING_PERIOD',
				environment_id: 'env_01K8FJRJ3BHPD2R8VTB80EBYW0',
				tenant_id: '00000000-0000-0000-0000-000000000000',
				status: 'published',
				created_at: '2025-10-26T06:20:44.981883Z',
				updated_at: '2025-10-26T06:20:44.981883Z',
				created_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
				updated_by: 'dde9a118-f186-45a6-969b-a9dab4590a75',
			},
		},
	],
	total_revenue: '0',
	total_cost: '7156',
	margin: '-7156',
	margin_percent: '0',
	roi: '-1',
	roi_percent: '-100',
	currency: 'USD',
	start_time: '2025-10-19T16:15:31.389923Z',
	end_time: '2025-10-26T16:15:31.389923Z',
};
