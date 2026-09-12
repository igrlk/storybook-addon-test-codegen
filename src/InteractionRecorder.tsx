import { DeleteIcon } from '@storybook/icons';
// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bar, EmptyTabContent } from 'storybook/internal/components';
import { useChannel, useStorybookApi } from 'storybook/manager-api';
import { useDebounce } from 'use-debounce';
import { CodeBlock } from './CodeBlock';
import { SaveStoryButton } from './SaveStory';
import { combineInteractions } from './codegen/combine-interactions';
import type { GeneratedCode } from './codegen/interactions-to-code';
import { convertInteractionsToCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
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

/**
 * Presentational recorder panel. Everything it renders is derived from props,
 * so it can be mounted in tests and stories without the Storybook manager API.
 */
export const InteractionRecorderView = ({
	code,
	isRecording,
	isAsserting,
	onToggleRecording,
	onToggleAsserting,
	onReset,
	saveButton,
}: {
	code: GeneratedCode;
	isRecording: boolean;
	isAsserting: boolean;
	onToggleRecording: () => void;
	onToggleAsserting: () => void;
	onReset: () => void;
	saveButton?: ReactNode;
}) => {
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
	}, [code, isScrolledToBottom]);

	return (
		<Container ref={containerRef}>
			<SubnavWrapper>
				<Bar>
					<StyledSubnav>
						<Group>
							<StyledButton onClick={onToggleRecording}>
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
								onClick={onToggleAsserting}
								isAsserting={isAsserting}
							>
								<AssertIcon />
								{isAsserting ? 'Choose element' : 'Add assertion'}
							</AssertionButton>

							<StyledButton onClick={onReset} disabled={!code.play.length}>
								<DeleteIcon />
								Reset
							</StyledButton>
						</Group>

						{code.play.length > 0 && saveButton}
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
				{code.play.length === 0 && !isRecording && (
					<EmptyTabContent
						title="No interactions have been recorded."
						description={
							<EmptyStateDescription>
								Click the record button
								<RecordIcon
									isRecording={false}
									onClick={onToggleRecording}
									style={{
										cursor: 'pointer',
									}}
								/>
								to start recording.
							</EmptyStateDescription>
						}
					/>
				)}

				{code.play.length === 0 && isRecording && (
					<EmptyTabContent
						title="Recording is in progress..."
						description={
							isAsserting
								? 'Click on elements to record assertions.'
								: 'Interact with the story to record events.'
						}
					/>
				)}

				{code.play.length > 0 && (
					<CodeBlocksWrapper>
						<CodeBlock name="Imports" codeLines={code.imports} />

						<CodeBlock name="Play Function" codeLines={code.play} isSticky />
					</CodeBlocksWrapper>
				)}
			</ContentWrapper>
		</Container>
	);
};

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
		// Only emit a globals update when there is something to turn off. Unconditional
		// setGlobals on every story change forces a story re-render that can abort the
		// incoming story's play function mid-handoff, showing a false "Bail" status.
		if (isRecording || isAsserting) {
			turnOffRecording();
		}
	}, [storyData?.id]);

	const hasTypescript = ['.ts', '.tsx'].some((ext) =>
		storyData?.importPath.endsWith(ext),
	);

	const [debouncedInteractions] = useDebounce(interactions, 100);
	const code = useMemo(
		() =>
			convertInteractionsToCode(JSON.parse(debouncedInteractions), hasTypescript),
		[debouncedInteractions, hasTypescript],
	);

	return (
		<InteractionRecorderView
			code={code}
			isRecording={isRecording}
			isAsserting={isAsserting}
			onToggleRecording={toggleRecording}
			onToggleAsserting={toggleAsserting}
			onReset={resetInteractions}
			saveButton={
				<SaveStoryButton code={code} turnOffRecording={turnOffRecording} />
			}
		/>
	);
};
