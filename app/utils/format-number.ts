const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number) => numberFormatter.format(value);
