import { useParameter } from 'storybook/internal/preview-api';
import { getConfig } from 'storybook/test';
import { PARAMETER } from '../constants';

export const useAddonParameters = () => {
	const parameters = useParameter(PARAMETER) as {
		testIdAttribute?: string;
	} | null;
	const testIdAttribute = getConfig().testIdAttribute ?? 'data-testid';

	if (!parameters || typeof parameters !== 'object') {
		return { testIdAttribute };
	}

	return { testIdAttribute: parameters.testIdAttribute ?? testIdAttribute };
};
