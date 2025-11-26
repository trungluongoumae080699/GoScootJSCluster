// WebSocketTest.tsx
// This component is a small test harness to:
// 1. Open a WebSocket connection to the backend
// 2. Send the current viewport (map bounds) to the server
// 3. Receive binary bike telemetry updates and decode them

import React, { useEffect, useRef } from "react";
import { decodeBikeUpdates } from "../utlities/BindaryDecoder";

// ✅ Session ID used to authenticate the WebSocket connection.
// In real code, you should get this from your login API / auth state.
const SESSION_ID = "47419f74-40be-4327-90db-cdfd4955b9ba";

// ✅ Base WebSocket URL of your server.
// NOTE: Make sure to use a valid WebSocket URL, e.g. "ws://..." or "wss://..."
const WS_BASE_URL = "ws://still-simply-katydid.ngrok.app/GoScoot/WebSocket/ws";

export default function WebSocketTest() {
  // ✅ useRef to store the WebSocket instance so we can:
  // - send messages later (e.g. when clicking a button)
  // - close the connection when the component unmounts
  const wsRef = useRef<WebSocket | null>(null);

  // ✅ useEffect with empty dependency array: runs exactly once
  // when the component is mounted, and its cleanup runs on unmount.
  useEffect(() => {
    // 1️⃣ Build the full WebSocket URL with a query parameter "authorization"
    //    Example final URL:
    //    ws://.../ws?authorization=47419f74-...
    const wsUrl = `${WS_BASE_URL}?authorization=${encodeURIComponent(
      SESSION_ID,
    )}`;

    console.log("🔌 Connecting to:", wsUrl);

    // 2️⃣ Create a new WebSocket connection to the server
    const socket = new WebSocket(wsUrl);

    // 3️⃣ Store the WebSocket instance in the ref so other functions can use it
    wsRef.current = socket;

    // 4️⃣ Event: connection successfully opened
    socket.onopen = () => {
      console.log("✅ WS connected");

      // 4.1️⃣ For testing: immediately send the current viewport bounds
      //      In real code, this would come from the map (e.g. Mapbox / Google Maps)
      const viewport = getCurrentViewportBounds();

      // 4.2️⃣ Build the message object with min/max lat/long
      const msg = {
        maxLong: viewport.maxLong,
        minLong: viewport.minLong,
        maxLat: viewport.maxLat,
        minLat: viewport.minLat,
      };

      // 4.3️⃣ Send the JSON-encoded viewport to the backend
      socket.send(JSON.stringify(msg));
      console.log("📤 Sent initial viewport:", msg);
    };

    // 5️⃣ Event: message received from server
    socket.onmessage = (event) => {
      console.log("📥 Message from server:", typeof event.data, event.data);

      // Case A: Binary message already as ArrayBuffer
      // Some browsers / servers deliver binary data this way directly
      if (event.data instanceof ArrayBuffer) {
        // 5.1️⃣ Wrap the raw buffer in a Uint8Array for easier parsing
        const bytes = new Uint8Array(event.data);
        // 5.2️⃣ Decode binary payload into a list of bike updates
        const updates = decodeBikeUpdates(bytes);
        console.log("🔄 Decoded Bike Updates:", updates);
        return;
      }

      // Case B: Binary message delivered as Blob
      // Common in browsers when dealing with WebSockets
      if (event.data instanceof Blob) {
        // 5.3️⃣ Convert Blob → ArrayBuffer asynchronously
        event.data.arrayBuffer().then((buf) => {
          const bytes = new Uint8Array(buf);
          // 5.4️⃣ Decode bike updates from the binary
          const updates = decodeBikeUpdates(bytes);
          console.log("🔄 Decoded Bike Updates:", updates);
        });
        return;
      }

      // Case C: Text message (JSON or plain string)
      if (typeof event.data === "string") {
        // 5.5️⃣ For now, just log text messages
        // You can later parse JSON with JSON.parse(event.data) if needed
        console.log("📄 Text message:", event.data);
        return;
      }

      // Case D: Unexpected message type
      console.warn("⚠️ Unknown message type:", event.data);
    };

    // 6️⃣ Event: WebSocket error (e.g. server unreachable, handshake failed)
    socket.onerror = (error) => {
      // `error` is a generic event, so JSON.stringify is mostly for debugging
      console.log("❌ WS error:", JSON.stringify(error));
    };

    // 7️⃣ Event: WebSocket closed (either by server or client)
    socket.onclose = (event) => {
      console.log(
        "🔌 WS closed:",
        event.code,       // numeric close code
        event.reason,     // string explaining why
        "clean?",
        event.wasClean,   // boolean: was this a normal close?
      );
    };

    // 8️⃣ Cleanup function: React calls this when component unmounts
    // This ensures the WebSocket connection is closed properly
    return () => {
      console.log("🔌 Closing WS from cleanup");
      socket.close();
      wsRef.current = null;
    };
  }, []); // empty dependency array => run once on mount

  // 🔁 Called when user clicks "Send updated viewport" button.
  // This simulates user panning/zooming the map by re-sending viewport bounds.
  const sendUpdatedViewport = () => {
    const socket = wsRef.current;

    // 1️⃣ Check if WebSocket exists and is OPEN
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("⚠️ WS not open, cannot send viewport");
      return;
    }

    // 2️⃣ Get viewport bounds (later: replace with real map bounds)
    const viewport = getCurrentViewportBounds();

    const msg = {
      maxLong: viewport.maxLong,
      minLong: viewport.minLong,
      maxLat: viewport.maxLat,
      minLat: viewport.minLat,
    };

    // 3️⃣ Send updated viewport to backend as JSON string
    socket.send(JSON.stringify(msg));
    console.log("📤 Sent updated viewport:", msg);
  };

  // Simple UI
  return (
    <div style={{ flex: 1, padding: 16 }}>
      <p>WebSocket Test</p>
      {/* 
        A minimal <button> without label text will render but not show visible text.
        You may want children like: <button>Send updated viewport</button>
      */}
      <button title="Send updated viewport" onClick={sendUpdatedViewport}>
        Send updated viewport
      </button>
    </div>
  );
}

// 🗺 Dummy viewport function.
// In real app, this should return the current map bounds from Mapbox / Google Maps.
// Here we just hardcode a latitude/longitude range around part of HCMC.
function getCurrentViewportBounds() {
  return {
    maxLong: 106.70, // eastern longitude
    minLong: 106.65, // western longitude
    maxLat: 10.77,   // northern latitude
    minLat: 10.73,   // southern latitude
  };
}