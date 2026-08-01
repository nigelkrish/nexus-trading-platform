from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
import MetaTrader5 as mt5

app = FastAPI()

# Initialize MT5 connection
if not mt5.initialize():
    print("MT5 initialization failed, error code =", mt5.last_error())

@app.get("/")
def read_root():
    return {"status": "Nexus MT5 Bridge is Active!"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected via WebSocket successfully!")
    try:
        while True:
            data_raw = await websocket.receive_text()
            data = json.loads(data_raw)
            symbol = data.get("symbol", "XAUUSD")
            timeframe_str = data.get("timeframe", "1m")
            
            tf_map = {
                "1m": mt5.TIMEFRAME_M1,
                "5m": mt5.TIMEFRAME_M5,
                "15m": mt5.TIMEFRAME_M15,
                "1h": mt5.TIMEFRAME_H1,
                "4h": mt5.TIMEFRAME_H4,
                "1D": mt5.TIMEFRAME_D1
            }
            tf = tf_map.get(timeframe_str, mt5.TIMEFRAME_M1)
            
            rates = mt5.copy_rates_from_pos(symbol, tf, 0, 300)
            if rates is not None:
                candles = [{
                    "time": int(r['time']),
                    "open": float(r['open']),
                    "high": float(r['high']),
                    "low": float(r['low']),
                    "close": float(r['close'])
                } for r in rates]
                await websocket.send_text(json.dumps({"type": "history", "data": candles}))
            
            # Tick loop
            while True:
                tick = mt5.symbol_info_tick(symbol)
                if tick:
                    tick_data = {
                        "type": "tick",
                        "time": int(tick.time),
                        "open": float(tick.bid),
                        "high": float(tick.ask),
                        "low": float(tick.bid),
                        "close": float(tick.bid)
                    }
                    await websocket.send_text(json.dumps(tick_data))
                await asyncio.sleep(1)
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)