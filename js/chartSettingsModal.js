// --- Nexus Trading Platform - Chart Settings Modal Module ---

class ChartSettingsModal {
    constructor() {
        this.modalElement = null;
        
        // TradingView වගේ පාවිච්චි කරන Default Colors
        this.defaultSettings = {
            upBody: '#26a69a',      
            downBody: '#ef5350',    
            upBorder: '#26a69a',
            downBorder: '#ef5350',
            upWick: '#26a69a',
            downWick: '#ef5350',
            bgColor: '#131722',
            symbolColor: '#26a69a',
            prevCloseColor: '#787b86',
            highLowColor: '#26a69a',
            bidColor: '#2962ff',
            askColor: '#ef5350'
        };

        this.init();
    }

    init() {
        this.modalElement = document.getElementById('tradingViewSettingsModal');
        
        if (this.modalElement) {
            this.modalElement.style.setProperty('display', 'none', 'important');
        }

        this.attachEventListeners();
        this.initColorPickers(); 
    }

    initColorPickers() {
        const modal = this.modalElement;
        if (!modal) return;

        const colorMappings = [
            { id: 'tvUpBodyColor', defaultVal: this.defaultSettings.upBody },
            { id: 'tvDownBodyColor', defaultVal: this.defaultSettings.downBody },
            { id: 'tvUpBorderColor', defaultVal: this.defaultSettings.upBorder },
            { id: 'tvDownBorderColor', defaultVal: this.defaultSettings.downBorder },
            { id: 'tvUpWickColor', defaultVal: this.defaultSettings.upWick },
            { id: 'tvDownWickColor', defaultVal: this.defaultSettings.downWick },
            { id: 'tvBgColor', defaultVal: this.defaultSettings.bgColor },
            { id: 'tvSymbolColor', defaultVal: this.defaultSettings.symbolColor },
            { id: 'tvPrevCloseColor', defaultVal: this.defaultSettings.prevCloseColor },
            { id: 'tvHighLowColor', defaultVal: this.defaultSettings.highLowColor },
            { id: 'tvBidColor', defaultVal: this.defaultSettings.bidColor },
            { id: 'tvAskColor', defaultVal: this.defaultSettings.askColor }
        ];

        colorMappings.forEach(item => {
            const inputEl = document.getElementById(item.id) || modal.querySelector(`#${item.id}`);
            if (inputEl) {
                inputEl.value = item.defaultVal;
                
                const wrapper = inputEl.closest('.tv-color-box-wrapper') || inputEl.parentElement;
                if (wrapper) {
                    const swatch = wrapper.querySelector('.tv-custom-color-swatch');
                    if (swatch) {
                        swatch.style.backgroundColor = item.defaultVal;
                    }
                }
            }
        });
    }

    attachEventListeners() {
        const modal = this.modalElement;
        if (!modal) return;

        // 1. Open modal only when clicking "Settings" in top navigation
        const mainSettingsNavBtn = document.getElementById('mainSettingsNavBtn');
        if (mainSettingsNavBtn) {
            mainSettingsNavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.show();
            });
        }

        // 2. Tab Switching logic inside modal
        const tabs = modal.querySelectorAll('.tv-tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.getAttribute('data-target');
                modal.querySelectorAll('.tv-panel-content').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                const targetPanel = modal.querySelector(`#${targetId}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });

        // 3. Live UI update for Rounded Color Boxes
        const colorInputs = modal.querySelectorAll('input[type="color"], .tv-native-color-input');
        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const selectedColor = e.target.value;
                const wrapper = e.target.closest('.tv-color-box-wrapper') || e.target.parentElement;
                if (wrapper) {
                    const swatch = wrapper.querySelector('.tv-custom-color-swatch');
                    if (swatch) {
                        swatch.style.backgroundColor = selectedColor;
                    }
                }
            });
        });

        // 4. Close / Cancel / OK / Cross Button Listeners
        const closeModal = () => { 
            modal.style.setProperty('display', 'none', 'important'); 
        };

        modal.addEventListener('click', (e) => {
            const target = e.target;
            const isCloseBtn = target.id === 'closeChartSettings' || 
                               target.classList.contains('close-btn') || 
                               target.classList.contains('tv-close-btn') ||
                               target.id === 'tvCancelBtn' ||
                               target.textContent.trim() === '×' ||
                               target.closest('.tv-close-btn') ||
                               target.closest('#closeChartSettings');

            const isOkBtn = target.id === 'tvOkBtn' || target.closest('#tvOkBtn');

            if (isCloseBtn || isOkBtn) {
                e.preventDefault();
                e.stopPropagation();
                if (isOkBtn) {
                    this.applySettingsToChart();
                }
                closeModal();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    applySettingsToChart() {
        if (!window.chart || !window.candlestickSeries) return;

        // 1. Read values securely from inputs
        const upBodyInput = document.getElementById('tvUpBodyColor') || document.querySelector('#panel-symbol input[type="color"]');
        const downBodyInput = document.getElementById('tvDownBodyColor') || document.querySelectorAll('#panel-symbol input[type="color"]')[1];
        
        const upBorderInput = document.getElementById('tvUpBorderColor');
        const downBorderInput = document.getElementById('tvDownBorderColor');
        const upWickInput = document.getElementById('tvUpWickColor');
        const downWickInput = document.getElementById('tvDownWickColor');

        const vertGridToggle = document.getElementById('tvVertGridToggle') || document.getElementById('masterGridToggle');
        const horzGridToggle = document.getElementById('tvHorzGridToggle');
        const bgColorInput = document.getElementById('tvBgColor') || document.querySelector('#panel-canvas input[type="color"]');

        // Scales & Lines Inputs reading
        const currencyUnit = document.getElementById('tvCurrencyUnit')?.value;
        const scaleModes = document.getElementById('tvScaleModes')?.value;
        const lockPriceRatio = document.getElementById('tvLockPriceRatio')?.checked;
        const scalesPlacement = document.getElementById('tvScalesPlacement')?.value;

        const noOverlappingLabels = document.getElementById('tvNoOverlappingLabels')?.checked;
        const plusButton = document.getElementById('tvPlusButton')?.checked;
        const countdownBarClose = document.getElementById('tvCountdownBarClose')?.checked;
        
        const symbolLabelMode = document.getElementById('tvSymbolLabelMode')?.value;
        const symbolPriceSource = document.getElementById('tvSymbolPriceSource')?.value;
        const symbolColor = document.getElementById('tvSymbolColor')?.value;

        const prevCloseMode = document.getElementById('tvPrevCloseMode')?.value;
        const prevCloseColor = document.getElementById('tvPrevCloseColor')?.value;

        const indicatorsFinMode = document.getElementById('tvIndicatorsFinMode')?.value;
        const highLowMode = document.getElementById('tvHighLowMode')?.value;
        const highLowColor = document.getElementById('tvHighLowColor')?.value;

        const bidAskMode = document.getElementById('tvBidAskMode')?.value;
        const bidColor = document.getElementById('tvBidColor')?.value;
        const askColor = document.getElementById('tvAskColor')?.value;

        // Time Scale Inputs reading
        const dayOfWeekLabels = document.getElementById('tvDayOfWeekLabels')?.checked;
        const dateFormat = document.getElementById('tvDateFormat')?.value;
        const timeHoursFormat = document.getElementById('tvTimeHoursFormat')?.value;
        const saveLeftEdge = document.getElementById('tvSaveLeftEdge')?.checked;

        // 2. Apply options to Lightweight Charts series
        const seriesOptions = {};
        
        if (upBodyInput) seriesOptions.upColor = upBodyInput.value;
        if (downBodyInput) seriesOptions.downColor = downBodyInput.value;
        
        if (upBorderInput) seriesOptions.borderUpColor = upBorderInput.value;
        else if (upBodyInput) seriesOptions.borderUpColor = upBodyInput.value;

        if (downBorderInput) seriesOptions.borderDownColor = downBorderInput.value;
        else if (downBodyInput) seriesOptions.borderDownColor = downBodyInput.value;

        if (upWickInput) seriesOptions.wickUpColor = upWickInput.value;
        else if (upBodyInput) seriesOptions.wickUpColor = upBodyInput.value;

        if (downWickInput) seriesOptions.wickDownColor = downWickInput.value;
        else if (downBodyInput) seriesOptions.wickDownColor = downBodyInput.value;

        window.candlestickSeries.applyOptions(seriesOptions);

        // 3. Apply chart options (Grid, Background, Scales & TimeScale)
        const chartOptions = {
            grid: {
                vertLines: { visible: vertGridToggle ? vertGridToggle.checked : true },
                horzLines: { visible: horzGridToggle ? horzGridToggle.checked : true }
            },
            rightPriceScale: {
                visible: scalesPlacement !== 'left',
                autoScale: !lockPriceRatio,
            },
            leftPriceScale: {
                visible: scalesPlacement === 'left',
            },
            timeScale: {
                rightOffset: 12,
                barSpacing: 6,
                fixLeftEdge: saveLeftEdge,
                timeVisible: true,
                secondsVisible: false,
            }
        };

        if (bgColorInput) {
            chartOptions.layout = {
                background: { type: 'solid', color: bgColorInput.value }
            };
        }

        window.chart.applyOptions(chartOptions);

        // Custom config state storage (օයාට අවශ්‍ය නම් වෙනත් ලොජික් වලට පාවිච්චි කරන්න පුළුවන්)
        window.nexusChartConfig = {
            currencyUnit, scaleModes, lockPriceRatio, scalesPlacement,
            noOverlappingLabels, plusButton, countdownBarClose,
            symbolLabelMode, symbolPriceSource, symbolColor,
            prevCloseMode, prevCloseColor, indicatorsFinMode,
            highLowMode, highLowColor, bidAskMode, bidColor, askColor,
            dayOfWeekLabels, dateFormat, timeHoursFormat, saveLeftEdge
        };
    }

    show() {
        if (this.modalElement) {
            this.modalElement.style.setProperty('display', 'flex', 'important');
            this.initColorPickers(); 
        }
    }
}

// Initialize and attach to global scope
document.addEventListener('DOMContentLoaded', () => {
    window.chartSettingsModal = new ChartSettingsModal();
});