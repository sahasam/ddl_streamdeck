import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { LinkStatus } from "./actions/link-status";
import { Events } from "./actions/events";
import { RoundTripLatency } from "./actions/round-trip-latency";
import { PacketsPerSecond } from "./actions/packets-per-second";
import { NodeRoot } from "./actions/node-root";
import { Node1 } from "./actions/node-1";
import { Node2 } from "./actions/node-2";
import { Node3 } from "./actions/node-3";
import { StartStop } from "./actions/start-stop";
import { Counter } from "./actions/counter";
import { Logos } from "./actions/logos";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register the demo actions.
const linkStatus = new LinkStatus();
const events = new Events();
const roundTripLatency = new RoundTripLatency();
const packetsPerSecond = new PacketsPerSecond();
const nodeRoot = new NodeRoot();
const node1 = new Node1();
const node2 = new Node2();
const node3 = new Node3();
const startStop = new StartStop();
export const counter = new Counter();// Create a shared instance of Counter
const logos = new Logos();
streamDeck.actions.registerAction(linkStatus);
streamDeck.actions.registerAction(events);
streamDeck.actions.registerAction(roundTripLatency);
streamDeck.actions.registerAction(packetsPerSecond);
streamDeck.actions.registerAction(nodeRoot);
streamDeck.actions.registerAction(node1);
streamDeck.actions.registerAction(node2);
streamDeck.actions.registerAction(node3);
streamDeck.actions.registerAction(startStop);
streamDeck.actions.registerAction(counter);
streamDeck.actions.registerAction(logos);


// Finally, connect to the Stream Deck.
streamDeck.connect();


