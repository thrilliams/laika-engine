// adapted from https://stackoverflow.com/a/2117523

/**
 * generates a random UUID. uses `crypto.randomUUID()` if able, or `crypto.getRandomValues()` if not
 * @returns a random version 4 UUID
 */
export function uuid() {
	if (crypto.randomUUID !== undefined) return crypto.randomUUID();
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
		(
			+c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
		).toString(16)
	);
}
