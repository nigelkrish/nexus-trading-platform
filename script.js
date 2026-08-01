// 5. WebSocket Realtime Ticks (Fully Safe & Lock-Protected)
let isConnectingWs = false;

function connectWebSocket(symbol, timeframe) {
    // 1. පවතින WebSocket එකක් ඇත්නම් ආරක්ෂාකාරීව ක්ලෝස් කිරීම
    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        } catch (e) {
            console.error('Error closing previous websocket:', e);
        }
        ws = null;
    }
    
    if (isReplayMode || isConnectingWs) return;
    isConnectingWs = true;

    // 2. ඊළඟ මයික්‍රෝ-ටාස්ක් එකේදී කනෙක්ට් වීම (Race conditions වළක්වයි)
    setTimeout(() => {
        if (isReplayMode) {
            isConnectingWs = false;
            return;
        }
        
        const wsUrl = `wss://stream.binance.com/ws/${symbol.toLowerCase()}@kline_${timeframe}`;
        
        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                isConnectingWs = false;
            };

            ws.onmessage = (event) => {
                if (isReplayMode) return;
                const message = JSON.parse(event.data);
                if (message.k) {
                    const kline = message.k;
                    const candleData = {
                        time: kline.t / 1000,
                        open: parseFloat(kline.o),
                        high: parseFloat(kline.h),
                        low: parseFloat(kline.l),
                        close: parseFloat(kline.c)
                    };

                    candlestickSeries.update(candleData);
                    updatePriceDisplay(candleData.close, candleData.open);

                    // Pass live price to Modular Alert System
                    if (window.nexusAlerts) {
                        window.nexusAlerts.checkAlerts(candleData.close, currentSymbol);
                    }
                }
            };

            ws.onerror = (error) => {
                isConnectingWs = false;
            };

            ws.onclose = () => {
                isConnectingWs = false;
            };
        } catch (err) {
            isConnectingWs = false;
            console.error('Failed to create WebSocket:', err);
        }
    }, 200);
}