import { CheckIcon, CopyIcon } from '@storybook/icons';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { useState } from 'react';
import {
	IconButton,
	SyntaxHighlighter,
	TooltipNote,
	WithTooltip,
} from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

const Container = styled.div(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${theme.appBorderColor}`,
}));

const Label = styled.div<{
	isSticky?: boolean;
}>(({ theme, isSticky }) => ({
	fontSize: theme.typography.size.s1,
	fontWeight: 'bold',
	marginBottom: 4,
	padding: '6px 7px',
	background: theme.barBg,
	borderBottom: `1px solid ${theme.appBorderColor}`,
	position: 'relative',

	...(isSticky
		? {
				position: 'sticky',
				top: 0,
				zIndex: 1,
			}
		: {}),
}));

const Code = styled.div({
	padding: '6px 7px 10px',
	height: '100%',
	tabSize: '8px',
	pre: {
		margin: 0,
		borderRadius: 0,
	},
});

const CopyIconContainer = styled.div({
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	right: 0,
	zIndex: 1,
});

export function CodeBlock({
	name,
	codeLines,
	isSticky,
}: {
	name: string;
	codeLines: string[];
	isSticky?: boolean;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const [copiedTimeoutId, setCopiedTimeoutId] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	const code = codeLines.join('\n');

	return (
		<Container>
			<Label isSticky={isSticky}>
				{name}

				<CopyIconContainer>
					<WithTooltip
						placement={'top'}
						as="div"
						hasChrome={false}
						trigger="hover"
						tooltip={<TooltipNote note="Copy" />}
					>
						<IconButton
							onClick={() =>
								navigator.clipboard.writeText(code).then(() => {
									setIsCopied(true);
									if (copiedTimeoutId) {
										clearTimeout(copiedTimeoutId);
									}

									setCopiedTimeoutId(
										setTimeout(() => {
											setIsCopied(false);
											setCopiedTimeoutId(null);
										}, 2000),
									);
								})
							}
						>
							{isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
						</IconButton>
					</WithTooltip>
				</CopyIconContainer>
			</Label>

			<Code>
				<SyntaxHighlighter language={'typescript'}>{code}</SyntaxHighlighter>
			</Code>
		</Container>
	);
}
