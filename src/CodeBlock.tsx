import { CheckIcon, CopyIcon } from '@storybook/icons';
import { useState } from 'react';
import {
	SyntaxHighlighter,
	TooltipNote,
	WithTooltip,
} from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

const Container = styled.div({
	position: 'relative',
	padding: '11px 15px',
	height: '100%',
	tabSize: '8px',
	pre: {
		margin: 0,
		borderRadius: 0,
	},
});

const CopyIconContainer = styled.div({
	position: 'absolute',
	top: 7,
	right: 7,
	padding: 5,
	cursor: 'pointer',
	zIndex: 1,
	'*': {
		cursor: 'pointer',
	},
});

export function CodeBlock({
	code,
}: {
	code: string;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const [copiedTimeoutId, setCopiedTimeoutId] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	return (
		<Container>
			<CopyIconContainer
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
				<WithTooltip
					as="div"
					hasChrome={false}
					trigger="hover"
					tooltip={<TooltipNote note="Copy" />}
				>
					{isCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
				</WithTooltip>
			</CopyIconContainer>

			<SyntaxHighlighter language={'typescript'}>{code}</SyntaxHighlighter>
		</Container>
	);
}
