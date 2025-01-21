import streamDeck from "@elgato/streamdeck";
import WebSocket from 'ws'; // Import WebSocket from the 'ws' library
import { processJsonData } from './intervalManager';

import { counter } from "../plugin"; // Ensure the Counter instance is accessible

const httpServerURL = "http://localhost/daedaelus/NodeHealthHttpServer/node_health_http_server.php";
const wsServerURL = "ws://127.0.0.1:9000"; // Casildo WS
//const wsServerURL = "ws://10.0.1.5:6363"; // Sahas WS

interface NodeSnapshotData {
    snapshots: any[]; // Replace `any` with a more specific type if you know the structure of a node.
}

let websocket: WebSocket | null = null;

// Initialize the WebSocket connection
const initializeWebSocket = (): void => {
    if (websocket) return; // Avoid multiple connections

    websocket = new WebSocket(wsServerURL);

    websocket.on("open", () => {
        streamDeck.logger.info("WebSocket connection established.");
    });

    websocket.on("message", (data) => {
        try {
            const json = JSON.parse(data.toString());

            counter.incrementCount();

            if (json.snapshots) {
                streamDeck.logger.info("json:", json);
                processJsonData(json);
            }
        } catch (err) {
            streamDeck.logger.error("Error parsing WebSocket message:", err);
        }
    });

    websocket.on("error", (err) => {
        streamDeck.logger.error("WebSocket error:", err);
    });

    websocket.on("close", () => {
        streamDeck.logger.info("WebSocket connection closed.");
        websocket = null; // Allow reconnection
    });
};

// Send a request via the WebSocket connection
export const sendRequestViaWebSocket = (message: string): void => {
    if (!websocket) {
        initializeWebSocket();
    }
    if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(message);
    }
};

// Function to close the WebSocket connection
export const closeWebSocket = (): void => {
    if (websocket) {
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
            websocket.close(); // Gracefully close the WebSocket connection
            streamDeck.logger.info("WebSocket connection is being closed.");
        }
        websocket = null; // Ensure the instance is cleared
    } else {
        streamDeck.logger.info("No active WebSocket connection to close.");
    }
};

// Send a request via the WebSocket connection
export const dropLink = (columnIndex: number): void => {
    streamDeck.logger.info("DROPPING LINK");

    if (!websocket) {
        initializeWebSocket();
    }
    var portName;
    if(columnIndex === 0){
        portName = "alice";
    }else if(columnIndex === 1){
        portName = "bob";
    }else if(columnIndex === 2){
        portName = "charlie";
    }else if(columnIndex === 3){
        portName = "dugen";
    }
    if (websocket?.readyState === WebSocket.OPEN) {
        //websocket.send(message);
        const payload = JSON.stringify({
            "port": portName,
            "action": "DROP"
        });
        websocket.send(payload);
        streamDeck.logger.info("DROP LINK action sent, payload:", payload);
    }
};

//HTTP call for testing
export const fetchJsonData = async (): Promise<void> => {

    try {
        // Fetch health data via AJAX.
        fetch(httpServerURL + "?apiCallCount=" + counter.getApiCount())
            .then((response) => response.json() as Promise<NodeSnapshotData>)
            .then((data) => {

                counter.incrementCount();

                if (data.snapshots) {
                    streamDeck.logger.info("data.snapshots:", data.snapshots);
                    processJsonData(data.snapshots);
                }
            })
            .catch((error) => {
                streamDeck.logger.error("Error fetching health data:", error);
            });
    } catch (error) {
        streamDeck.logger.info('Error fetching JSON data:', error);
    }
};
