import { AddIcon, CheckIcon, CrossIcon, SyncIcon } from '@storybook/icons';
import { Button, Form } from 'storybook/internal/components';
import { styled } from 'storybook/theming';

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
	position: 'relative',
	borderRadius: 4,
	padding: '6px 8px',
	color: theme.textMutedColor,
	'&:not(:disabled)': {
		'&:hover,&:focus-visible': {
			color: theme.color.secondary,
		},
	},
	marginBottom: 1,
	lineHeight: '12px',
}));

export const StyledButtonBigContent = styled.div(
	({
		isHidden,
	}: {
		isHidden: boolean;
	}) => ({
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		opacity: isHidden ? 0 : 1,
	}),
);

export const StyledButtonSmallContent = styled(StyledButtonBigContent)({
	left: 8,
	top: '50%',
	transform: 'translateY(-50%)',
	position: 'absolute',
});

export const AssertionButton = styled(StyledButton)(
	({
		isAsserting,
	}: {
		isAsserting: boolean;
	}) => ({
		backgroundColor: isAsserting ? 'rgba(0, 128, 0, 0.1)' : undefined,
		color: isAsserting ? 'rgb(0, 128, 0)' : undefined,
	}),
);

export const DisabledButton = styled(StyledButton)({
	cursor: 'not-allowed',
});

export const SavedButton = styled(Button)({
	color: 'white',
});

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

export const SaveIconColorful = styled(CheckIcon)(({ theme }) => ({
	width: 12,
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
}));

export const StyledCheckIcon = styled(CheckIcon)({
	width: 12,
});

export const ErrorButton = styled(Button)(({ theme }) => ({
	color: theme.color.negative,
}));

export const ErrorIcon = styled(CrossIcon)(({ theme }) => ({
	color: theme.color.negative,
}));

export const AssertIcon = styled(AddIcon)({
	width: 14,
});
