// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { argsToString } from 'src/codegen/args-to-string';
import {
	useCallback,
	useChannel,
	useEffect,
} from 'storybook/internal/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';
import {
	type ElementQuery,
	generateQuery,
	getClosestInteractiveElement,
} from '../codegen/generate-query';
import { getInteractionEvent } from '../codegen/get-interaction-event';
import {
	DOM_EVENTS,
	EVENTS,
	IS_ASSERTING_KEY,
	IS_RECORDING_KEY,
} from '../constants';
import type { Interaction, InteractionEvent } from '../state';
import { getApplicableAssertions } from './get-applicable-assertions';
import { useAddonParameters } from './state';

export const withInteractionRecorder: DecoratorFunction = (
	storyFn,
	context,
) => {
	const isRecording = context.globals[IS_RECORDING_KEY];
	const isAssertionMode = context.globals[IS_ASSERTING_KEY];
	const { testIdAttribute } = useAddonParameters();
	const emit = useChannel({});

	// Standard interaction listener for clicks, inputs, etc.
	const interactionListener = useCallback<EventListener>(
		async (event) => {
			// Skip events when in assertion mode (they're handled separately)
			if (isAssertionMode) {
				return;
			}

			const interactionEvent = getInteractionEvent(event);
			if (!interactionEvent) {
				return;
			}

			const elementQuery = await generateQuery(
				document.body,
				event.target as HTMLElement,
				testIdAttribute,
			);

			if (!elementQuery) {
				return;
			}

			const listenerEvent: Interaction = {
				elementQuery,
				event: interactionEvent,
			};

			emit(EVENTS.INTERACTION, listenerEvent);
		},
		[isAssertionMode, testIdAttribute],
	);

	// Hover outline and assertion menu functionality
	useEffect(() => {
		if (!isRecording) {
			return;
		}

		// Hover outline and assertion menu state
		let element: HTMLElement | null = null;
		let observer: MutationObserver | null = null;
		let menuElement: HTMLElement | null = null;
		let activeElement: HTMLElement | null = null;
		let activeQuery: ElementQuery | null = null;
		// Track if menu is open
		let isMenuOpen = false;

		const drawOutline = async (event: MouseEvent) => {
			// Skip highlighting if menu is open
			if (isMenuOpen || menuElement) {
				return;
			}

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

			activeElement = targetElement;
			activeQuery = query;

			const { top, left, width, height } = targetElement.getBoundingClientRect();

			const highlightTop = top + window.scrollY;
			const highlightLeft = left + window.scrollX;

			// Remove existing outline before creating a new one
			if (element) {
				document.body.removeChild(element);
				element = null;
			}

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
			highlight.style.background = isAssertionMode
				? 'rgba(0, 128, 0, 0.5)'
				: 'rgba(255, 0, 0, 0.5)';
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

			const queryString = `${query.method}(${argsToString(query.args)})${query.nth === null ? '' : `[${query.nth}]`}`;
			tooltip.textContent = isAssertionMode
				? `expect(${queryString})`
				: queryString;
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

			// Don't reset activeElement/activeQuery as these are needed by the menu
			if (!isMenuOpen) {
				activeElement = null;
				activeQuery = null;
			}
		};

		const removeMenu = () => {
			if (menuElement) {
				// clean up event handlers
				for (const item of menuElement.querySelectorAll('div')) {
					item.onmouseover = null;
					item.onmouseout = null;
					item.onclick = null;
				}

				document.body.removeChild(menuElement);
				menuElement = null;
			}
			isMenuOpen = false;
			activeElement = null;
			activeQuery = null;
		};

		const removeAll = () => {
			removeOutline();
			removeMenu();
		};

		// Create a DOM-based context menu for assertions
		const createAssertionMenu = (
			element: HTMLElement,
			elementQuery: Interaction['elementQuery'],
			position: { x: number; y: number },
		) => {
			// Cancel any existing selection
			window.getSelection()?.removeAllRanges();

			// Mark menu as open
			isMenuOpen = true;

			// Remove any existing menu
			if (menuElement) {
				document.body.removeChild(menuElement);
			}

			// Create the menu container
			menuElement = document.createElement('div');
			menuElement.style.position = 'absolute';
			menuElement.style.zIndex = '2147483647';
			menuElement.style.backgroundColor = 'white';
			menuElement.style.borderRadius = '4px';
			menuElement.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
			menuElement.style.padding = '8px';
			menuElement.style.minWidth = '200px';
			menuElement.style.maxWidth = '300px';
			menuElement.style.fontFamily =
				'"Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
			menuElement.style.fontSize = '13px';

			// Create a menu item for each applicable assertion
			for (const assertion of getApplicableAssertions(element)) {
				const menuItem = document.createElement('div');
				menuItem.style.padding = '6px 10px';
				menuItem.style.cursor = 'pointer';
				menuItem.style.borderRadius = '3px';
				menuItem.style.marginBottom = '2px';

				menuItem.onmouseover = () => {
					menuItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
				};

				menuItem.onmouseout = () => {
					menuItem.style.backgroundColor = 'transparent';
				};

				const displayText = assertion.label;

				// Add value preview for assertions that need values
				if (assertion.args.length) {
					const valueSpan = document.createElement('span');
					valueSpan.style.opacity = '0.6';
					valueSpan.textContent = ` ${argsToString(assertion.args)}`;
					menuItem.textContent = displayText;
					menuItem.appendChild(valueSpan);
				} else {
					menuItem.textContent = displayText;
				}

				// Handle menu item click
				menuItem.onclick = (e) => {
					// Stop propagation to prevent closing the menu
					e.stopPropagation();
					e.preventDefault();

					const event: InteractionEvent = {
						type: 'assertion',
						assertionType: assertion.assertionType,
						args: assertion.args,
					};

					// Send the assertion event
					emit(EVENTS.INTERACTION, { elementQuery, event });

					// Remove the menu
					removeAll();
				};

				menuElement.appendChild(menuItem);
			}

			// Append to DOM
			document.body.appendChild(menuElement);

			// Position menu within viewport
			const menuRect = menuElement.getBoundingClientRect();
			const viewportWidth = document.documentElement.clientWidth;
			const viewportHeight = document.documentElement.clientHeight;

			// Calculate optimal position to keep menu in viewport
			let menuX = position.x;
			let menuY = position.y;

			// Adjust horizontal position if needed
			if (menuX + menuRect.width > viewportWidth) {
				menuX = Math.max(0, viewportWidth - menuRect.width);
			}

			// Adjust vertical position if needed
			if (menuY + menuRect.height > viewportHeight) {
				menuY = Math.max(0, viewportHeight - menuRect.height);
			}

			// Apply calculated position
			menuElement.style.top = `${menuY}px`;
			menuElement.style.left = `${menuX}px`;

			const handleClickOutside = (event: MouseEvent) => {
				if (menuElement && !menuElement.contains(event.target as Node)) {
					document.removeEventListener('mousedown', handleClickOutside);
					removeAll();
				}
			};

			// Use timeout to avoid the current click triggering the handler
			setTimeout(() => {
				document.addEventListener('mousedown', handleClickOutside);
			}, 10);
		};

		const handleGlobalCapture = (event: MouseEvent) => {
			// If not assertion mode, do nothing
			if (!isAssertionMode) {
				return;
			}

			// If the click is inside the menu, do nothing (let the menu handle it)
			if (menuElement?.contains(event.target as Node)) {
				return;
			}

			if (isMenuOpen) {
				// this always happens after opening the menu (pointerdown opens it, then click fires this function)
				// so we just need to not do anything and prevent the event
				if (event.type === 'click') {
					event.preventDefault();
					event.stopPropagation();
				}

				return;
			}

			event.preventDefault();
			event.stopPropagation();

			// Check if we have an active element and query
			if (!activeElement || !activeQuery) {
				return;
			}

			// Create the menu
			createAssertionMenu(activeElement, activeQuery, {
				x: event.clientX + window.scrollX,
				y: event.clientY + window.scrollY,
			});
		};

		const handleMouseout = () => {
			if (!isMenuOpen) {
				removeOutline();
			}
		};

		// Highlight listeners
		document.body.addEventListener('mouseover', drawOutline);
		document.body.addEventListener('mouseout', handleMouseout);

		// Assertion listener
		document.body.addEventListener('pointerdown', handleGlobalCapture, true);
		document.body.addEventListener('click', handleGlobalCapture, true);

		// Interaction listeners
		for (const domEvent of DOM_EVENTS) {
			document.body.addEventListener(domEvent, interactionListener, true);
		}

		return () => {
			removeAll();

			document.body.removeEventListener('mouseover', drawOutline);
			document.body.removeEventListener('mouseout', handleMouseout);

			document.body.removeEventListener('pointerdown', handleGlobalCapture, true);
			document.body.removeEventListener('click', handleGlobalCapture, true);

			for (const domEvent of DOM_EVENTS) {
				document.body.removeEventListener(domEvent, interactionListener, true);
			}
		};
	}, [isRecording, isAssertionMode, interactionListener, testIdAttribute]);

	return storyFn();
};
