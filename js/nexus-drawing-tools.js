// --- Nexus Trading Platform - Main Drawing Manager & Toolbar ---

// අනාගතයේදී සාදන වෙනම Tool Modules මෙහි ඉහළින් Import කරනු ලැබේ
// උදාහරණයක් ලෙස: import { TrendlineTool } from './tools/trendline.js';
// import { FibTool } from './tools/fibonacci.js';

import { TrendToolsModule } from './tools/trend-tools.js';

class NexusDrawingManager {
    constructor() {
        this.activeTool = 'cursor';
        this.isMagnetActive = false;
        this.isLocked = false;
        this.isVisible = true;
        this.drawings = [];
        
        this.initContainer();
        this.initToolbar();
        this.setupCanvasLayer();
    }

    // 1. Chart Container එක පරීක්ෂා කර සකස් කිරීම
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

    // 2. Toolbar එක සහ Icons පමණක් නිර්මාණය කිරීම
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

        // මෙහි Toolbar එකට අදාළ Icons සහ Tools ලැයිස්තුව පමණක් අඩංගු වේ
        const tools = [
            { id: 'cursor', icon: '➕', title: 'Cursor / Select' },
            { id: 'trendline', icon: '📈', title: 'Trend Line' },
            { id: 'fib', icon: '📊', title: 'Fibonacci Retracement' },
            { id: 'brush', icon: '🖌️', title: 'Brush / Freehand' },
            { id: 'text', icon: 'T', title: 'Text Note' },
            { id: 'measure', icon: '📏', title: 'Measure Range' },
            { type: 'separator' },
            { id: 'magnet', icon: '🧲', title: 'Magnet Mode', toggle: true },
            { id: 'lock', icon: '🔓', title: 'Lock All Drawings', toggle: true },
            { id: 'hide', icon: '👁️', title: 'Hide / Show Drawings', toggle: true },
            { type: 'separator' },
            { id: 'clear', icon: '🗑️', title: 'Clear All Drawings' }
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
            btn.innerHTML = item.icon;
            btn.title = item.title;
            btn.style.cssText = `
                background: ${this.activeTool === item.id ? '#26a69a' : 'transparent'};
                color: #d1d4dc; border: none; width: 32px; height: 32px;
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: 14px; cursor: pointer; transition: all 0.2s ease;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                this.handleToolClick(item.id, btn);
            };
            toolbar.appendChild(btn);
        });
    }

    // 3. Tool එකක් ක්ලික් කළ විට ක්‍රියාත්මක වන ප්‍රධාන පාලකය (Router)
    handleToolClick(toolId, btnElement) {
        if (toolId === 'clear') {
            if (confirm('සියලුම Drawings ඉවත් කිරීමට අවශ්‍යද?')) {
                this.drawings = [];
                this.redrawCanvas();
            }
            return;
        }

        if (toolId === 'magnet' || toolId === 'lock' || toolId === 'hide') {
            this.handleToggleTools(toolId, btnElement);
            return;
        }

        // අනෙකුත් ඇඳීමේ ටූල්ස් (Trendline, Fib ආදී වශයෙන්) තෝරාගැනීම
        document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => {
            if (!['tool_magnet', 'tool_lock', 'tool_hide', 'tool_clear'].includes(b.id)) {
                b.style.background = 'transparent';
                b.style.color = '#d1d4dc';
            }
        });

        this.activeTool = toolId;
        btnElement.style.background = '#26a69a';
        btnElement.style.color = '#ffffff';

        // අදාළ මොඩියුලය වෙත ඊළඟ විධානය ලබා දීම මෙතැනින් සිදු කළ හැක.
    }

    handleToggleTools(toolId, btnElement) {
        if (toolId === 'magnet') {
            this.isMagnetActive = !this.isMagnetActive;
            btnElement.style.background = this.isMagnetActive ? '#26a69a' : 'transparent';
        } else if (toolId === 'lock') {
            this.isLocked = !this.isLocked;
            btnElement.innerHTML = this.isLocked ? '🔒' : '🔓';
            btnElement.style.background = this.isLocked ? '#26a69a' : 'transparent';
        } else if (toolId === 'hide') {
            this.isVisible = !this.isVisible;
            btnElement.style.background = !this.isVisible ? '#ef5350' : 'transparent';
            const canvas = document.getElementById('nexusDrawingCanvas');
            if (canvas) canvas.style.display = this.isVisible ? 'block' : 'none';
        }
    }

    // 4. Canvas ස්ථරය සැකසීම
    setupCanvasLayer() {
        if (!this.container) return;

        let canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'nexusDrawingCanvas';
            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 22;';
            canvas.width = this.container.clientWidth;
            canvas.height = this.container.clientHeight;
            this.container.appendChild(canvas);
        }

        window.addEventListener('resize', () => {
            if (this.container) {
                canvas.width = this.container.clientWidth;
                canvas.height = this.container.clientHeight;
                this.redrawCanvas();
            }
        });
    }

    redrawCanvas() {
        const canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // අදාළ මොඩියුල හරහා drawings render කිරීම මෙහි සිදු වේ
    }
}

// ආරම්භ කිරීම
window.addEventListener('DOMContentLoaded', () => {
    window.nexusDrawingManager = new NexusDrawingManager();
});