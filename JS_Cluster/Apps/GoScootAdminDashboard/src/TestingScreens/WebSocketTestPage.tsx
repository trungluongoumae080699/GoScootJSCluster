// WebSocketTest.tsx
import React, { useEffect, useRef } from "react";
import { decodeBikeUpdates } from "../utlities/BindaryDecoder";


const SESSION_ID = "47419f74-40be-4327-90db-cdfd4955b9ba"; // lấy từ login API

// Tạm thời hardcode server, sau bạn sửa lại theo IP / domain thật
const WS_BASE_URL = "ws:still-simply-katydid.ngrok.app/GoScoot/WebSocket/ws";


export default function WebSocketTest() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // ghép query param authorization
    const wsUrl = `${WS_BASE_URL}?authorization=${encodeURIComponent(
      SESSION_ID,
    )}`;

    console.log("🔌 Connecting to:", wsUrl);

    const socket = new WebSocket(wsUrl);

    wsRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WS connected");

      // gửi viewport lần đầu (test)
      const viewport = getCurrentViewportBounds();

      const msg = {
        maxLong: viewport.maxLong,
        minLong: viewport.minLong,
        maxLat: viewport.maxLat,
        minLat: viewport.minLat,
      };

      socket.send(JSON.stringify(msg));
      console.log("📤 Sent initial viewport:", msg);
    };

    socket.onmessage = (event) => {
      console.log("📥 Message from server:", typeof event.data, event.data);

      // Case 1: Binary data (Blob or ArrayBuffer)
      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        const updates = decodeBikeUpdates(bytes);
        console.log("🔄 Decoded Bike Updates:", updates);
        return;
      }

      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          const bytes = new Uint8Array(buf);
          const updates = decodeBikeUpdates(bytes);
          console.log("🔄 Decoded Bike Updates:", updates);
        });
        return;
      }

      // Case 2: Text message (JSON or string)
      if (typeof event.data === "string") {
        console.log("📄 Text message:", event.data);
        return;
      }

      console.warn("⚠️ Unknown message type:", event.data);
    };

    socket.onerror = (error) => {
      console.log("❌ WS error:", JSON.stringify(error));
    };

    socket.onclose = (event) => {
      console.log(
        "🔌 WS closed:",
        event.code,
        event.reason,
        "clean?",
        event.wasClean,
      );
    };

    // cleanup khi unmount
    return () => {
      console.log("🔌 Closing WS from cleanup");
      socket.close();
      wsRef.current = null;
    };
  }, []);

  // Gửi viewport mới khi bấm nút (mô phỏng user pan/zoom map)
  const sendUpdatedViewport = () => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("⚠️ WS not open, cannot send viewport");
      return;
    }

    const viewport = getCurrentViewportBounds(); // sau này lấy từ map
    const msg = {
      maxLong: viewport.maxLong,
      minLong: viewport.minLong,
      maxLat: viewport.maxLat,
      minLat: viewport.minLat,
    };

    socket.send(JSON.stringify(msg));
    console.log("📤 Sent updated viewport:", msg);
  };

  return (
    <div style={{ flex: 1, padding: 16 }}>
      <p>WebSocket Test</p>
      <button title="Send updated viewport" onClick={sendUpdatedViewport} />
    </div>
  );
}

// TODO: sau này thay bằng bounds thực từ Mapbox / Google Map
function getCurrentViewportBounds() {
  // test cứng một bbox nào đó trong HCM cho vui
  return {
    maxLong: 106.70,
    minLong: 106.65,
    maxLat: 10.77,
    minLat: 10.73,
  };
}