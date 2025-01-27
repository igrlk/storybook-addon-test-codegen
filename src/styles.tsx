import { CheckIcon, SaveIcon, SyncIcon } from '@storybook/icons';
import { Button, Form } from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

export const Container = styled.div(({ theme }) => ({
	height: '100%',
	background: theme.background.content,
	display: 'flex',
	flexDirection: 'column',
}));

export const ContentWrapper = styled.div({
	flex: 1,
	overflow: 'auto',
});

export const SubnavWrapper = styled.div(({ theme }) => ({
	background: theme.background.app,
	borderBottom: `1px solid ${theme.appBorderColor}`,
	position: 'sticky',
	top: 0,
	zIndex: 2,
}));

export const StyledSubnav = styled.nav(({ theme }) => ({
	height: 40,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: '0 15px',
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

export const CodeBlocksWrapper = styled.div({
	padding: '16px',
	display: 'flex',
	flexDirection: 'column',
	gap: '12px',
});

export const SaveContainer = styled.form({
	display: 'flex',
	alignItems: 'center',
	gap: 8,
});

export const SaveIconColorful = styled(SaveIcon)(({ theme }) => ({
	color: theme.color.secondary,
}));

export const SaveInput = styled(Form.Input)(({ theme }) => ({
	paddingLeft: 10,
	paddingRight: 10,
	fontSize: theme.typography.size.s1,
	height: 28,
	minHeight: 'unset',

	...(theme.base === 'light' && {
		color: theme.color.darkest,
	}),

	'::placeholder': {
		color: theme.color.mediumdark,
	},
	'&:invalid:not(:placeholder-shown)': {
		boxShadow: `${theme.color.negative} 0 0 0 1px inset`,
	},
	'&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
		{
			display: 'none',
		},
}));

export const RotatingIcon = styled(SyncIcon)(({ theme }) => ({
	animation: `${theme.animation.rotate360} 1s linear infinite;`,
	marginRight: 2,
}));

export const StyledCheckIcon = styled(CheckIcon)({
	width: 14,
	marginRight: 2,
});
