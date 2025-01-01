import { Button } from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

export const Container = styled.div(({ theme }) => ({
	height: '100%',
	background: theme.background.content,
	display: 'flex',
	flexDirection: 'column',
}));

export const SubnavWrapper = styled.div(({ theme }) => ({
	background: theme.background.app,
	borderBottom: `1px solid ${theme.appBorderColor}`,
	position: 'sticky',
	top: 0,
	zIndex: 1,
}));

export const StyledSubnav = styled.nav(({ theme }) => ({
	height: 40,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingLeft: 15,
}));

export const StyledButton = styled(Button)(({ theme }) => ({
	borderRadius: 4,
	padding: 6,
	color: theme.textMutedColor,
	'&:not(:disabled)': {
		'&:hover,&:focus-visible': {
			color: theme.color.secondary,
		},
	},
	marginBottom: 1,
	lineHeight: '12px',
}));

export const Group = styled.div({
	display: 'flex',
	alignItems: 'center',
	gap: '9px',
});

export const EmptyStateDescription = styled.div(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
}));

export const RecordIcon = styled.span<{ isRecording: boolean }>(
	({ theme, isRecording }) => ({
		width: 14,
		height: 14,
		borderRadius: '50%',
		backgroundColor: isRecording ? theme.color.negative : theme.color.secondary,
		display: 'inline-block',
	}),
);
