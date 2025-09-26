import { DeleteIcon } from '@storybook/icons';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bar, EmptyTabContent } from 'storybook/internal/components';
import {
	useChannel,
	useParameter,
	useStorybookApi,
} from 'storybook/manager-api';
import { useDebounce } from 'use-debounce';
import { CodeBlock } from './CodeBlock';
import { SaveStoryButton } from './SaveStory';
import { combineInteractions } from './codegen/combine-interactions';
import {
	convertInteractionsToCode,
	isPlay,
} from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import { useAddonParameters } from './decorators/state';
import {
	type Interaction,
	useInteractions,
	useIsAsserting,
	useIsRecording,
} from './state';
import {
	AssertIcon,
	AssertionButton,
	CodeBlocksWrapper,
	Container,
	ContentWrapper,
	EmptyStateDescription,
	Group,
	RecordIcon,
	StyledButton,
	StyledButtonBigContent,
	StyledButtonSmallContent,
	StyledSubnav,
	SubnavWrapper,
} from './styles';

export const InteractionRecorder = () => {
	const [interactions, setInteractions] = useInteractions();
	const [isRecording, setIsRecording] = useIsRecording();
	const [isAsserting, setIsAsserting] = useIsAsserting();

	useChannel({
		[EVENTS.INTERACTION]: (interaction: Interaction) => {
			setInteractions((prevInteractions) =>
				JSON.stringify(
					combineInteractions(interaction, JSON.parse(prevInteractions)),
				),
			);
		},
	});

	const toggleRecording = () => {
		// Turn off assertion mode when stopping recording
		if (isRecording && isAsserting) {
			setIsAsserting(false);
		}
		setIsRecording(!isRecording);
	};

	const toggleAsserting = () => setIsAsserting(!isAsserting);

	const resetInteractions = () => setInteractions(() => JSON.stringify([]));

	const api = useStorybookApi();

	const storyData = api.getCurrentStoryData();

	const turnOffRecording = () => {
		setIsRecording(false);
		setIsAsserting(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset events & recording when story changes
	useEffect(() => {
		resetInteractions();
		turnOffRecording();
	}, [storyData?.id]);

	const hasTypescript = ['.ts', '.tsx'].some((ext) =>
		storyData?.importPath.endsWith(ext),
	);
	const { useNewTestSyntax } = useAddonParameters(useParameter);

	const [debouncedInteractions] = useDebounce(interactions, 100);
	const { generatedCode, codeToDisplay } = useMemo(() => {
		const generatedCode = convertInteractionsToCode({
			interactions: JSON.parse(debouncedInteractions),
			hasTypescript,
			useNewTestSyntax,
		});

		// If using new test syntax and there are test lines, wrap them
		if (
			useNewTestSyntax &&
			!isPlay(generatedCode) &&
			generatedCode.tests.length > 0
		) {
			const storyName = storyData?.name || 'Story';
			const parametersString =
				generatedCode.parameters.length > 0
					? `{ ${generatedCode.parameters.join(', ')} }`
					: '{}';

			return {
				generatedCode,
				codeToDisplay: {
					...generatedCode,
					tests: [
						{ text: `${storyName}.test('test', async (${parametersString}) => {` },
						...generatedCode.tests.map((testLine) => ({
							text: `\t${testLine.text}`,
							warning: testLine.warning,
						})),
						{ text: '});' },
					],
				},
			};
		}

		return { generatedCode, codeToDisplay: generatedCode };
	}, [debouncedInteractions, hasTypescript, useNewTestSyntax, storyData?.name]);

	const containerRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (containerRef.current?.parentElement?.style) {
			containerRef.current.parentElement.style.height = '100%';
		}
	}, []);

	const codeBlocksRef = useRef<HTMLDivElement | null>(null);
	const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll the container to bottom when code changes
	useLayoutEffect(() => {
		const element = codeBlocksRef.current;
		if (!element || !isScrolledToBottom) {
			return;
		}

		const observer = new MutationObserver(() => {
			if (isScrolledToBottom) {
				setTimeout(() => {
					element.scrollTop = element.scrollHeight;
				});
			}
		});

		observer.observe(element, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, [codeToDisplay, isScrolledToBottom]);

	const hasCodeLines = isPlay(codeToDisplay)
		? codeToDisplay.play.length > 0
		: codeToDisplay.tests.length > 0;

	return (
		<Container ref={containerRef}>
			<SubnavWrapper>
				<Bar>
					<StyledSubnav>
						<Group>
							<StyledButton onClick={toggleRecording}>
								<StyledButtonBigContent isHidden={isRecording}>
									<RecordIcon isRecording={false} />
									Start recording
								</StyledButtonBigContent>
								<StyledButtonSmallContent isHidden={!isRecording}>
									<RecordIcon isRecording={true} />
									Stop recording
								</StyledButtonSmallContent>
							</StyledButton>

							<AssertionButton
								disabled={!isRecording}
								onClick={toggleAsserting}
								isAsserting={isAsserting}
							>
								<AssertIcon />
								{isAsserting ? 'Choose element' : 'Add assertion'}
							</AssertionButton>

							<StyledButton onClick={resetInteractions} disabled={!hasCodeLines}>
								<DeleteIcon />
								Reset
							</StyledButton>
						</Group>

						{hasCodeLines && (
							<SaveStoryButton
								code={generatedCode}
								turnOffRecording={turnOffRecording}
							/>
						)}
					</StyledSubnav>
				</Bar>
			</SubnavWrapper>

			<ContentWrapper
				ref={codeBlocksRef}
				onScroll={(e) => {
					const { scrollTop, scrollHeight, clientHeight } =
						e.target as HTMLDivElement;

					setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight);
				}}
			>
				{!hasCodeLines && !isRecording && (
					<EmptyTabContent
						title="No interactions have been recorded."
						description={
							<EmptyStateDescription>
								Click the record button
								<RecordIcon
									isRecording={false}
									onClick={toggleRecording}
									style={{
										cursor: 'pointer',
									}}
								/>
								to start recording.
							</EmptyStateDescription>
						}
					/>
				)}

				{!hasCodeLines && isRecording && (
					<EmptyTabContent
						title="Recording is in progress..."
						description={
							isAsserting
								? 'Click on elements to record assertions.'
								: 'Interact with the story to record events.'
						}
					/>
				)}

				{hasCodeLines && (
					<CodeBlocksWrapper>
						{codeToDisplay.imports.length > 0 && (
							<CodeBlock name="Imports" codeLines={codeToDisplay.imports} />
						)}

						<CodeBlock
							name={`${useNewTestSyntax ? 'Test' : 'Play'} Function`}
							codeLines={
								isPlay(codeToDisplay) ? codeToDisplay.play : codeToDisplay.tests
							}
							isSticky
						/>
					</CodeBlocksWrapper>
				)}
			</ContentWrapper>
		</Container>
	);
};
