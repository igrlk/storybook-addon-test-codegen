// biome-ignore lint/correctness/noUnusedImports: Must be here for react@19 and non-react projects support
import React from 'react';
import { useChannel, useEffect } from 'storybook/internal/preview-api';
import type { DecoratorFunction } from 'storybook/internal/types';
import {
	argsToString,
	generateQuery,
	getClosestInteractiveElement,
} from '../codegen/generate-query';
import { EVENTS, IS_ASSERTING_KEY, IS_RECORDING_KEY } from '../constants';
import type { Interaction, InteractionEvent } from '../state';
import { getApplicableAssertions } from './get-applicable-assertions';
import { useAddonParameters } from './state';

export const withHoverOutline: DecoratorFunction = (storyFn, context) => {
	const isRecording = context.globals[IS_RECORDING_KEY];
	const isAssertionMode = context.globals[IS_ASSERTING_KEY];
	const { testIdAttribute } = useAddonParameters();
	const emit = useChannel({});

	useEffect(() => {
		if (!isRecording) {
			return;
		}

		let element: HTMLElement | null = null;
		let observer: MutationObserver | null = null;
		let menuElement: HTMLElement | null = null;
		let activeElement: HTMLElement | null = null;
		// biome-ignore lint/suspicious/noExplicitAny: Needed for query
		let activeQuery: any = null;
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
			menuElement.style.top = `${position.y}px`;
			menuElement.style.left = `${position.x}px`;
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

				// TODO: Clean up this event handler
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

			document.body.appendChild(menuElement);

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

		// Global event handlers for different phases
		const handleGlobalCapture = (event: Event) => {
			// Only prevent default behavior (like opening select dropdown)
			// but don't stop propagation so our click handler can still work
			if (isAssertionMode) {
				// For form elements like select, checkbox, etc.
				// Prevent the default action but allow the event to continue
				event.preventDefault();
			}
		};

		// Our main click handler for showing the menu
		const handleClick = (event: MouseEvent) => {
			// Skip if not in assertion mode
			if (!isAssertionMode) {
				return;
			}

			// Stop if clicking on menu
			if (menuElement?.contains(event.target as Node)) {
				return;
			}

			// Check if we have an active element and query
			if (!activeElement || !activeQuery) {
				return;
			}

			// Prevent the event from continuing to the element
			event.preventDefault();

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

		document.body.addEventListener('mouseover', drawOutline);
		document.body.addEventListener('mouseout', handleMouseout);

		// Use capture phase for prevention (true parameter)
		document.addEventListener('click', handleGlobalCapture, true);
		document.addEventListener('mousedown', handleGlobalCapture, true);
		document.addEventListener('change', handleGlobalCapture, true);
		document.addEventListener('input', handleGlobalCapture, true);

		// Handle click in bubbling phase after capture phase
		document.body.addEventListener('click', handleClick);

		return () => {
			removeAll();

			document.body.removeEventListener('mouseover', drawOutline);
			document.body.removeEventListener('mouseout', handleMouseout);
			document.body.removeEventListener('click', handleClick);

			document.removeEventListener('click', handleGlobalCapture, true);
			document.removeEventListener('mousedown', handleGlobalCapture, true);
			document.removeEventListener('change', handleGlobalCapture, true);
			document.removeEventListener('input', handleGlobalCapture, true);
		};
	}, [isRecording, isAssertionMode]);

	return storyFn();
};
