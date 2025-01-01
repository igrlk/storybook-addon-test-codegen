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

			const topWithOffset = top + window.scrollY;
			const leftWithOffset = left + window.scrollX;

			element = document.createElement('div');
			element.style.position = 'absolute';
			element.style.zIndex = '2147483647';
			element.style.top = `${topWithOffset}px`;
			element.style.left = `${leftWithOffset}px`;
			element.style.width = `${width}px`;
			element.style.height = `${height}px`;
			element.style.pointerEvents = 'none';
			element.style.background = 'rgba(255, 0, 0, 0.5)';
			element.style.borderRadius =
				window.getComputedStyle(targetElement).borderRadius;

			const tooltip = document.createElement('div');
			tooltip.style.position = 'absolute';
			tooltip.style.top = 'calc(100% + 5px)';
			tooltip.style.left = '0';
			tooltip.style.padding = '4px 10px';
			tooltip.style.background = 'white';
			tooltip.style.borderRadius = '4px';
			tooltip.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.2)';
			tooltip.style.fontSize = '12px';
			tooltip.style.whiteSpace = 'nowrap';
			tooltip.style.fontFamily =
				'"Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
			tooltip.textContent = `${query.method}(${argsToString(query.args)})${query.nth ? `[${query.nth}]` : ''}`;
			tooltip.setAttribute('data-no-query', 'true');

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
