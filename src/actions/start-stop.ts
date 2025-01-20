import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { startFetching, stopFetching } from '../utils//intervalManager';

@action({ UUID: "com.casildo-romero.daedaelus-chiplet-demo.start-stop" })
export class StartStop extends SingletonAction {
	private isFetching: boolean = false; // Track the current state

	constructor() {
		super();
	}
	override onWillAppear(ev: WillAppearEvent): void {
		const context = ev.action.id;

		// Initialize the key in the "stop" state
		this.isFetching = false;

		for (const action of streamDeck.actions) {
			if (!action.isKey() || action.isInMultiAction()) {
				continue;
			}
			if (action.id == context) {
				action.setState(0);
			}
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const context = ev.action.id;

		if (this.isFetching) {
			// Stop fetching data
			stopFetching();
			this.isFetching = false;
		} else {
			// Start fetching data
			startFetching();
			this.isFetching = true;
		}

		for (const action of streamDeck.actions) {
			if (!action.isKey() || action.isInMultiAction()) {
				continue;
			}
			if (action.id == context) {
				if (this.isFetching) {
					action.setState(1); //present stop image
				} else {
					action.setState(0); //present start image
				}
			}
		}
	}
}