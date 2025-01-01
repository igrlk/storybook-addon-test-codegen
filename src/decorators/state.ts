import { useParameter } from 'storybook/internal/preview-api';
import { PARAMETER } from '../constants';

export const useAddonParameters = () => {
	const parameters = useParameter(PARAMETER) as {
		testIdAttribute?: string;
	} | null;

	if (!parameters || typeof parameters !== 'object') {
		return { testIdAttribute: 'data-testid' };
	}

	return { testIdAttribute: parameters.testIdAttribute ?? 'data-testid' };
};
