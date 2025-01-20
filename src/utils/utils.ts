import streamDeck, { LogLevel } from "@elgato/streamdeck";

const keyMapping: Map<string, string> = new Map();

// Update a specific key's state
export const updateKeyState = (context: string, value: any, stateIndex: number): void => {

  for (const action of streamDeck.actions) {
    if (!action.isKey() || action.isInMultiAction()) {
      continue;
    }
    if (action.id == context) {
      action.setState(stateIndex);
      action.setTitle(value.toString());
      streamDeck.logger.info(`Updated key state, context: ${context}, state: ${stateIndex}`);
      break;
    }
  }
};

// Maintain mappings between columns/keys and context
export const setKeyContext = (columnIndex: number, keyIndex: number, context: string): void => {
  // Store the context of the key with a composite key made of columnIndex and keyIndex
  keyMapping.set(`${columnIndex}-${keyIndex}`, context);
  streamDeck.logger.info(`Set context for key (${columnIndex},${keyIndex}): ${context}`);
};

export const getKeyContext = (columnIndex: number, keyIndex: number): string | undefined => {
  // Retrieve the stored context based on columnIndex and keyIndex
  return keyMapping.get(`${columnIndex}-${keyIndex}`);
};

// Optional: To clear key context (if needed in future use cases)
export const clearKeyContext = (columnIndex: number, keyIndex: number): void => {
  keyMapping.delete(`${columnIndex}-${keyIndex}`);
  streamDeck.logger.info(`Cleared context for key (${columnIndex},${keyIndex})`);
};
