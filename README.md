# Storybook Addon Test Codegen

Interact with your Storybook and get test code generated for you.

![Alt Text](/assets/addon.gif)

## Introduction

TODO

## Installation

First, install the package.

```sh
npm install --save-dev storybook-addon-test-codegen
```

Then, register it as an addon in `.storybook/main.js`.

```js
// .storybook/main.ts

// Replace your-framework with the framework you are using (e.g., react-webpack5, vue3-vite)
import type { StorybookConfig } from '@storybook/your-framework';

const config: StorybookConfig = {
  // ...rest of config
  addons: [
    '@storybook/addon-essentials'
    'storybook-addon-test-codegen', // 👈 register the addon here
  ],
};

export default config;
```

## Usage

Enable recording in the Interaction Recorder tab in the Storybook UI. Interact with your components as you normally would, and the addon will generate test code for you.

Copy the code and paste it into the storybook definition. Import the test utilities from `@storybook/test` if they are used in the generated code.

```jsx
// MyComponent.stories.tsx
import { userEvent, waitFor, within, expect } from "@storybook/test"; // 👈 Import the test utilities

export const MyComponent: Story = {
  // ...rest of the story
  
  // 👇 Add the generated test code here
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole('textbox', { name: 'Name' }));
    await userEvent.type(await canvas.findByRole('textbox', { name: 'Name' }), 'John Doe');
  }
}
```

## API

### Parameters

This addon contributes the following parameters to Storybook, under the `testCodegen` namespace:

#### testIdAttribute

Type: `string`

The attribute to use for generating `findByTestId` queries. Defaults to `'data-testid'`.
