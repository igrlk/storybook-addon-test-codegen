import { useEffect } from 'storybook/internal/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';
import {
	argsToString,
	generateQuery,
	getClosestInteractiveElement,
} from '../codegen/generate-query';
import { IS_RECORDING_KEY } from '../constants';
import { useAddonParameters } from './state';

export const withHoverOutline: DecoratorFunction = (storyFn, context) => {
	const isRecording = context.globals[IS_RECORDING_KEY];
	const { testIdAttribute } = useAddonParameters();

	useEffect(() => {
		if (!isRecording) {
			return;
		}

		let element: HTMLElement | null = null;
		let observer: MutationObserver | null = null;

		const drawOutline = async (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const targetElement = getClosestInteractiveElement(target) || target;
			const query = await generateQuery(
				document.body,
				targetElement,
				testIdAttribute,
			);

			if (!query) {
				return;
			}

			const { top, left, width, height } = targetElement.getBoundingClientRect();

			const highlightTop = top + window.scrollY;
			const highlightLeft = left + window.scrollX;

			element = document.createElement('div');
			element.style.position = 'absolute';
			element.style.zIndex = '2147483647';
			element.style.top = '0';
			element.style.left = '0';
			element.style.width = '100%';
			element.style.height = '100%';
			element.style.pointerEvents = 'none';

			const highlight = document.createElement('div');
			highlight.style.position = 'absolute';
			highlight.style.top = `${highlightTop}px`;
			highlight.style.left = `${highlightLeft}px`;
			highlight.style.width = `${width}px`;
			highlight.style.height = `${height}px`;
			highlight.style.background = 'rgba(255, 0, 0, 0.5)';
			highlight.style.borderRadius =
				window.getComputedStyle(targetElement).borderRadius;

			const tooltip = document.createElement('div');
			tooltip.style.position = 'absolute';
			tooltip.style.padding = '4px 10px';
			tooltip.style.background = 'white';
			tooltip.style.borderRadius = '4px';
			tooltip.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
			tooltip.style.fontSize = '12px';
			tooltip.style.whiteSpace = 'nowrap';
			tooltip.style.visibility = 'hidden';
			tooltip.style.fontFamily =
				'"Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
			tooltip.textContent = `${query.method}(${argsToString(query.args)})${query.nth === null ? '' : `[${query.nth}]`}`;
			tooltip.setAttribute('data-no-query', 'true');

			element.appendChild(highlight);
			element.appendChild(tooltip);
			document.body.appendChild(element);

			observer = new MutationObserver((mutationsList) => {
				for (const mutation of mutationsList) {
					if (mutation.type === 'childList') {
						for (const removedNode of Array.from(mutation.removedNodes)) {
							if (
								removedNode instanceof HTMLElement &&
								removedNode.contains(targetElement)
							) {
								removeOutline();
								break;
							}
						}
					}
				}
			});

			observer.observe(document.body, { childList: true, subtree: true });

			const highlightRect = highlight.getBoundingClientRect();
			const tooltipRect = tooltip.getBoundingClientRect();
			const OFFSET = 5;

			// If the tooltip goes outside the viewport, push it left if there is enough space
			const rightSpaceOutside =
				highlightLeft + tooltipRect.width - document.documentElement.scrollWidth;
			const hasEnoughRightSpace = rightSpaceOutside <= 0;
			if (!hasEnoughRightSpace) {
				const hasEnoughHorizontalSpace =
					document.documentElement.scrollWidth - tooltipRect.width >= 0;
				if (hasEnoughHorizontalSpace) {
					tooltip.style.left = `${highlightLeft - rightSpaceOutside}px`;
				} else {
					tooltip.style.left = `${highlightLeft}px`;
				}
			} else {
				tooltip.style.left = `${highlightLeft}px`;
			}

			// If the tooltip goes outside the viewport, show it on top if there is enough space
			const hasEnoughBottomSpace =
				highlightTop + highlightRect.height + OFFSET + tooltipRect.height <=
				document.documentElement.scrollHeight;
			if (!hasEnoughBottomSpace) {
				const hasEnoughTopSpace = highlightTop - tooltipRect.height - OFFSET >= 0;
				if (hasEnoughTopSpace) {
					tooltip.style.top = `${highlightTop - tooltipRect.height - OFFSET}px`;
				} else {
					tooltip.style.top = `${highlightTop}px`;
				}
			} else {
				tooltip.style.top = `${highlightTop + highlightRect.height + OFFSET}px`;
			}

			tooltip.style.visibility = 'visible';
		};

		const removeOutline = () => {
			if (observer) {
				observer.disconnect();
				observer = null;
			}

			if (element) {
				document.body.removeChild(element);
				element = null;
			}
		};

		document.body.addEventListener('mouseover', drawOutline);
		document.body.addEventListener('mouseout', removeOutline);

		return () => {
			removeOutline();
			document.body.removeEventListener('mouseover', drawOutline);
			document.body.removeEventListener('mouseout', removeOutline);
		};
	}, [isRecording]);

	return storyFn();
};
