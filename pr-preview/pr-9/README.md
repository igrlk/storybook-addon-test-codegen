# Storybook Addon Test Codegen

[![NPM version](https://badge.fury.io/js/storybook-addon-test-codegen.svg)](https://www.npmjs.com/package/storybook-addon-test-codegen)
[![NPM downloads](https://img.shields.io/npm/dt/storybook-addon-test-codegen)](https://www.npmjs.com/package/storybook-addon-test-codegen)
[![GitHub license](https://img.shields.io/github/license/igrlk/storybook-addon-test-codegen)](https://github.com/igrlk/storybook-addon-test-codegen/blob/main/LICENSE)

Interact with your Storybook and get test code generated for you.

![Alt Text](/assets/addon.gif)

## Installation

First, install the package.

```sh
npm install --save-dev storybook-addon-test-codegen
```

### Peer Dependency

This addon requires `storybook` version `^8` to be installed in your project. Ensure you have a compatible version by
running:

```sh
npm install --save-dev storybook@^8
````

If you’re not using Storybook already, you can refer to
the [Storybook Getting Started Guide](https://storybook.js.org/docs) for installation instructions.

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
would, and the addon will generate test code for you.

Copy both imports and the generated code to your test file.

```jsx
// MyComponent.stories.tsx

// 👇 Add the generated imports here
import {userEvent, waitFor, within, expect} from "@storybook/test";

export const MyComponent: Story = {
  // ...rest of the story

  // 👇 Add the generated test code here
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('textbox', {name: 'Name'}));
    await userEvent.type(await canvas.findByRole('textbox', {name: 'Name'}), 'John Doe');
  }
}
```

## API

### Parameters

This addon contributes the following parameters to Storybook, under the `testCodegen` namespace:

#### testIdAttribute

Type: `string`

The attribute to use for generating `findByTestId` queries. Defaults to `'data-testid'`.

Example:

```jsx
{
  parameters: {
    testCodegen: {
      testIdAttribute: 'data-test-id'
    }
  }
}
```

## Contributing

Any contributions are welcome. Feel free to open an issue or a pull request.