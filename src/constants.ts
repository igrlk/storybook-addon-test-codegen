export const ADDON_ID = 'storybook/test-codegen';
export const PANEL_ID = `${ADDON_ID}/panel`;
export const PARAMETER = 'testCodegen';

export const IS_RECORDING_KEY = `${ADDON_ID}/is-recording`;
export const IS_ASSERTING_KEY = `${ADDON_ID}/is-asserting`;

export const EVENTS = {
	INTERACTION: `${ADDON_ID}/interaction`,
	SAVE_NEW_STORY_REQUEST: `${ADDON_ID}/save-new-story-request`,
	SAVE_NEW_STORY_RESPONSE: `${ADDON_ID}/save-new-story-response`,
};

export const DOM_EVENTS = [
	'pointerdown',
	'dblclick',
	'keydown',
	'keyup',
	'input',
	'focus',
];
