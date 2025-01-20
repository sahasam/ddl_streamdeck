import streamDeck, { action, Coordinates, KeyAction, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { setKeyContext, updateKeyState } from '../utils/utils';

let currentStateCount = 0;

@action({ UUID: "com.casildo-romero.daedaelus-chiplet-demo.logos" })
export class Logos extends SingletonAction {
	private stateCount = 5; // Total number of states

	constructor() {
		super();
	}

	override onWillAppear(ev: WillAppearEvent<EventsSettings>): Promise<void> | void {
		const context = ev.action.id;
		const columnIndex = ev.action.coordinates?.column ?? 0; // Use optional chaining and fallback
		const rowIndex = ev.action.coordinates?.row ?? 0; // a.k.a keyIndex

		// Store the key's context for later use
		setKeyContext(columnIndex, rowIndex, context);
		updateKeyState(context, "", 0); // Default state

		// Log the appearance event
		streamDeck.logger.info(`Key appeared: Context=${context}, Column=${columnIndex}, Row=${rowIndex}`);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const context = ev.action.id;
		const columnIndex = ev.action.coordinates?.column ?? 0; // Use optional chaining and fallback
		const rowIndex = ev.action.coordinates?.row ?? 0; // a.k.a keyIndex

		// Get the current state of the key
		currentStateCount++;

		if (currentStateCount > this.stateCount) {
			currentStateCount = 0;
		}

		if (context) {
			for (const action of streamDeck.actions) {
				if (!action.isKey() || action.isInMultiAction()) {
					continue;
				}

				if (action.id == context) {
					action.setState(currentStateCount);
					break;
				}
			}
		}

		// Log the state change
		streamDeck.logger.info(`Key state updated: Current State=${currentStateCount}`);
	}
}


type EventsSettings = {
	columnIndex: number;
	keyIndex: number;
	currentStateCount: number;
};
