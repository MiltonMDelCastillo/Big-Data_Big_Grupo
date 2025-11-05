# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Eco: {data}")
            for client in clients:
                if client != websocket:
                    await client.send_text(f"Broadcast: {data}")
    except WebSocketDisconnect:
        clients.remove(websocket)