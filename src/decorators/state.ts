import { useParameter } from 'storybook/internal/preview-api';
import { PARAMETER } from '../constants';

const DEFAULTS = {
	testIdAttribute: 'data-testid',
	disableSaveFromUI: false,
};

export const useAddonParameters = () => {
	const parameters = useParameter(PARAMETER) as {
		testIdAttribute?: string;
		disableSaveFromUI?: boolean;
	} | null;

	if (!parameters || typeof parameters !== 'object') {
		return {
			testIdAttribute: DEFAULTS.testIdAttribute,
			disableSaveFromUI: DEFAULTS.disableSaveFromUI,
		};
	}

	return {
		testIdAttribute: parameters.testIdAttribute ?? DEFAULTS.testIdAttribute,
		disableSaveFromUI: parameters.disableSaveFromUI ?? DEFAULTS.disableSaveFromUI,
	};
};
