import streamDeck from "@elgato/streamdeck";
import { sendRequestViaWebSocket, closeWebSocket } from "./apiService";
import { updateKeyState, getKeyContext } from "./utils";

let devEnv = "mac-mini"; // windows or mac-mini

let intervalId: NodeJS.Timeout | null = null;

interface TreeData {
  nodes: string[];
  edges: [number, number][];
}

const latencyMapping: { range: [number, number], index: number }[] = [
  { range: [0, 1.25], index: 1 },
  { range: [1.251, 3.75], index: 2 },
  { range: [3.751, 6.25], index: 3 },
  { range: [6.251, 8.75], index: 4 },
  { range: [8.751, 11.25], index: 5 },
  { range: [11.251, 13.75], index: 6 },
  { range: [13.751, 16.25], index: 7 },
  { range: [16.251, 18.75], index: 8 },
  { range: [18.751, 21.25], index: 9 },
  { range: [21.251, 23.75], index: 10 },
  { range: [23.751, 26.25], index: 11 },
  { range: [26.251, 28.75], index: 12 },
  { range: [28.751, 31.25], index: 13 },
  { range: [31.251, 33.75], index: 14 },
  { range: [33.751, 36.25], index: 15 },
  { range: [36.251, 38.75], index: 16 },
  { range: [38.751, 41.25], index: 17 },
  { range: [41.251, 43.75], index: 18 },
  { range: [43.751, 46.25], index: 19 },
  { range: [46.251, 48.75], index: 20 },
  { range: [48.751, 51.25], index: 21 },
  { range: [51.251, 53.75], index: 22 },
  { range: [53.751, 56.25], index: 23 },
  { range: [56.251, 58.75], index: 24 },
  { range: [58.751, 100.00], index: 25 }
];
const ppsMapping: { range: [number, number], index: number }[] = [
  { range: [0, 15000], index: 1 },
  { range: [15000.001, 16000], index: 2 },
  { range: [16000.001, 17000], index: 3 },
  { range: [17000.01, 18000], index: 4 },
  { range: [18000.01, 19000], index: 5 },
  { range: [19000.01, 20000], index: 6 },
  { range: [20000.01, 21000], index: 7 },
  { range: [21000.01, 22000], index: 8 },
  { range: [22000.01, 23000], index: 9 },
  { range: [23000.01, 24000], index: 10 },
  { range: [24000.01, 25000], index: 11 },
  { range: [25000.01, 26000], index: 12 },
  { range: [26000.01, 27000], index: 13 },
  { range: [27000.01, 28000], index: 14 },
  { range: [38000.01, 29000], index: 15 },
  { range: [29000.01, 30000], index: 16 },
  { range: [30000.01, 100000], index: 17 }
];
let numberFormat = new Intl.NumberFormat('en-US');

// Function to fetch JSON data and update keys
export const startFetching = (): void => {
  if (!intervalId) {
    intervalId = setInterval(() => {
      if (devEnv === "windows") {
        sendRequestViaWebSocket("request_health_data"); // for Casildo ws
      }
    }, 1500); // Send a request every 1 seconds
    if (devEnv === "mac-mini") {
      sendRequestViaWebSocket("request_health_data");// for Sahas ws
    }
    streamDeck.logger.info('Started fetching JSON data');
  }
};

// Stop fetching data
export const stopFetching = (): void => {
  if (intervalId) {
    closeWebSocket();
    clearInterval(intervalId);
    intervalId = null;
    streamDeck.logger.info('Stopped fetching JSON data');
  }
};

// Process the fetched JSON data
export const processJsonData = (json: any): void => {
  const snapshotData: Array<{ name: string, link: { status: string, statistics?: { events: number, round_trip_latency: number, pps: number } } }> = json.snapshots || [];
  // For Sahas WS 
  const treeData: TreeData = json?.tree && Array.isArray(json.tree.nodes) && Array.isArray(json.tree.edges)
    ? {
      nodes: json.tree.nodes,
      edges: json.tree.edges.map(([source, destination]: [number, number]) => [source, destination])
    }
    : { nodes: [], edges: [] };

  streamDeck.logger.info("snapshotData:", snapshotData);
  streamDeck.logger.info("treeData:", treeData);

  snapshotData.forEach((entry, columnIndex) => {
    const { link } = entry;

    if (link) {
      const { status, statistics } = link;

      // Update state for link status (keyIndex=0)
      const statusContext = getKeyContext(columnIndex, 0); // KeyIndex 0 for link.status
      streamDeck.logger.info(`Updated key state, columnIndex: ${columnIndex}, keyIndex: 0`);
      if (statusContext) {
        const stateIndex = mapLinkStatusToState(status);
        streamDeck.logger.info(`link.status: ${status}, link.state: ${stateIndex}`);

        updateKeyState(statusContext, "", stateIndex);
      }

      // Update states dynamically for events, round_trip_latency, and pps
      let keyMappings = [];

      if (status === "connected" && statistics) {

        // Map metrics to state indices
        //const eventStateIndex = mapValueToStateIndex(statistics.events, eventMapping);
        const latencyStateIndex = mapValueToStateIndex(statistics.round_trip_latency, latencyMapping);
        const ppsStateIndex = mapValueToStateIndex(statistics.pps, ppsMapping);

        // Update states dynamically for events, round_trip_latency, and pps
        keyMappings = [
          //{ keyIndex: 1, value: statistics.events, stateIndex: eventStateIndex },       // KeyIndex 1 for events
          { keyIndex: 2, value: statistics.round_trip_latency, stateIndex: latencyStateIndex },    // KeyIndex 2 for round_trip_latency
          { keyIndex: 3, value: statistics.pps, stateIndex: ppsStateIndex }         // KeyIndex 3 for pps
        ];

      } else { // Initialized or Disconnected

        // Initialize states dynamically for events, round_trip_latency, and pps
        keyMappings = [
          //{ keyIndex: 1, value: 0, stateIndex: 0 },       // KeyIndex 1 for events
          { keyIndex: 2, value: "", stateIndex: 0 },    // KeyIndex 2 for round_trip_latency
          { keyIndex: 3, value: "", stateIndex: 0 }         // KeyIndex 3 for pps
        ];

      }

      // For events only
      const eventContext = getKeyContext(columnIndex, 1);// KeyIndex 1 for events
      if (eventContext) {
        for (const action of streamDeck.actions) {
          if (!action.isKey() || action.isInMultiAction()) {
            continue;
          }

          if (action.id == eventContext) {
            if (status === "connected" && statistics) {
              action.setTitle(statistics.events.toString());
            } else {
              action.setTitle("");
            }
            break;
          }
        }
      }

      // For latency and pps
      keyMappings.forEach(({ keyIndex, value, stateIndex }) => {
        const context = getKeyContext(columnIndex, keyIndex);
        streamDeck.logger.info(`Updated key state, columnIndex: ${columnIndex}, keyIndex: ${keyIndex}`);
        if (context) {
          if (status === "connected" && statistics) {
            if (keyIndex === 2) {
              updateKeyState(context, "", stateIndex);
            } else if (keyIndex === 3) {
              var pps = Number(statistics.pps).toLocaleString('en-US', {
                maximumFractionDigits: 0
              });
              updateKeyState(context, pps.toString(), stateIndex);
            } else {
              updateKeyState(context, value, stateIndex);
            }
          } else {
            updateKeyState(context, "", stateIndex);
          }
        }
      });
    }

  });

  processTreeData(treeData);

};


// Helper to map link.status to Stream Deck states
const mapLinkStatusToState = (status: string): number => {
  switch (status) {
    case "linked": return 0;
    case "connected": return 1;
    case "disconnected": return 2;
    default: return 0; // Default to linked
  }
};

// Helper to map a value to a state index using a range-to-index mapping
const mapValueToStateIndex = (value: number, rangeToIndexMap: { range: [number, number], index: number }[]): number => {
  for (const { range, index } of rangeToIndexMap) {
    if (value >= range[0] && value <= range[1]) {
      return index;
    }
  }
  // Default state index if no range matches (e.g., "out of range")
  return -1;
};

// Determine the correct Stream Deck position
const positions: Record<number, [number, number]> = {
  0: [4, 2], // root node
  1: [5, 2], // node 1
  2: [5, 3], // node 2
  3: [4, 3], // node 3
};
const sdMiniPositions: Record<number, [number, number]> = {
  0: [0, 0], // root node
  1: [1, 0], // node 1
  2: [1, 1], // node 2
  3: [0, 1], // node 3
};

const processTreeData = (tree: TreeData): void => {
  const { nodes, edges } = tree;
  streamDeck.logger.info(`Processing tree data: nodes = ${JSON.stringify(nodes)}, edges = ${JSON.stringify(edges)}`);

  // Initialize root node (node 0)
  let rootState = 0;
  const rootConnections = edges.filter(edge => edge[0] === 0);
  rootConnections.forEach(([_, dest]) => {
    if (dest === 1) rootState += 1;
    if (dest === 3) rootState += 2;
    if (dest === 2) rootState += 4;
  });

  // Update Stream Deck for root node
  const rootContext = getKeyContext(positions[0][0], positions[0][1]);
  if (rootContext) {
    updateKeyState(rootContext, nodes[0].charAt(0).toUpperCase(), rootState);
  }
  // Update Mini Stream Deck for root node
  /*
  const sdMiniRootContext = getKeyContext(sdMiniPositions[0][0], sdMiniPositions[0][1]);
  if (sdMiniRootContext) {
    updateKeyState(sdMiniRootContext, nodes[0].charAt(0).toUpperCase(), rootState);
  }
  */

  // Process remaining nodes (1, 2, 3)
  for (let nodeIndex = 1; nodeIndex < nodes.length; nodeIndex++) {
    const sourceEdges = edges.filter(edge => edge[0] === nodeIndex).map(edge => edge[1]);
    const destinationEdges = edges.filter(edge => edge[1] === nodeIndex).map(edge => edge[0]);

    streamDeck.logger.info(`sourceEdges ${sourceEdges}`);
    streamDeck.logger.info(`destinationEdges ${destinationEdges}`);

    // State calculation: lower states for simpler cases, higher for more complex
    let nodeState = 0;
    if (sourceEdges.length === 0 && destinationEdges.length == 1) {
      if (nodeIndex === 1) {
        if (destinationEdges[0] == 0) nodeState = 1;
        if (destinationEdges[0] == 2) nodeState = 2;
        if (destinationEdges[0] == 3) nodeState = 3;
      } else if (nodeIndex === 2) {
        if (destinationEdges[0] == 0) nodeState = 1;
        if (destinationEdges[0] == 1) nodeState = 2;
        if (destinationEdges[0] == 3) nodeState = 3;
      } else if (nodeIndex === 3) {
        if (destinationEdges[0] == 0) nodeState = 1;
        if (destinationEdges[0] == 1) nodeState = 2;
        if (destinationEdges[0] == 2) nodeState = 3;
      }
    } else if ((sourceEdges.length + destinationEdges.length) == 2) {
      if (nodeIndex === 1) {
        if (destinationEdges[0] == 0 && sourceEdges[0] == 2) nodeState = 4;
        if (destinationEdges[0] == 0 && sourceEdges[0] == 3) nodeState = 5;
        if (destinationEdges[0] == 2 && sourceEdges[0] == 3) nodeState = 6;
        if (destinationEdges[0] == 3 && sourceEdges[0] == 2) nodeState = 7;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 2) || (destinationEdges[0] == 2 && destinationEdges[1] == 0)) nodeState = 8;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 3) || (destinationEdges[0] == 3 && destinationEdges[1] == 0)) nodeState = 9;
        if ((destinationEdges[0] == 2 && destinationEdges[1] == 3) || (destinationEdges[0] == 3 && destinationEdges[1] == 2)) nodeState = 10;
      } else if (nodeIndex === 2) {
        if (destinationEdges[0] == 0 && sourceEdges[0] == 1) nodeState = 4;
        if (destinationEdges[0] == 0 && sourceEdges[0] == 3) nodeState = 5;
        if (destinationEdges[0] == 1 && sourceEdges[0] == 3) nodeState = 6;
        if (destinationEdges[0] == 3 && sourceEdges[0] == 1) nodeState = 7;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 1) || (destinationEdges[0] == 1 && destinationEdges[1] == 0)) nodeState = 8;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 3) || (destinationEdges[0] == 3 && destinationEdges[1] == 0)) nodeState = 9;
        if ((destinationEdges[0] == 1 && destinationEdges[1] == 3) || (destinationEdges[0] == 3 && destinationEdges[1] == 1)) nodeState = 10;
      } else if (nodeIndex === 3) {
        if (destinationEdges[0] == 0 && sourceEdges[0] == 1) nodeState = 4;
        if (destinationEdges[0] == 0 && sourceEdges[0] == 2) nodeState = 5;
        if (destinationEdges[0] == 1 && sourceEdges[0] == 2) nodeState = 6;
        if (destinationEdges[0] == 2 && sourceEdges[0] == 1) nodeState = 7;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 1) || (destinationEdges[0] == 1 && destinationEdges[1] == 0)) nodeState = 8;
        if ((destinationEdges[0] == 0 && destinationEdges[1] == 2) || (destinationEdges[0] == 2 && destinationEdges[1] == 0)) nodeState = 9;
        if ((destinationEdges[0] == 1 && destinationEdges[1] == 2) || (destinationEdges[0] == 2 && destinationEdges[1] == 1)) nodeState = 10;
      }
    } else if ((sourceEdges.length + destinationEdges.length) == 3) {
      if (nodeIndex === 1) {
        if (destinationEdges[0] == 0 && ((sourceEdges[0] == 2 && sourceEdges[1] == 3) || (sourceEdges[0] == 3 && sourceEdges[1] == 2))) nodeState = 11;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 2 && destinationEdges[1] == 3) || destinationEdges[0] == 3 && sourceEdges[0] == 2 && destinationEdges[1] == 0) nodeState = 12;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 3 && destinationEdges[1] == 2) || destinationEdges[0] == 2 && sourceEdges[0] == 3 && destinationEdges[1] == 0) nodeState = 13;
        if (destinationEdges.length === 3) nodeState = 14;
      } else if (nodeIndex === 2) {
        if (destinationEdges[0] == 0 && ((sourceEdges[0] == 1 && sourceEdges[1] == 3) || (sourceEdges[0] == 3 && sourceEdges[1] == 1))) nodeState = 11;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 3 && destinationEdges[1] == 1) || destinationEdges[0] == 1 && sourceEdges[0] == 3 && destinationEdges[1] == 0) nodeState = 12;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 1 && destinationEdges[1] == 3) || destinationEdges[0] == 3 && sourceEdges[0] == 1 && destinationEdges[1] == 0) nodeState = 13;
        if (destinationEdges.length === 3) nodeState = 14;
      } else if (nodeIndex === 3) {
        if (destinationEdges[0] == 0 && ((sourceEdges[0] == 1 && sourceEdges[1] == 2) || (sourceEdges[0] == 2 && sourceEdges[1] == 1))) nodeState = 11;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 2 && destinationEdges[1] == 1) || destinationEdges[0] == 1 && sourceEdges[0] == 2 && destinationEdges[1] == 0) nodeState = 12;
        if ((destinationEdges[0] == 0 && sourceEdges[0] == 1 && destinationEdges[1] == 2) || destinationEdges[0] == 2 && sourceEdges[0] == 1 && destinationEdges[1] == 0) nodeState = 13;
        if (destinationEdges.length === 3) nodeState = 14;
      }
    }

    // Update Stream Deck
    if (positions[nodeIndex]) {
      const [col, row] = positions[nodeIndex];
      const nodeContext = getKeyContext(col, row);
      if (nodeContext) {
        updateKeyState(nodeContext, nodes[nodeIndex].charAt(0).toUpperCase(), nodeState);
        streamDeck.logger.info(`Updated node ${nodes[nodeIndex]} (index ${nodeIndex}) to state ${nodeState}`);
      }
    }

    // Update Mini Stream Deck
    /*
    if (sdMiniPositions[nodeIndex]) {
      const [col, row] = sdMiniPositions[nodeIndex];
      const nodeContext = getKeyContext(col, row);
      if (nodeContext) {
        updateKeyState(nodeContext, nodes[nodeIndex].charAt(0).toUpperCase(), nodeState);
        streamDeck.logger.info(`Updated node ${nodes[nodeIndex]} (index ${nodeIndex}) to state ${nodeState}`);
      }
    }
      */
  }
};