export const validateIp = (ip: string) => {
	const parts = ip.split(/[.:]/);

	if (parts.length === 4) {
		// Check IPv4 parts
		for (const part of parts) {
			const num = parseInt(part);

			if (isNaN(num) || num < 0 || num > 255) {
				return false;
			}
		}

		return true;
	} else if (parts.length >= 3) {
		// Check IPv6 parts
		for (const part of parts) {
			if (part !== '' && !/^[0-9a-fA-F]{1,4}$/.test(part)) {
				return false;
			}
		}

		return true;
	}

	return false;
};
