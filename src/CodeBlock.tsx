import { AlertIcon, CheckIcon, CopyIcon } from '@storybook/icons';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { useState } from 'react';
import { createElement } from 'react-syntax-highlighter';
import {
	IconButton,
	SyntaxHighlighter,
	TooltipNote,
	WithTooltip,
} from 'storybook/internal/components';
import { styled } from 'storybook/theming';
import type {
	GeneratedCodeLine,
	Warning,
} from './codegen/interactions-to-code';

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

const WarningButton = styled(IconButton)(({ theme }) => ({
	padding: 0,
	width: 20,
	height: 20,
	marginRight: 4,
}));

const WarningIcon = styled(AlertIcon)(({ theme }) => ({
	color: theme.color.warning,
	width: 12,
	height: 12,
}));

export function CodeBlock({
	name,
	codeLines,
	isSticky,
}: {
	name: string;
	codeLines: GeneratedCodeLine[];
	isSticky?: boolean;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const [copiedTimeoutId, setCopiedTimeoutId] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	// react-syntax-highlighter splits the multiline strings and it breaks the warning display
	// so we need to split the code lines manually
	const splitCodeLines = codeLines.flatMap((line) =>
		line.text.split('\n').map((text, index) => ({
			text,
			warning: line.warning && index === 0 ? line.warning : undefined,
		})),
	);

	const code = splitCodeLines.map(({ text }) => text).join('\n');

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
				<SyntaxHighlighter
					language={'typescript'}
					renderer={({ rows, useInlineStyles }) =>
						rows.map((row, i) => {
							const warning = splitCodeLines[i]?.warning;

							if (warning) {
								const warningIcon: rendererNode = {
									type: 'element',
									tagName: WarningIndicator,
									properties: {
										className: [],
										warning,
									},
									children: [],
								};

								// replace the empty space with the warning icon
								row.children.splice(0, 1, warningIcon);
							} else if (i > 0 && i < rows.length - 1) {
								if (row.children[0].properties) {
									// push each line to the right so that the code is aligned (warnings are displayed on the left)
									row.children[0].properties.style = { marginRight: '16px' };
								}
							}

							return createElement({
								node: row,
								stylesheet: {},
								useInlineStyles,
								key: `code-segement${i}`,
							});
						})
					}
				>
					{code}
				</SyntaxHighlighter>
			</Code>
		</Container>
	);
}

const Title = styled.div(({ theme }) => ({
	fontWeight: theme.typography.weight.bold,
	fontSize: theme.typography.size.s2,
	marginBottom: 12,
}));

const Desc = styled.div(({ theme }) => ({
	color: theme.color.defaultText,
}));

const Message = styled.div(({ theme }) => ({
	color: theme.color.defaultText,
	lineHeight: '18px',
	padding: 15,
	width: 350,
}));

const warningToRender = {
	ROLE_WITHOUT_NAME: {
		title: 'Role without name',
		description: (
			<div>
				<div>
					<strong>getByRole</strong> without name can match any button, making tests
					unreliable.
				</div>
				<div style={{ margin: '8px 0' }}>
					To fix, add <strong>visible text</strong> or <strong>aria-label</strong> to
					your element:
				</div>
				<div style={{ margin: '8px 0' }}>
					<div>
						❌ <code>&lt;button /&gt;</code>
					</div>
					<div>
						✅ <code>&lt;button&gt;Submit&lt;/button&gt;</code>
					</div>
					<div>
						✅ <code>&lt;button aria-label="Submit"&gt;Icon&lt;/button&gt;</code>
					</div>
				</div>
			</div>
		),
	},
	QUERY_SELECTOR: {
		title: 'Query selector usage',
		description: (
			<div>
				<div>
					<strong>querySelector</strong> is fragile and breaks when HTML structure
					changes.
				</div>
				<div style={{ margin: '8px 0' }}>
					To fix, use <strong>semantic HTML</strong> or <strong>aria-label</strong>{' '}
					to make the element accessible:
				</div>
				<div style={{ margin: '8px 0' }}>
					<div>
						❌ <code>&lt;div class="submit-18372"&gt;Submit&lt;/div&gt;</code>
					</div>
					<div>
						✅ <code>&lt;button&gt;Submit&lt;/button&gt;</code>
					</div>
					<div>
						✅ <code>&lt;div aria-label="Submit"&gt;Icon&lt;/div&gt;</code>
					</div>
				</div>
			</div>
		),
	},
	TEST_ID: {
		title: 'Test ID usage',
		description: (
			<div>
				<div>
					<strong>data-testid</strong> elements are not accessible and do not
					resemble how your software is used.
				</div>
				<div style={{ margin: '8px 0' }}>
					To improve, use <strong>semantic HTML</strong> or{' '}
					<strong>aria-label</strong> to make the element accessible:
				</div>
				<div style={{ margin: '8px 0' }}>
					<div>
						❌ <code>&lt;div data-testid="submit"&gt;Submit&lt;/div&gt;</code>
					</div>
					<div>
						✅ <code>&lt;button&gt;Submit&lt;/button&gt;</code>
					</div>
				</div>
			</div>
		),
	},
};

function WarningIndicator({ warning }: { warning: Warning }) {
	const { title, description } = warningToRender[warning];

	return (
		<WithTooltip
			trigger="hover"
			tooltip={
				<Message>
					<Title>{title}</Title>
					<Desc>{description}</Desc>
				</Message>
			}
		>
			<WarningButton>
				<WarningIcon />
			</WarningButton>
		</WithTooltip>
	);
}
