import streamDeck, { action, Coordinates, KeyAction, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { dropLink } from "../utils/apiService";
import { setKeyContext, updateKeyState } from '../utils/utils';

/**
 */
@action({ UUID: "com.casildo-romero.daedaelus-chiplet-demo.link-status" })
export class LinkStatus extends SingletonAction {
	//private isLinked: boolean = true; // Track the current state

	constructor() {
		super();
	}

	override onWillAppear(ev: WillAppearEvent<LinkStatusSettings>): Promise<void> | void {
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

		dropLink(columnIndex);
	}

	// Method to update the state for this key
	updateState(context: string, value: any, state: number): void {
		updateKeyState(context, value, state);
	}
}

type LinkStatusSettings = {
	columnIndex: number;
	keyIndex: number;
};
