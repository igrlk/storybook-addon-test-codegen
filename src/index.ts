import { definePreviewAddon } from 'storybook/internal/csf';

import * as addonAnnotations from './preview';
import type { AddonCodegenTypes } from './types';

export default () => definePreviewAddon<AddonCodegenTypes>(addonAnnotations);
