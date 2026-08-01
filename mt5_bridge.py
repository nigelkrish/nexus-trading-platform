import asyncio
import json
import logging
import MetaTrader5 as mt5
import websockets

# Logging සකස් කරගැනීම
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

PORT = 8080


def get_verified_symbol(preferred_symbol):
    # බ්‍රව්සරයෙන් ඉල්ලන සිම්බල් එක MT5 මාකට් වොච් එකට එකතු කර සත්‍යාපනය කිරීම
    if mt5.symbol_select(preferred_symbol, True):
        return preferred_symbol
    
    # එය නොමැති නම් වෙනත් පොදු විකල්ප සෙවීම
    fallbacks = [
        preferred_symbol.upper(),
        preferred_symbol.lower(),
        preferred_symbol + ".m",
        preferred_symbol + "m",
        preferred_symbol + ".ecn",
        "XAUUSD",
        "XAUUSD.m",
        "GOLD",
    ]
    for sym in fallbacks:
        if mt5.symbol_select(sym, True):
            logging.info(f"Using fallback symbol: {sym}")
            return sym

    logging.warning(f"Could not verify symbol {preferred_symbol}, using as-is.")
    return preferred_symbol


async def mt5_data_stream(websocket):
    logging.info("Frontend Client connected to Python MT5 Bridge!")

    if not mt5.initialize():
        logging.error(f"MT5 initialization failed, error code = {mt5.last_error()}")
        return

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if data.get("type") == "subscribe":
                    raw_symbol = data.get("symbol", "XAUUSD")
                    timeframe_str = data.get("timeframe", "1m")

                    # ස්වයංක්‍රීයව වැරදි ලෙස වෙනස් වීම වැළැක්වීම සඳහා නිවැරදි සත්‍යාපන ක්‍රමය භාවිතා කිරීම
                    symbol = get_verified_symbol(raw_symbol)

                    mt5_tf = mt5.TIMEFRAME_M1
                    if timeframe_str == "5m":
                        mt5_tf = mt5.TIMEFRAME_M5
                    elif timeframe_str == "15m":
                        mt5_tf = mt5.TIMEFRAME_M15
                    elif timeframe_str == "1h":
                        mt5_tf = mt5.TIMEFRAME_H1
                    elif timeframe_str == "4h":
                        mt5_tf = mt5.TIMEFRAME_H4
                    elif timeframe_str == "1D":
                        mt5_tf = mt5.TIMEFRAME_D1

                    # හිස්ට්‍රි ඩේටා ලබා ගැනීම සහ වැරදි අගයන් පෙරීම
                    rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, 300)
                    if rates is not None and len(rates) > 0:
                        history_data = []
                        for rate in rates:
                            close_val = float(rate["close"])
                            # XAUUSD සඳහා මිල 100 ට අඩු වැරදි අගයන් පැමිණේ නම් මඟ හරිනු ලැබේ
                            if symbol.upper().startswith("XAU") or symbol.upper().startswith("GOLD"):
                                if close_val < 100:
                                    continue

                            history_data.append({
                                "time": int(rate["time"]),
                                "open": float(rate["open"]),
                                "high": float(rate["high"]),
                                "low": float(rate["low"]),
                                "close": close_val,
                                "volume": float(rate["tick_volume"]),
                            })

                        await websocket.send(
                            json.dumps({"type": "history", "payload": history_data})
                        )
                        logging.info(
                            f"Sent {len(history_data)} history candles for {symbol}"
                        )

                    asyncio.create_task(
                        send_live_ticks(websocket, symbol, mt5_tf)
                    )

            except json.JSONDecodeError:
                logging.error("Invalid JSON received from client")

    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected.")
    except Exception as e:
        logging.error(f"Error in connection: {e}")


async def send_live_ticks(websocket, symbol, mt5_tf):
    try:
        while True:
            current_rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, 1)
            if current_rates is not None and len(current_rates) > 0:
                latest_candle = current_rates[0]
                close_val = float(latest_candle["close"])
                
                # රන් මිල සඳහා වැරදි කුඩා අගයන් යැවීම වැළැක්වීම
                if (symbol.upper().startswith("XAU") or symbol.upper().startswith("GOLD")) and close_val < 100:
                    await asyncio.sleep(1)
                    continue

                candle_data = {
                    "time": int(latest_candle["time"]),
                    "open": float(latest_candle["open"]),
                    "high": float(latest_candle["high"]),
                    "low": float(latest_candle["low"]),
                    "close": close_val,
                    "volume": float(latest_candle["tick_volume"]),
                }

                await websocket.send(json.dumps({"type": "candle", "payload": candle_data}))

            await asyncio.sleep(1)
    except Exception:
        pass


async def process_http_request(path, request_headers):
    if path == "/" and "Upgrade" not in request_headers:
        response_body = b"Nexus MT5 Bridge Server is Active!"
        return 200, [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(response_body)))
        ], response_body
    return None


async def main():
    server = await websockets.serve(
        mt5_data_stream, 
        "localhost", 
        PORT, 
        process_request=process_http_request
    )
    logging.info(f"MT5 Python WebSocket Server started on ws://localhost:{PORT}")
    await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())