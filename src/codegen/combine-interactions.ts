import type { Interaction } from '../state';
import { argsToString } from './args-to-string';

export const combineInteractions = (
	interaction: Interaction,
	existingInteractions: Interaction[],
): Interaction[] => {
	const result = [...existingInteractions];

	if (interaction.event.type === 'dblclick') {
		let clicksRemoved = 0;
		for (let i = result.length - 1; i >= 0 && clicksRemoved < 2; i--) {
			if (result[i].event.type === 'click') {
				result.splice(i, 1);
				clicksRemoved++;
			}
		}

		result.push(interaction);
		return result;
	}

	if (interaction.event.type === 'type') {
		for (let i = result.length - 1; i >= 0; i--) {
			const prevInteraction = result[i];

			const isNotType = prevInteraction.event.type !== 'type';
			const isShiftKey =
				prevInteraction.event.type === 'keydown' &&
				prevInteraction.event.key === 'shift';
			if (isNotType && !isShiftKey) {
				result.push(interaction);
				return result;
			}

			if (
				prevInteraction?.event.type === 'type' &&
				isSameElementQuery(prevInteraction, interaction)
			) {
				prevInteraction.event.value = interaction.event.value;
				return result;
			}
		}

		result.push(interaction);
		return result;
	}

	if (interaction.event.type === 'keyup') {
		for (let i = result.length - 1; i >= 0; i--) {
			const prevInteraction = result[i];
			if (
				prevInteraction.event.type === 'keydown' &&
				prevInteraction.event.key === 'shift'
			) {
				result.splice(i, 1);
				return result;
			}
		}

		return result;
	}

	if (interaction.event.type === 'focus') {
		let hasShift = false;
		let tabKeydownIndex = null;

		for (let i = result.length - 1; i >= 0; i--) {
			const prevInteraction = result[i];
			if (
				prevInteraction?.event.type === 'keydown' &&
				prevInteraction?.event.key === 'tab'
			) {
				tabKeydownIndex = i;
			}

			if (
				prevInteraction?.event.type === 'keydown' &&
				prevInteraction?.event.key === 'shift'
			) {
				hasShift = true;
				break;
			}
		}

		if (tabKeydownIndex !== null) {
			result.splice(tabKeydownIndex, 1);
			result.push({
				elementQuery: interaction.elementQuery,
				event: { type: 'focus', shift: hasShift },
			});
			return result;
		}

		return result;
	}

	result.push(interaction);
	return result;
};

const isSameElementQuery = (a: Interaction, b: Interaction) => {
	return (
		a.elementQuery.object === b.elementQuery.object &&
		a.elementQuery.method === b.elementQuery.method &&
		argsToString(a.elementQuery.args) === argsToString(b.elementQuery.args) &&
		a.elementQuery.nth === b.elementQuery.nth
	);
};
