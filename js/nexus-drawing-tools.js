// --- Nexus Trading Platform - Advanced Drawing Manager (Main File) ---
import { NexusDrawingSettings } from './nexus-drawing-settings.js';

class TrendToolsModule {
    constructor() {
        this.subTools = [
            { id: 'trendline', name: 'Trend Line', icon: '📈' },
            { id: 'ray', name: 'Ray', icon: '↗️' },
            { id: 'infoline', name: 'Info Line', icon: 'ℹ️' },
            { id: 'extendedline', name: 'Extended Line', icon: '⟷' },
            { id: 'horizline', name: 'Horizontal Line', icon: '➖' },
            { id: 'vertline', name: 'Vertical Line', icon: '⏐' },
            { id: 'parallelchannel', name: 'Parallel Channel', icon: '📊' }
        ];
    }

    showSubMenu(parentButton, onSelectCallback) {
        let existingMenu = document.getElementById('nexusTrendSubMenu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'nexusTrendSubMenu';
        menu.style.cssText = `
            position: absolute; left: 45px; top: ${parentButton.offsetTop}px; z-index: 50;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
            display: flex; flex-direction: column; gap: 2px; padding: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5); width: 160px; user-select: none;
        `;

        this.subTools.forEach(tool => {
            const item = document.createElement('div');
            item.innerHTML = `<span style="margin-right:8px;">${tool.icon}</span> ${tool.name}`;
            item.style.cssText = `
                padding: 6px 10px; font-size: 12px; color: #d1d4dc; cursor: pointer;
                border-radius: 4px; display: flex; align-items: center; transition: background 0.2s;
            `;
            item.onmouseover = () => item.style.background = '#2a2e39';
            item.onmouseout = () => item.style.background = 'transparent';
            
            item.onclick = (e) => {
                e.stopPropagation();
                onSelectCallback(tool.id, tool.icon);
                menu.remove();
            };
            menu.appendChild(item);
        });

        parentButton.parentElement.appendChild(menu);

        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    draw(ctx, item, isSelected = false) {
        ctx.strokeStyle = item.color || '#26a69a';
        ctx.fillStyle = item.color || '#26a69a';
        ctx.lineWidth = item.width || 2;

        if (item.subType === 'trendline' || item.type === 'trend') {
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
            ctx.stroke();
        } 
        else if (item.subType === 'ray') {
            const angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
            const extendedX = item.x1 + Math.cos(angle) * 3000;
            const extendedY = item.y1 + Math.sin(angle) * 3000;
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(extendedX, extendedY);
            ctx.stroke();
        } 
        else if (item.subType === 'horizline') {
            ctx.beginPath();
            ctx.moveTo(0, item.y1);
            ctx.lineTo(ctx.canvas.width, item.y1);
            ctx.stroke();
        } 
        else if (item.subType === 'vertline') {
            ctx.beginPath();
            ctx.moveTo(item.x1, 0);
            ctx.lineTo(item.x1, ctx.canvas.height);
            ctx.stroke();
        }
        else if (item.subType === 'parallelchannel') {
            if (item.yOffset === undefined) item.yOffset = 60;
            if (item.channelShiftX === undefined) item.channelShiftX = 0;

            const bX1 = item.x1 + item.channelShiftX;
            const bY1 = item.y1 + item.yOffset;
            const bX2 = item.x2 + item.channelShiftX;
            const bY2 = item.y2 + item.yOffset;
            
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(bX1, bY1);
            ctx.lineTo(bX2, bY2);
            ctx.stroke();

            ctx.save();
            ctx.strokeStyle = item.color || '#26a69a';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo((item.x1 + bX1) / 2, (item.y1 + bY1) / 2);
            ctx.lineTo((item.x2 + bX2) / 2, (item.y2 + bY2) / 2);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = 'rgba(38, 166, 154, 0.06)';
            ctx.beginPath();
            ctx.moveTo(item.x1, item.y1);
            ctx.lineTo(item.x2, item.y2);
            ctx.lineTo(bX2, bY2);
            ctx.lineTo(bX1, bY1);
            ctx.closePath();
            ctx.fill();

            const midX = (item.x1 + item.x2 + bX1 + bX2) / 4;
            const midY = (item.y1 + item.y2 + bY1 + bY2) / 4;
            let angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
            if (angle > Math.PI / 2) angle -= Math.PI;
            if (angle < -Math.PI / 2) angle += Math.PI;

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);
            if (item.text) {
                ctx.font = '11px Inter, sans-serif';
                ctx.fillStyle = item.color || '#26a69a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.text, 0, 0);
            } else if (isSelected) {
                ctx.font = '11px Inter, sans-serif';
                ctx.fillStyle = '#848e9c';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+ Add text', 0, 0);
            }
            ctx.restore();
        }

        if (item.subType !== 'parallelchannel') {
            const midX = (item.x1 + item.x2) / 2;
            const midY = (item.y1 + item.y2) / 2;
            let angle = Math.atan2(item.y2 - item.y1, item.x2 - item.x1);
            
            if (angle > Math.PI / 2) angle -= Math.PI;
            if (angle < -Math.PI / 2) angle += Math.PI;

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);

            if (item.text) {
                ctx.font = '11px Inter, sans-serif';
                ctx.fillStyle = item.color || '#26a69a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.text, 0, -10);
            } else if (isSelected) {
                ctx.font = '11px Inter, sans-serif';
                ctx.fillStyle = '#848e9c';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+ Add text', 0, -10);
            }
            ctx.restore();
        }

        if (isSelected) {
            const drawHandle = (hx, hy, isSquare = false) => {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#2962ff';
                ctx.lineWidth = 2;
                if (isSquare) {
                    ctx.fillRect(hx - 5, hy - 5, 10, 10);
                    ctx.strokeRect(hx - 5, hy - 5, 10, 10);
                } else {
                    ctx.beginPath();
                    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();
            };

            if (item.subType === 'parallelchannel') {
                if (item.yOffset === undefined) item.yOffset = 60;
                const bX1 = item.x1 + (item.channelShiftX || 0);
                const bY1 = item.y1 + item.yOffset;
                const bX2 = item.x2 + (item.channelShiftX || 0);
                const bY2 = item.y2 + item.yOffset;

                drawHandle(item.x1, item.y1, false);
                drawHandle(item.x2, item.y2, false);
                drawHandle(bX1, bY1, false);
                drawHandle(bX2, bY2, false);
                drawHandle((item.x1 + item.x2) / 2, (item.y1 + item.y2) / 2, true);
                drawHandle((bX1 + bX2) / 2, (bY1 + bY2) / 2, true);
            } else {
                drawHandle(item.x1, item.y1, false);
                drawHandle(item.x2, item.y2, false);
            }
        }
    }
}

class NexusDrawingManager {
    constructor() {
        this.activeTool = 'cursor';
        this.activeSubTool = 'trendline';
        this.isMagnetActive = false;
        this.isLocked = false;
        this.isVisible = true;
        this.drawings = [];
        this.selectedDrawing = null;
        this.draggingHandle = null; 
        
        this.trendModule = new TrendToolsModule();
        this.settingsModule = new NexusDrawingSettings(this);

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
                position: absolute; left: 10px; top: 60px; z-index: 9999;
                background: #1e222d; border: 1px solid #363c4e; border-radius: 6px;
                display: flex; flex-direction: column; gap: 4px; padding: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4); user-select: none;
            `;
            this.container.appendChild(toolbar);
        }

        toolbar.innerHTML = '';

        const tools = [
            { id: 'cursor', icon: '➕', title: 'Cursor / Select' },
            { id: 'trendline', icon: '📈', title: 'Trend Line Tools', hasSubMenu: true },
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
            btn.innerHTML = item.icon + (item.hasSubMenu ? ' <span style="font-size:8px;">▼</span>' : '');
            btn.title = item.title;
            btn.style.cssText = `
                background: ${this.activeTool === item.id ? '#26a69a' : 'transparent'};
                color: #d1d4dc; border: none; width: 32px; height: 32px;
                border-radius: 4px; display: flex; align-items: center; justify-content: center;
                font-size: 14px; cursor: pointer; transition: all 0.2s ease;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                if (item.hasSubMenu) {
                    this.trendModule.showSubMenu(btn, (selectedId, selectedIcon) => {
                        this.activeSubTool = selectedId;
                        btn.innerHTML = selectedIcon + ' <span style="font-size:8px;">▼</span>';
                    });
                }
                this.handleToolClick(item.id, btn);
            };
            toolbar.appendChild(btn);
        });
    }

    handleToolClick(toolId, btnElement) {
        if (toolId === 'clear') {
            if (confirm('සියලුම Drawings ඉවත් කිරීමට අවශ්‍යද?')) {
                this.drawings = [];
                this.selectedDrawing = null;
                this.settingsModule.removeFloatingToolbar();
                this.redrawCanvas();
            }
            return;
        }

        if (toolId === 'magnet' || toolId === 'lock' || toolId === 'hide') {
            this.handleToggleTools(toolId, btnElement);
            return;
        }

        document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => {
            if (!['tool_magnet', 'tool_lock', 'tool_hide', 'tool_clear'].includes(b.id)) {
                b.style.background = 'transparent';
                b.style.color = '#d1d4dc';
            }
        });

        this.activeTool = toolId;
        if (toolId !== 'cursor') {
            this.selectedDrawing = null;
            this.settingsModule.removeFloatingToolbar();
            this.redrawCanvas();
        }
        btnElement.style.background = '#26a69a';
        btnElement.style.color = '#ffffff';
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

    setupCanvasLayer() {
        if (!this.container) return;

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
        let currentDrawObj = null;
        let dragStartX = 0, dragStartY = 0;

        canvas.ondblclick = (e) => {
            if (!this.isVisible || this.isLocked) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            for (let item of this.drawings) {
                let hit = false;
                if (item.subType === 'parallelchannel') {
                    if (item.yOffset === undefined) item.yOffset = 60;
                    const bX1 = item.x1 + (item.channelShiftX || 0);
                    const bY1 = item.y1 + item.yOffset;
                    const bX2 = item.x2 + (item.channelShiftX || 0);
                    const bY2 = item.y2 + item.yOffset;
                    if (Math.hypot(mouseX - item.x1, mouseY - item.y1) < 15 || 
                        Math.hypot(mouseX - item.x2, mouseY - item.y2) < 15 ||
                        Math.hypot(mouseX - bX1, mouseY - bY1) < 15 ||
                        Math.hypot(mouseX - bX2, mouseY - bY2) < 15 ||
                        this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 12) {
                        hit = true;
                    }
                } else if (this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 12) {
                    hit = true;
                }

                if (hit) {
                    this.selectedDrawing = item;
                    this.settingsModule.showFloatingToolbar(item);
                    this.redrawCanvas();
                    
                    let newText = prompt('Enter text for this drawing:', item.text || '');
                    if (newText !== null) {
                        item.text = newText;
                        this.redrawCanvas();
                    }
                    break;
                }
            }
        };

        canvas.onmousedown = (e) => {
            if (!this.isVisible || this.isLocked) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.button === 2) {
                e.preventDefault();
                for (let item of this.drawings) {
                    if (this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 12) {
                        this.selectedDrawing = item;
                        this.settingsModule.showFloatingToolbar(item);
                        this.redrawCanvas();
                        this.settingsModule.showSettingsModal(item, e.clientX, e.clientY);
                        break;
                    }
                }
                return;
            }

            if (e.button === 0) {
                if (this.activeTool === 'cursor') {
                    if (this.selectedDrawing) {
                        if (this.selectedDrawing.subType === 'parallelchannel') {
                            if (this.selectedDrawing.yOffset === undefined) this.selectedDrawing.yOffset = 60;
                            const bX1 = this.selectedDrawing.x1 + (this.selectedDrawing.channelShiftX || 0);
                            const bY1 = this.selectedDrawing.y1 + this.selectedDrawing.yOffset;
                            const bX2 = this.selectedDrawing.x2 + (this.selectedDrawing.channelShiftX || 0);
                            const bY2 = this.selectedDrawing.y2 + this.selectedDrawing.yOffset;

                            if (Math.hypot(mouseX - this.selectedDrawing.x1, mouseY - this.selectedDrawing.y1) < 12) { 
                                this.draggingHandle = 'pc_p1'; dragStartX = mouseX; dragStartY = mouseY; return; 
                            }
                            if (Math.hypot(mouseX - this.selectedDrawing.x2, mouseY - this.selectedDrawing.y2) < 12) { 
                                this.draggingHandle = 'pc_p2'; dragStartX = mouseX; dragStartY = mouseY; return; 
                            }
                            if (Math.hypot(mouseX - bX1, mouseY - bY1) < 12) { 
                                this.draggingHandle = 'pc_p3'; dragStartX = mouseX; dragStartY = mouseY; return; 
                            }
                            if (Math.hypot(mouseX - bX2, mouseY - bY2) < 12) { 
                                this.draggingHandle = 'pc_p4'; dragStartX = mouseX; dragStartY = mouseY; return; 
                            }
                        } else {
                            const distP1 = Math.hypot(mouseX - this.selectedDrawing.x1, mouseY - this.selectedDrawing.y1);
                            const distP2 = Math.hypot(mouseX - this.selectedDrawing.x2, mouseY - this.selectedDrawing.y2);
                            
                            if (distP1 < 10) {
                                this.draggingHandle = 'p1';
                                dragStartX = mouseX;
                                dragStartY = mouseY;
                                return;
                            } else if (distP2 < 10) {
                                this.draggingHandle = 'p2';
                                dragStartX = mouseX;
                                dragStartY = mouseY;
                                return;
                            }
                        }
                    }

                    let found = null;
                    for (let item of this.drawings) {
                        if (item.subType === 'parallelchannel') {
                            if (item.yOffset === undefined) item.yOffset = 60;
                            const bX1 = item.x1 + (item.channelShiftX || 0);
                            const bY1 = item.y1 + item.yOffset;
                            const bX2 = item.x2 + (item.channelShiftX || 0);
                            const bY2 = item.y2 + item.yOffset;
                            if (Math.hypot(mouseX - item.x1, mouseY - item.y1) < 15 || 
                                Math.hypot(mouseX - item.x2, mouseY - item.y2) < 15 ||
                                Math.hypot(mouseX - bX1, mouseY - bY1) < 15 ||
                                Math.hypot(mouseX - bX2, mouseY - bY2) < 15 ||
                                this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 12) {
                                found = item;
                                break;
                            }
                        } else if (this.pDistance(mouseX, mouseY, item.x1, item.y1, item.x2, item.y2) < 10) {
                            found = item;
                            break;
                        }
                    }

                    this.selectedDrawing = found;
                    if (this.selectedDrawing) {
                        this.settingsModule.showFloatingToolbar(this.selectedDrawing);
                        dragStartX = mouseX;
                        dragStartY = mouseY;
                        this.draggingHandle = 'move';
                    } else {
                        this.settingsModule.removeFloatingToolbar();
                    }
                    this.redrawCanvas();
                    return;
                }

                isDrawing = true;
                startX = mouseX;
                startY = mouseY;
                currentDrawObj = {
                    id: Date.now(),
                    type: this.activeTool,
                    subType: this.activeTool === 'trendline' ? this.activeSubTool : this.activeTool,
                    x1: startX, y1: startY,
                    x2: startX, y2: startY,
                    yOffset: this.activeSubTool === 'parallelchannel' ? 60 : undefined,
                    channelShiftX: 0,
                    color: '#26a69a',
                    width: 2,
                    text: ''
                };
            }
        };

        canvas.onmousemove = (e) => {
            if (!this.isVisible) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.draggingHandle && this.selectedDrawing) {
                const dx = mouseX - dragStartX;
                const dy = mouseY - dragStartY;

                if (this.draggingHandle === 'p1') {
                    this.selectedDrawing.x1 = mouseX;
                    this.selectedDrawing.y1 = mouseY;
                } else if (this.draggingHandle === 'p2') {
                    this.selectedDrawing.x2 = mouseX;
                    this.selectedDrawing.y2 = mouseY;
                } else if (this.draggingHandle === 'pc_p1') {
                    this.selectedDrawing.x1 = mouseX;
                    this.selectedDrawing.y1 = mouseY;
                } else if (this.draggingHandle === 'pc_p2') {
                    this.selectedDrawing.x2 = mouseX;
                    this.selectedDrawing.y2 = mouseY;
                } else if (this.draggingHandle === 'pc_p3' || this.draggingHandle === 'pc_p4') {
                    this.selectedDrawing.yOffset = mouseY - this.selectedDrawing.y1;
                    this.selectedDrawing.channelShiftX = mouseX - this.selectedDrawing.x1;
                } else if (this.draggingHandle === 'move') {
                    this.selectedDrawing.x1 += dx;
                    this.selectedDrawing.y1 += dy;
                    this.selectedDrawing.x2 += dx;
                    this.selectedDrawing.y2 += dy;
                }
                dragStartX = mouseX;
                dragStartY = mouseY;
                this.redrawCanvas();
                return;
            }

            if (isDrawing && currentDrawObj) {
                currentDrawObj.x2 = mouseX;
                currentDrawObj.y2 = mouseY;
                this.redrawCanvas();
                const ctx = canvas.getContext('2d');
                this.trendModule.draw(ctx, currentDrawObj, false);
            }
        };

        canvas.onmouseup = (e) => {
            this.draggingHandle = null;
            if (!isDrawing) return;
            isDrawing = false;

            if (currentDrawObj) {
                const rect = canvas.getBoundingClientRect();
                currentDrawObj.x2 = e.clientX - rect.left;
                currentDrawObj.y2 = e.clientY - rect.top;

                if (Math.hypot(currentDrawObj.x2 - currentDrawObj.x1, currentDrawObj.y2 - currentDrawObj.y1) > 5) {
                    this.drawings.push(currentDrawObj);
                    this.selectedDrawing = currentDrawObj;
                    this.settingsModule.showFloatingToolbar(currentDrawObj);
                }

                currentDrawObj = null;
                this.activeTool = 'cursor';
                
                document.querySelectorAll('#nexusDrawingToolbar button').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#d1d4dc';
                });
                const cursorBtn = document.getElementById('tool_cursor');
                if (cursorBtn) {
                    cursorBtn.style.background = '#26a69a';
                    cursorBtn.style.color = '#ffffff';
                }

                this.redrawCanvas();
            }
        };

        canvas.oncontextmenu = (e) => e.preventDefault();

        window.addEventListener('resize', () => {
            if (this.container) {
                canvas.width = this.container.clientWidth;
                canvas.height = this.container.clientHeight;
                this.redrawCanvas();
            }
        });
    }

    pDistance(x, y, x1, y1, x2, y2) {
        let A = x - x1;
        let B = y - y1;
        let C = x2 - x1;
        let D = y2 - y1;
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }
        let dx = x - xx;
        let dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    redrawCanvas() {
        const canvas = document.getElementById('nexusDrawingCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.drawings.forEach(item => {
            const isSelected = (item === this.selectedDrawing);
            this.trendModule.draw(ctx, item, isSelected);
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.nexusDrawingManager = new NexusDrawingManager();
});