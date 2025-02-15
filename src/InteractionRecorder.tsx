import { DeleteIcon } from '@storybook/icons';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bar, EmptyTabContent } from 'storybook/internal/components';
import { useChannel, useStorybookApi } from 'storybook/internal/manager-api';
import { useDebounce } from 'use-debounce';
import { CodeBlock } from './CodeBlock';
import { SaveStoryButton } from './SaveStory';
import { combineInteractions } from './codegen/combine-interactions';
import { convertInteractionsToCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import { type Interaction, useInteractions, useIsRecording } from './state';
import {
	CodeBlocksWrapper,
	Container,
	ContentWrapper,
	EmptyStateDescription,
	Group,
	RecordIcon,
	StyledButton,
	StyledSubnav,
	SubnavWrapper,
} from './styles';

export const InteractionRecorder = () => {
	const [interactions, setInteractions] = useInteractions();
	const [isRecording, setIsRecording] = useIsRecording();

	useChannel({
		[EVENTS.INTERACTION]: (interaction: Interaction) => {
			setInteractions((prevInteractions) =>
				JSON.stringify(
					combineInteractions(interaction, JSON.parse(prevInteractions)),
				),
			);
		},
	});

	const toggleRecording = () => setIsRecording(!isRecording);

	const resetInteractions = () => setInteractions(() => JSON.stringify([]));

	const api = useStorybookApi();

	const storyData = api.getCurrentStoryData();

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset events & recording when story changes
	useEffect(() => {
		resetInteractions();
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
							<StyledButton onClick={toggleRecording}>
								<RecordIcon isRecording={isRecording} />
								{isRecording ? 'Stop' : 'Start'} recording
							</StyledButton>

							<StyledButton onClick={resetInteractions} disabled={!code.play.length}>
								<DeleteIcon />
								Reset
							</StyledButton>
						</Group>

						{code.play.length > 0 && <SaveStoryButton code={code} />}
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

				{code.play.length === 0 && isRecording && (
					<EmptyTabContent
						title="Recording is in progress..."
						description="Interact with the story to record events."
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
