import { PARAMETER } from '../constants';

// TODO: We should use this instead:
// import { getConfig } from 'storybook/test';
// But because the code is instrumented, it affects the interactions addon panel negatively so we skip it for now.
const getConfig = () => {
	return {
		testIdAttribute: 'data-testid',
	};
};

export const useAddonParameters = (
	// either from manager-api or preview-api
	useParameter: (parameterKey: string, defaultValue?: unknown) => unknown,
) => {
	const parameters = useParameter(PARAMETER) as {
		testIdAttribute?: string;
		useNewTestSyntax?: boolean;
	} | null;
	const testIdAttribute = getConfig().testIdAttribute ?? 'data-testid';
	const useNewTestSyntax = parameters?.useNewTestSyntax ?? false;

	if (!parameters || typeof parameters !== 'object') {
		return { testIdAttribute, useNewTestSyntax };
	}

	return {
		testIdAttribute: parameters.testIdAttribute ?? testIdAttribute,
		useNewTestSyntax: parameters.useNewTestSyntax ?? useNewTestSyntax,
	};
};
