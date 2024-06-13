export const formatDate = (date: string | Date) => {
	if (!date) {
		return null;
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;
};
