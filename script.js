// --- Nexus Trading Platform - Script.js (Fully Fixed & Optimized with Modular Context Menu) ---

let chart;
let candlestickSeries;
let currentSymbol = 'PAXGUSDT';
let currentTimeframe = '1m';
let ws = null;

// Pagination / History Loading States
let oldestTimestamp = null;
let isLoadingMore = false;
let hasMoreData = true;

// Bar Replay States
let isReplayMode = false;
let isSelectingReplayPoint = false;
let fullHistoricalData = [];
let replayIndex = 0;
let replayTimer = null;
let isPlaying = false;

// WebSocket Debounce Timer State
let wsDebounceTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    window.currentSymbol = currentSymbol; // Sync initial global symbol
    initChart();
    setupEventListeners();
    loadChartData(currentSymbol, currentTimeframe);
});

// 1. Chart Initialization
function initChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;

    chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
            background: { type: 'solid', color: '#131722' },
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: { color: '#1f293d' },
            horzLines: { color: '#1f293d' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        },
        rightPriceScale: {
            borderColor: '#2a2e39',
        },
        timeScale: {
            borderColor: '#2a2e39',
            timeVisible: true,
            secondsVisible: false,
        },
    });

    candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
    });

    // Make chart and series globally accessible for modules
    window.chart = chart;
    window.candlestickSeries = candlestickSeries;

    // Handle Responsive Resize
    window.addEventListener('resize', () => {
        if (chart && container) {
            chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
        }
    });

    // TradingView-style Lazy Loading on Scroll
    chart.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
        if (!timeRange || isReplayMode) return;
        
        if (timeRange.from < 5 && !isLoadingMore && hasMoreData) {
            loadMoreHistoricalData();
        }
    });

    // TradingView style: Click on chart to set Replay starting point
    chart.subscribeClick(param => {
        if (!isSelectingReplayPoint || !param.time) return;

        const clickedTime = param.time;
        const targetIndex = fullHistoricalData.findIndex(item => item.time === clickedTime);

        if (targetIndex !== -1) {
            isSelectingReplayPoint = false;
            document.body.style.cursor = 'default';
            activateReplayFromIndex(targetIndex);
        }
    });

    // TradingView-style Right Click Menu Integration
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault(); // Stop default browser right-click menu
        
        if (!chart || !candlestickSeries) return;

        // Get mouse coordinates relative to chart container
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;

        // Convert pixel y-coordinate to price value using Lightweight Charts API
        const coordinatePrice = candlestickSeries.coordinateToPrice(y);
        
        if (coordinatePrice !== null && window.chartContextMenu) {
            window.chartContextMenu.show(e.clientX, e.clientY, coordinatePrice, currentSymbol);
        }
    });
}

// 2. Event Listeners Setup
function setupEventListeners() {
    const symbolSelect = document.getElementById('symbolSelect');
    if (symbolSelect) {
        symbolSelect.addEventListener('change', (e) => {
            currentSymbol = e.target.value;
            window.currentSymbol = currentSymbol; // Sync with global window object
            document.getElementById('activeSymbolLabel').innerText = currentSymbol;
            exitReplayMode();
            resetAndReload();
        });
    }

    const tfGroup = document.getElementById('timeframeGroup');
    if (tfGroup) {
        tfGroup.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                tfGroup.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentTimeframe = e.target.getAttribute('data-tf');
                document.getElementById('activeTimeframeLabel').innerText = currentTimeframe;
                exitReplayMode();
                resetAndReload();
            });
        });
    }

    // Bar Replay Buttons
    const replayToggleBtn = document.getElementById('replayToggleBtn');
    const replayStepBtn = document.getElementById('replayStepBtn');
    const replayPlayBtn = document.getElementById('replayPlayBtn');
    const replayExitBtn = document.getElementById('replayExitBtn');

    if (replayToggleBtn) {
        replayToggleBtn.addEventListener('click', promptReplaySelection);
    }
    if (replayStepBtn) {
        replayStepBtn.addEventListener('click', replayStepForward);
    }
    if (replayPlayBtn) {
        replayPlayBtn.addEventListener('click', toggleReplayPlay);
    }
    if (replayExitBtn) {
        replayExitBtn.addEventListener('click', exitReplayMode);
    }

    // Sidebar Manual Alert Setup Button
    const setAlertBtn = document.getElementById('setAlertBtn');
    if (setAlertBtn) {
        setAlertBtn.addEventListener('click', () => {
            const price = document.getElementById('alertPriceInput').value;
            const condition = document.getElementById('alertConditionInput').value;
            if (price && window.nexusAlerts) {
                window.nexusAlerts.addAlert(currentSymbol, price, condition);
            } else {
                alert('කරුණාකර නිවැරදි මිලක් ඇතුළත් කරන්න.');
            }
        });
    }
}

function resetAndReload() {
    oldestTimestamp = null;
    hasMoreData = true;
    
    // පරණ WebSocket කනෙක්ෂන් එක ආරක්ෂාකාරීව Close කිරීම
    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        } catch (e) {}
        ws = null;
    }
    
    loadChartData(currentSymbol, currentTimeframe);
}

// 3. Load Initial Historical Data
async function loadChartData(symbol, timeframe) {
    try {
        window.currentSymbol = symbol; // Keep global in sync
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=500`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) return;

        const formattedData = data.map(item => ({
            time: item[0] / 1000,
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
        }));

        oldestTimestamp = data[0][0];
        fullHistoricalData = formattedData;

        if (!isReplayMode) {
            candlestickSeries.setData(formattedData);
            chart.timeScale().fitContent();
            connectWebSocket(symbol, timeframe);
        }

        const lastCandle = formattedData[formattedData.length - 1];
        updatePriceDisplay(lastCandle.close, lastCandle.open);

    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// 4. Load More Historical Data (Lazy Loading)
async function loadMoreHistoricalData() {
    if (isLoadingMore || !hasMoreData || !oldestTimestamp || isReplayMode) return;

    isLoadingMore = true;

    try {
        const limit = 500;
        const url = `https://api.binance.com/api/v3/klines?symbol=${currentSymbol}&interval=${currentTimeframe}&endTime=${oldestTimestamp - 1}&limit=${limit}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) {
            hasMoreData = false;
            isLoadingMore = false;
            return;
        }

        const olderData = data.map(item => ({
            time: item[0] / 1000,
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
        }));

        oldestTimestamp = data[0][0];

        const currentSeriesData = candlestickSeries.data() || [];
        const combinedData = [...olderData, ...currentSeriesData];
        
        fullHistoricalData = combinedData;
        candlestickSeries.setData(combinedData);

    } catch (error) {
        console.error('Error loading more historical data:', error);
    } finally {
        isLoadingMore = false;
    }
}

// 5. WebSocket Realtime Ticks (Debounced & Safe Connection)
function connectWebSocket(symbol, timeframe) {
    // 1. කලින් දමා ඇති ඩවුන්බවුන්ස් ටයිමර් එක ක්ලියර් කිරීම (අනවශ්‍ය කනෙක්ෂන් ඉල්ලීම් මඟහරියි)
    if (wsDebounceTimer) {
        clearTimeout(wsDebounceTimer);
        wsDebounceTimer = null;
    }

    // 2. පවතින WebSocket එකක් ඇත්නම් එය වහාම క్ලෝස් කිරීම
    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        } catch (e) {}
        ws = null;
    }
    
    if (isReplayMode) return;

    // 3. මිලිසෙකන්ඩ් 300ක ප්‍රමාදයක් (Debounce) දී අලුත් කනෙක්ෂන් එක ඕපන් කිරීම
    wsDebounceTimer = setTimeout(() => {
        if (isReplayMode) return;

        const wsUrl = `wss://stream.binance.com/ws/${symbol.toLowerCase()}@kline_${timeframe}`;
        
        try {
            ws = new WebSocket(wsUrl);

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
                // Silently handle
            };
        } catch (err) {
            console.error('WebSocket connection error:', err);
        }
    }, 300);
}

// --- Bar Replay Interactive Functions ---

function promptReplaySelection() {
    if (!fullHistoricalData || fullHistoricalData.length === 0) return;

    isSelectingReplayPoint = true;
    document.body.style.cursor = 'crosshair';
    alert('කරුණාකර චාට් එක මත Replay පටන් ගැනීමට අවශ්‍ය කැන්ඩ්ල් එකක් මත ක්ලික් කරන්න.');
}

function activateReplayFromIndex(index) {
    isReplayMode = true;
    if (wsDebounceTimer) {
        clearTimeout(wsDebounceTimer);
        wsDebounceTimer = null;
    }
    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        } catch (e) {}
        ws = null;
    }

    document.getElementById('replayToggleBtn').style.display = 'none';
    document.getElementById('replayActionButtons').style.display = 'flex';

    replayIndex = index;
    const initialReplaySlice = fullHistoricalData.slice(0, replayIndex + 1);

    candlestickSeries.setData(initialReplaySlice);
    chart.timeScale().fitContent();
}

function replayStepForward() {
    if (!isReplayMode) return;
    if (replayIndex + 1 < fullHistoricalData.length) {
        replayIndex++;
        const nextCandle = fullHistoricalData[replayIndex];
        candlestickSeries.update(nextCandle);
        updatePriceDisplay(nextCandle.close, nextCandle.open);
        
        if (window.nexusAlerts) {
            window.nexusAlerts.checkAlerts(nextCandle.close, currentSymbol);
        }
    } else {
        stopReplayPlay();
        alert('Replay අවසන් විය!');
    }
}

function toggleReplayPlay() {
    if (isPlaying) {
        stopReplayPlay();
    } else {
        startReplayPlay();
    }
}

function startReplayPlay() {
    isPlaying = true;
    const playBtn = document.getElementById('replayPlayBtn');
    if (playBtn) playBtn.innerText = '⏸';
    replayTimer = setInterval(() => {
        if (replayIndex + 1 < fullHistoricalData.length) {
            replayStepForward();
        } else {
            stopReplayPlay();
        }
    }, 600);
}

function stopReplayPlay() {
    isPlaying = false;
    const playBtn = document.getElementById('replayPlayBtn');
    if (playBtn) playBtn.innerText = '⏯';
    if (replayTimer) {
        clearInterval(replayTimer);
        replayTimer = null;
    }
}

function exitReplayMode() {
    isReplayMode = false;
    isSelectingReplayPoint = false;
    document.body.style.cursor = 'default';
    stopReplayPlay();

    const toggleBtn = document.getElementById('replayToggleBtn');
    const actionBtns = document.getElementById('replayActionButtons');
    if (toggleBtn) toggleBtn.style.display = 'inline-block';
    if (actionBtns) actionBtns.style.display = 'none';

    if (fullHistoricalData.length > 0) {
        candlestickSeries.setData(fullHistoricalData);
        chart.timeScale().fitContent();
    }
    connectWebSocket(currentSymbol, currentTimeframe);
}

// 6. UI Price Badge Helper
function updatePriceDisplay(currentPrice, openPrice) {
    const priceDisplay = document.getElementById('currentPriceDisplay');
    const changeDisplay = document.getElementById('priceChangeDisplay');

    if (priceDisplay) {
        priceDisplay.innerText = currentPrice.toFixed(2);
    }

    if (changeDisplay) {
        const diff = currentPrice - openPrice;
        const percent = (diff / openPrice) * 100;
        const sign = percent >= 0 ? '+' : '';
        changeDisplay.innerText = `${sign}${percent.toFixed(2)}%`;
        changeDisplay.className = percent >= 0 ? 'positive' : 'negative';
    }
}