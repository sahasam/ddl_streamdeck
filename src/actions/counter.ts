import streamDeck, { action, KeyDownEvent, KeyUpEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

let apiCallCount = 0;

@action({ UUID: "com.casildo-romero.daedaelus-chiplet-demo.counter" })
export class Counter extends SingletonAction {
	private currentContext: string | null = null; // Store the current context

	constructor() {
		super();
	}

	override onWillAppear(ev: WillAppearEvent<CounterSettings>): Promise<void> | void {
		this.currentContext = ev.action.id;

		// Display the count on the key when it appears
		this.updateTitle();
	}

	override onKeyDown(ev: KeyDownEvent): void {
		this.currentContext = ev.action.id; // Update the context if needed
		// Reset the counter on key press
		apiCallCount = 0;
		streamDeck.logger.info("Counter reset to 0");
		this.updateTitle();
	}

	override onKeyUp(event: KeyUpEvent): void {
		// No additional behavior on key release for now
	}

	// Increment the count (to be called externally when an API call is made)
	incrementCount(): void {
		apiCallCount++;
		streamDeck.logger.info(`API call count incremented: ${apiCallCount}`);
		this.updateTitle();
	}

	// Update the title displayed on the Stream Deck
	private updateTitle(): void {
		for (const action of streamDeck.actions) {
			if (!action.isKey() || action.isInMultiAction()) {
				continue;
			}
			if (action.id == this.currentContext) {
				action.setTitle(apiCallCount.toString());
				//this.updateTitleImage(this.currentContext); // Pass the context to update the image
			}
		}
	}

	getApiCount() {
		return apiCallCount;
	}
}


type CounterSettings = {
	apiCallCount: number;
};