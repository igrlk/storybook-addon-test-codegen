# Storybook Addon Test Codegen

[![NPM version](https://img.shields.io/npm/v/storybook-addon-test-codegen)](https://www.npmjs.com/package/storybook-addon-test-codegen)
[![NPM downloads](https://img.shields.io/npm/dt/storybook-addon-test-codegen)](https://www.npmjs.com/package/storybook-addon-test-codegen)
[![NPM downloads](https://img.shields.io/npm/dw/storybook-addon-test-codegen)](https://www.npmjs.com/package/storybook-addon-test-codegen)
[![GitHub license](https://img.shields.io/github/license/igrlk/storybook-addon-test-codegen)](https://github.com/igrlk/storybook-addon-test-codegen/blob/main/LICENSE)

Interact with your Storybook and get test code generated for
you. To see this live, check out the [demo](https://igrlk.github.io/storybook-addon-test-codegen/).

![Alt Text](/assets/addon.gif)

## Installation

First, install the package.

```sh
npm install --save-dev storybook-addon-test-codegen
```

### Storybook version compatibility

This addon requires Storybook version **9.0.0 or higher**.

For older versions of Storybook, use the following addon versions:

| Storybook Version | Addon Version |
|-------------------|---------------|
| 8.3.*             | 1.3.4         |
| 8.2.*             | 1.0.3         |

### Register the Addon

Once installed, register it as an addon in `.storybook/main.js`.

```js
// .storybook/main.ts

// Replace your-framework with the framework you are using (e.g., react-webpack5, vue3-vite)
import type {StorybookConfig} from '@storybook/your-framework';

const config: StorybookConfig = {
  // ...rest of config
  addons: [
    '@storybook/addon-essentials',
    'storybook-addon-test-codegen', // 👈 register the addon here
  ],
};

export default config;
```

## Usage

Enable recording in the Interaction Recorder tab in the Storybook UI. Interact with your components as you normally
would, and the addon will generate test code for you. Click "Add assertion" to add assertions like
`expect().toBeVisible()` to the generated code.

Click on "Save to story" to save the generated code to the story file. Done 🎉

Alternatively, copy both imports and the generated code to your test file like so:

```jsx
// MyComponent.stories.tsx

// 👇 Add the generated imports here
import {userEvent, waitFor, within, expect} from "storybook/test";

export const MyComponent = {
  // ...rest of the story

  // 👇 Add the generated test code here
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('textbox', {name: 'Name'}));
    await userEvent.type(await canvas.findByRole('textbox', {name: 'Name'}), 'John Doe');
  }
}
```

### Warnings

The addon helps you write better tests by showing warnings when it detects potential improvements in your selectors. It
highlights cases where:

- Roles are used without names (which can make tests fragile)
- Query selectors are used (which can break when HTML structure changes)
- Test IDs are used (which don't reflect how users interact with your app)

For each warning, you'll get suggestions on how to improve your selectors to make tests more reliable and maintainable.

![Warnings in action](/assets/warnings.png)

## API

### Custom test-id selector

To set a custom data-test attribute to use for generating `findByTestId` queries, add the following to your
`preview.ts`:

```ts
import {configure} from 'storybook/test';

configure({
  testIdAttribute: 'my-custom-attribute',
});
```

## Contributing

Any contributions are welcome. Feel free to open an issue or a pull request.
