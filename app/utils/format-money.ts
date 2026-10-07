import { formatNumber } from '~/utils/format-number';

export const formatMoney = (value: number) => `$${formatNumber(value)}`;
