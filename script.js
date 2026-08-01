// --- Nexus Trading Platform - Script.js (Instant Symbol Switch & Master Settings Integration) ---

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

// WebSocket Instance Control
let activeWsConnectionId = 0;

document.addEventListener('DOMContentLoaded', () => {
    window.currentSymbol = currentSymbol; 
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
            vertLines: { color: '#1f293d', visible: true },
            horzLines: { color: '#1f293d', visible: true },
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

    // TradingView style Right Click Menu Integration
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        if (!chart || !candlestickSeries) return;

        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
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
            window.currentSymbol = currentSymbol;
            
            // Update UI Labels instantly
            const symbolLabel = document.getElementById('activeSymbolLabel');
            if (symbolLabel) symbolLabel.innerText = currentSymbol;

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
                
                const tfLabel = document.getElementById('activeTimeframeLabel');
                if (tfLabel) tfLabel.innerText = currentTimeframe;

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

    if (replayToggleBtn) replayToggleBtn.addEventListener('click', promptReplaySelection);
    if (replayStepBtn) replayStepBtn.addEventListener('click', replayStepForward);
    if (replayPlayBtn) replayPlayBtn.addEventListener('click', toggleReplayPlay);
    if (replayExitBtn) replayExitBtn.addEventListener('click', exitReplayMode);

    // Sidebar Manual Alert Setup Button
    const setAlertBtn = document.getElementById('setAlertBtn');
    if (setAlertBtn) {
        setAlertBtn.addEventListener('click', () => {
            const price = document.getElementById('alertPriceInput').value;
            const condition = document.getElementById('alertConditionInput').value;
            if (price && window.nexusAlerts) {
                window.nexusAlerts.addAlert(currentSymbol, price, condition);
            } else {
                alert('Please enter a valid price.');
            }
        });
    }

    // Master Settings Modal & Top Navigation "Settings" Tab Integration
    const navTabs = document.querySelectorAll('.tab-btn');
    const masterModal = document.getElementById('masterSettingsModal');
    const closeMasterBtn = document.getElementById('closeMasterSettings');
    const saveMasterBtn = document.getElementById('saveMasterSettingsBtn');

    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            
            navTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            if (tabName === 'settings' && masterModal) {
                masterModal.style.display = 'flex';
            }
        });
    });

    if (closeMasterBtn && masterModal) {
        closeMasterBtn.addEventListener('click', () => {
            masterModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === masterModal) {
            masterModal.style.display = 'none';
        }
    });

    if (saveMasterBtn && chart) {
        saveMasterBtn.addEventListener('click', () => {
            const gridToggle = document.getElementById('masterGridToggle').checked;
            chart.applyOptions({
                grid: {
                    vertLines: { visible: gridToggle, color: '#1f293d' },
                    horzLines: { visible: gridToggle, color: '#1f293d' }
                }
            });

            const whaleToggle = document.getElementById('masterWhaleToggle').checked;
            const volumeProfileToggle = document.getElementById('masterVolumeProfileToggle').checked;
            const absorptionToggle = document.getElementById('masterAbsorptionToggle').checked;
            const footprintToggle = document.getElementById('masterFootprintToggle').checked;

            if (window.whaleBubbleModule) window.whaleBubbleModule.setVisibility(whaleToggle);
            if (window.volumeProfileModule) window.volumeProfileModule.setVisibility(volumeProfileToggle);
            if (window.absorptionModule) window.absorptionModule.setVisibility(absorptionToggle);
            if (window.nexusFootprint) window.nexusFootprint.setVisibility(footprintToggle);

            masterModal.style.display = 'none';
            alert('All settings saved successfully!');
        });
    }
}

// 3. Reset and Reload Chart Safely
function resetAndReload() {
    oldestTimestamp = null;
    hasMoreData = true;
    activeWsConnectionId++;
    
    // Close existing WebSocket immediately
    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) {}
        ws = null;
    }
    
    loadChartData(currentSymbol, currentTimeframe);
}

// 4. Load Initial Historical Data
async function loadChartData(symbol, timeframe) {
    try {
        window.currentSymbol = symbol;
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
            
            // Connect to WebSocket immediately after setting historical data
            connectWebSocket(symbol, timeframe);
        }

        const lastCandle = formattedData[formattedData.length - 1];
        updatePriceDisplay(lastCandle.close, lastCandle.open);

    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// 5. Load More Historical Data (Lazy Loading)
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

// 6. WebSocket Realtime Ticks (Instant Live Connection)
function connectWebSocket(symbol, timeframe) {
    const connectionId = ++activeWsConnectionId;

    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) {}
        ws = null;
    }
    
    if (isReplayMode) return;

    const wsUrl = `wss://stream.binance.com/ws/${symbol.toLowerCase()}@kline_${timeframe}`;
    
    try {
        const socket = new WebSocket(wsUrl);
        ws = socket;

        socket.onmessage = (event) => {
            if (isReplayMode || ws !== socket || connectionId !== activeWsConnectionId) return;
            
            try {
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

                    if (window.nexusAlerts) {
                        window.nexusAlerts.checkAlerts(candleData.close, currentSymbol);
                    }
                }
            } catch (err) {}
        };

        socket.onerror = () => {};

        socket.onclose = () => {
            if (ws === socket) {
                ws = null;
            }
        };
    } catch (err) {
        console.error('WebSocket connection error:', err);
    }
}

// --- Bar Replay Interactive Functions ---

function promptReplaySelection() {
    if (!fullHistoricalData || fullHistoricalData.length === 0) return;

    isSelectingReplayPoint = true;
    document.body.style.cursor = 'crosshair';
    alert('Please click on a candle on the chart to start Replay from that point.');
}

function activateReplayFromIndex(index) {
    isReplayMode = true;
    activeWsConnectionId++;

    if (ws) {
        try {
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        } catch (e) {}
        ws = null;
    }

    const toggleBtn = document.getElementById('replayToggleBtn');
    const actionBtns = document.getElementById('replayActionButtons');
    if (toggleBtn) toggleBtn.style.display = 'none';
    if (actionBtns) actionBtns.style.display = 'flex';

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
        alert('Replay finished!');
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

// 7. UI Price Badge Helper
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