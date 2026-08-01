import { TrendToolsModule } from './tools/trend-tools.js';

class NexusDrawingManager {
    constructor() {
        this.activeTool = 'trendline';
        this.activeSubTool = 'trendline'; // Default sub-tool
        this.drawings = [];
        this.trendModule = new TrendToolsModule();
        
        this.initContainer();
        this.initToolbar();
        this.setupCanvasLayer();
    }

    initContainer() {
        this.container = document.getElementById('chartContainer');
        if (!this.container) {
            setTimeout(() => this.initContainer(), 300);
            return;
        }
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
    }

    initToolbar() {
        if (!this.container) return;

        let toolbar = document.getElementById('nexusDrawingToolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'nexusDrawingToolbar';
            toolbar.style.cssText = `
                position: absolute; left: 10px; top: 60px; z-index: 35;
                background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
                display: flex; flex-direction: column; gap: 4px; padding: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4); user-select: none;
            `;
            this.container.appendChild(toolbar);
        }

        toolbar.innerHTML = '';

        // TradingView මෝස්තරයට අනුව Trend Tool ප්‍රධාන අයිකනය
        const tools = [
            { id: 'trendline', icon: '📈', title: 'Trend Tools (Ray, Channel, etc.)', hasSubMenu: true },
            { id: 'fib', icon: '📊', title: 'Fibonacci Retracement' },
            { id: 'brush', icon: '🖌️', title: 'Brush' },
            { id: 'text', icon: 'T', title: 'Text Note' },
            { type: 'separator' },
            { id: 'clear', icon: '🗑️', title: 'Clear All' }
        ];

        tools.forEach(item => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 1px; background: #363c4e; margin: 4px 2px;';
                toolbar.appendChild(sep);
                return;
            }

            const btn = document.createElement('button');
            btn.id = `tool_${item.id}`;
            btn.innerHTML = item.icon + (item.hasSubMenu ? ' <span style="font-size:9px;">▼</span>' : '');
            btn.title = item.title;
            btn.style.cssText = `
                background: ${this.activeTool === item.id ? '#26a69a' : 'transparent'};
                color: #d1d4dc; border: none; width: 36px; height: 32px;
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: 13px; cursor: pointer; transition: all 0.2s ease;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                if (item.hasSubMenu) {
                    this.trendModule.showSubMenu(btn, (selectedSubTool) => {
                        this.activeSubTool = selectedSubTool;
                        btn.innerHTML = (selectedSubTool === 'ray' ? '↗️' : selectedSubTool === 'horizline' ? '➖' : '📈') + ' <span style="font-size:9px;">▼</span>';
                    });
                }
                this.handleToolClick(item.id, btn);
            };
            toolbar.appendChild(btn);
        });
    }

    handleToolClick(toolId, btnElement) {
        if (toolId === 'clear') {
            this.drawings = [];
            this.redrawCanvas();
            return;
        }
        document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => b.style.background = 'transparent');
        this.activeTool = toolId;
        btnElement.style.background = '#26a69a';
    }

    setupCanvasLayer() {
        let canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nexusDrawingCanvas';
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; z-index: 22;';
            canvas.width = this.container.clientWidth;
            canvas.height = this.container.clientHeight;
            this.container.appendChild(canvas);
        }

        let isDrawing = false;
        let startX = 0, startY = 0;

        canvas.onmousedown = (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
        };

        canvas.onmouseup = (e) => {
            if (!isDrawing) return;
            isDrawing = false;
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            if (this.activeTool === 'trendline') {
                this.drawings.push({
                    type: 'trend',
                    subType: this.activeSubTool,
                    x1: startX, y1: startY,
                    x2: endX, y2: endY,
                    color: '#26a69a', width: 2
                });
                this.redrawCanvas();
            }
        };
    }

    redrawCanvas() {
        const canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.drawings.forEach(item => {
            if (item.type === 'trend') {
                this.trendModule.draw(ctx, item);
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.nexusDrawingManager = new NexusDrawingManager();
});