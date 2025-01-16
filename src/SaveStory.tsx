import { SaveIcon } from '@storybook/icons';
import {
	IconButton,
	TooltipNote,
	WithTooltip,
} from 'storybook/internal/components';
import { useStorybookApi } from 'storybook/internal/manager-api';
import { styled } from 'storybook/internal/theming';
import type { GeneratedCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import type { SaveNewStoryRequestPayload } from './data';

const SaveStoryButtonWrapper = styled(IconButton)(({ theme }) => ({
	color: theme.color.mediumdark,
	borderRadius: theme.appBorderRadius + 2,
}));

export const SaveStoryButton = ({
	code,
}: {
	code: GeneratedCode;
}) => {
	const api = useStorybookApi();

	return (
		<WithTooltip
			placement={'top'}
			hasChrome={false}
			trigger="hover"
			tooltip={<TooltipNote note="Save story" />}
		>
			<SaveStoryButtonWrapper
				onClick={() => {
					const data = api.getCurrentStoryData();

					const payload: SaveNewStoryRequestPayload = {
						code,
						csfId: data.id,
						importPath: data.importPath,
						args: JSON.stringify({}), // TODO send correct args
						name: `New${Date.now()}`,
					};

					api.emit(EVENTS.SAVE_NEW_STORY, payload);
				}}
				variant="outline"
			>
				<SaveIcon size={16} />
			</SaveStoryButtonWrapper>
		</WithTooltip>
	);
};
