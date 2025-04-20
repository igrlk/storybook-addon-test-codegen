export const argsToString = (args: unknown[]): string =>
	args
		.map((arg) => {
			if (arg === null) {
				return 'null';
			}

			if (arg === undefined) {
				return 'undefined';
			}

			if (typeof arg === 'string') {
				return wrapInQuotes(arg);
			}

			if (typeof arg === 'object' && arg !== null) {
				if (Array.isArray(arg)) {
					return `[${arg
						.map((item) => (typeof item === 'string' ? wrapInQuotes(item) : item))
						.join(', ')}]`;
				}

				return `{ ${Object.entries(arg)
					.reduce<string[]>((acc, [key, value]) => {
						if (typeof value === 'object' && value !== null) {
							acc.push(`${key}: ${argsToString([value])}`);
						} else {
							acc.push(
								`${key}: ${typeof value === 'string' ? wrapInQuotes(value) : value}`,
							);
						}
						return acc;
					}, [])
					.join(', ')} }`;
			}

			return String(arg);
		})
		.join(', ');

export const wrapInQuotes = (str: string): string => {
	// Escape backslashes first
	const result = str.replace(/\\/g, '\\\\');

	if (result.includes('\n')) {
		// For multiline strings, use backticks and escape any backticks in the content
		return `\`${result.replace(/`/g, '\\`')}\``;
	}

	// For single line strings, use single quotes and escape any single quotes in the content
	return `'${result.replace(/'/g, "\\'")}'`;
};
