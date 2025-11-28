interface AddonCodegenParameters {
	codegen?: {
		/**
		 * Custom test-id selector to use for generating `findByTestId` and similar queries
		 * @deprecated define testIdAttribute via configure from storybook/test instead
		 * @example
		 * ```
		 * import {configure} from 'storybook/test';
		 *
		 * configure({
		 *   testIdAttribute: 'my-custom-attribute',
		 * });
		 * ```
		 */
		testIdAttribute?: string;
		/** Use new test syntax in Storybook CSF */
		useNewTestSyntax?: boolean;
	};
}

export interface AddonCodegenTypes {
	parameters: AddonCodegenParameters;
}
