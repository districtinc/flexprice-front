import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import WalletApi from '@/api/WalletApi';
import { Card, Chip, Loader, NoDataCard, Select, ShortPagination } from '@/components/atoms';
import { WalletTransactionsTable } from '@/components/molecules';
import { WALLET_STATUS } from '@/models/Wallet';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Info, Wallet as WalletIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import usePagination from '@/hooks/usePagination';

interface WalletTabProps {
    customerId: string;
}

const getWalletStatusChip = (status: WALLET_STATUS) => {
    const statusConfig: Record<WALLET_STATUS, { label: string; variant: 'success' | 'warning' | 'failed' | 'default' }> = {
        [WALLET_STATUS.ACTIVE]: { label: 'Active', variant: 'success' },
        [WALLET_STATUS.FROZEN]: { label: 'Frozen', variant: 'warning' },
        [WALLET_STATUS.CLOSED]: { label: 'Closed', variant: 'failed' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' as const };
    return <Chip label={config.label} variant={config.variant} />;
};

const WalletTab = ({ customerId }: WalletTabProps) => {
    const { limit, offset } = usePagination();
    const [selectedWalletId, setSelectedWalletId] = useState<string>('');

    // Fetch wallets
    const {
        data: wallets,
        isLoading: walletsLoading,
        isError: walletsError,
    } = useQuery({
        queryKey: ['portal-wallets', customerId],
        queryFn: () => WalletApi.getCustomerWallets({ id: customerId }),
        enabled: !!customerId,
    });

    // Set initial selected wallet
    const activeWallet = selectedWalletId
        ? wallets?.find((w) => w.id === selectedWalletId)
        : wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

    // Fetch wallet balance
    const { data: walletBalance, isLoading: balanceLoading } = useQuery({
        queryKey: ['portal-wallet-balance', activeWallet?.id],
        queryFn: () => WalletApi.getWalletBalance(activeWallet!.id),
        enabled: !!activeWallet?.id,
    });

    // Fetch transactions
    const {
        data: transactionsData,
        isLoading: transactionsLoading,
        isError: transactionsError,
    } = useQuery({
        queryKey: ['portal-wallet-transactions', activeWallet?.id, limit, offset],
        queryFn: () =>
            WalletApi.getWalletTransactions({
                walletId: activeWallet!.id,
                limit,
                offset,
            }),
        enabled: !!activeWallet?.id,
    });

    if (walletsError) {
        toast.error('Failed to load wallets');
    }
    if (transactionsError) {
        toast.error('Failed to load transactions');
    }

    if (walletsLoading) {
        return (
            <div className='py-12'>
                <Loader />
            </div>
        );
    }

    if (!wallets || wallets.length === 0) {
        return <NoDataCard title='Wallet' subtitle='No wallet found for this account' />;
    }

    const currency = activeWallet?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currency);
    // Use real-time balance if available, otherwise fall back to wallet balance
    const balance = Number(walletBalance?.real_time_balance ?? walletBalance?.balance ?? activeWallet?.balance) || 0;
    const conversionRate = Number(walletBalance?.conversion_rate ?? activeWallet?.conversion_rate) || 1;
    // Credit balance represents the balance in currency value
    const creditBalance = Number(walletBalance?.real_time_credit_balance ?? walletBalance?.credit_balance) || balance * conversionRate;

    const walletOptions = wallets.map((w) => ({
        value: w.id,
        label: w.name || `Wallet ${w.id.slice(0, 8)}`,
    }));

    return (
        <div className='space-y-6'>
            {/* Wallet Selector (if multiple wallets) */}
            {wallets.length > 1 && (
                <Select
                    value={activeWallet?.id || ''}
                    onChange={(value) => setSelectedWalletId(value)}
                    options={walletOptions}
                    className='w-full max-w-xs'
                />
            )}

            {/* Wallet Balance Card */}
            <Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
                <div className='flex items-start justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center'>
                            <WalletIcon className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                            <h3 className='text-base font-medium text-zinc-950'>{activeWallet?.name || 'Wallet'}</h3>
                            {activeWallet?.wallet_status && getWalletStatusChip(activeWallet.wallet_status)}
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    {/* Balance */}
                    <div>
                        <div className='flex items-center gap-1.5 mb-2'>
                            <span className='text-sm text-zinc-500'>Balance</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className='h-3.5 w-3.5 text-zinc-400' />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Available credits in your wallet</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        {balanceLoading ? (
                            <div className='h-8 w-24 bg-zinc-100 animate-pulse rounded'></div>
                        ) : (
                            <>
                                <p className='text-2xl font-semibold text-zinc-950'>
                                    {formatAmount(balance.toString())} <span className='text-base font-normal text-zinc-500'>credits</span>
                                </p>
                                <p className='text-sm text-zinc-500 mt-1'>
                                    {currencySymbol}
                                    {formatAmount(creditBalance.toString())} value
                                </p>
                            </>
                        )}
                    </div>

                    {/* Conversion Rate */}
                    {conversionRate !== 1 && (
                        <div>
                            <span className='text-sm text-zinc-500 block mb-2'>Conversion rate</span>
                            <p className='text-lg font-medium text-zinc-950'>
                                1 credit = {currencySymbol}
                                {formatAmount(String(conversionRate))}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Transactions */}
            <Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
                <h3 className='text-base font-medium text-zinc-950 mb-4'>Transaction History</h3>

                {transactionsLoading ? (
                    <div className='animate-pulse space-y-3'>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className='h-12 bg-zinc-100 rounded'></div>
                        ))}
                    </div>
                ) : transactionsData?.items && transactionsData.items.length > 0 ? (
                    <>
                        <WalletTransactionsTable data={transactionsData.items} />
                        <ShortPagination unit='transactions' totalItems={transactionsData.pagination?.total || 0} />
                    </>
                ) : (
                    <div className='text-center py-8 text-zinc-500'>No transactions yet</div>
                )}
            </Card>
        </div>
    );
};

export default WalletTab;
