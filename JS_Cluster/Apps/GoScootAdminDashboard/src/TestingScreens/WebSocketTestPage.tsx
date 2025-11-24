// WebSocketTest.tsx
import React, { useEffect, useRef } from "react";


const SESSION_ID = "fe206307-6ac6-40a2-96a3-f881dbb57f9c"; // lấy từ login API

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
      // event.data có thể là string hoặc binary (tuỳ server)
      console.log("📥 Message from server:", typeof event.data, event.data);
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