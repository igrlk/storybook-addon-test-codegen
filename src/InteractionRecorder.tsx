import { DeleteIcon } from '@storybook/icons';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Bar, EmptyTabContent } from 'storybook/internal/components';
import { useChannel, useStorybookApi } from 'storybook/internal/manager-api';
import { useDebounce } from 'use-debounce';
import { CodeBlock } from './CodeBlock';
import { combineInteractions } from './codegen/combine-interactions';
import { convertInteractionsToCode } from './codegen/interactions-to-code';
import { EVENTS } from './constants';
import { type Interaction, useIsRecording, useRecorderState } from './state';
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
	const [{ interactions }, setState] = useRecorderState();
	const [isRecording, setIsRecording] = useIsRecording();

	useChannel({
		[EVENTS.INTERACTION]: (interaction: Interaction) => {
			setState((state) => ({
				...state,
				interactions: combineInteractions(interaction, state.interactions),
			}));
		},
	});

	const toggleRecording = () => setIsRecording(!isRecording);

	const resetEvents = () =>
		setState((state) => ({
			...state,
			interactions: [],
		}));

	const api = useStorybookApi();

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset events & recording when story changes
	useEffect(() => {
		resetEvents();
	}, [api.getCurrentStoryData()?.id]);

	const [debouncedInteractions] = useDebounce(interactions, 100);
	const code = useMemo(
		() => convertInteractionsToCode(debouncedInteractions),
		[debouncedInteractions],
	);

	const containerRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (containerRef.current?.parentElement?.style) {
			containerRef.current.parentElement.style.height = '100%';
		}
	}, []);

	const codeBlocksRef = useRef<{
		element: HTMLDivElement | null;
		isScrolledToBottom: boolean;
	}>({
		element: null,
		isScrolledToBottom: true,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll the container to bottom when code changes
	useLayoutEffect(() => {
		const { element, isScrolledToBottom } = codeBlocksRef.current;
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
	}, [code, codeBlocksRef.current.isScrolledToBottom]);

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

							<StyledButton onClick={resetEvents} disabled={!code.play.length}>
								<DeleteIcon />
								Reset
							</StyledButton>
						</Group>
					</StyledSubnav>
				</Bar>
			</SubnavWrapper>

			<ContentWrapper
				ref={(div) => {
					codeBlocksRef.current.element = div;
				}}
				onScroll={(e) => {
					const { scrollTop, scrollHeight, clientHeight } =
						e.target as HTMLDivElement;

					codeBlocksRef.current.isScrolledToBottom =
						scrollTop + clientHeight >= scrollHeight;
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
