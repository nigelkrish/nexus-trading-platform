// --- Nexus Trading Platform - Drawing Settings & UI Module (nexus-drawing-settings.js) ---

export class NexusDrawingSettings {
    constructor(manager) {
        this.manager = manager;
    }

    showFloatingToolbar(drawing) {
        this.removeFloatingToolbar();

        const bar = document.createElement('div');
        bar.id = 'nexusFloatingBar';
        bar.style.cssText = `
            position: absolute; left: ${Math.min(drawing.x1, drawing.x2) + 20}px; top: ${Math.min(drawing.y1, drawing.y2) - 50}px; z-index: 99999;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 8px;
            display: flex; align-items: center; gap: 8px; padding: 6px 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5); user-select: none; cursor: grab;
        `;

        bar.innerHTML = `
            <span style="color: #848e9c; cursor: grab; font-size: 14px;" title="Drag Toolbar">⠿</span>
            <input type="color" id="ftColor" value="${drawing.color || '#26a69a'}" style="border:none; width:22px; height:22px; background:none; cursor:pointer;" title="Change Color">
            <select id="ftWidth" style="background:#2a2e39; color:#fff; border:1px solid #363c4e; border-radius:4px; padding:2px 4px; font-size:12px;" title="Thickness">
                <option value="1" ${drawing.width==1?'selected':''}>1px</option>
                <option value="2" ${drawing.width==2?'selected':''}>2px</option>
                <option value="3" ${drawing.width==3?'selected':''}>3px</option>
                <option value="4" ${drawing.width==4?'selected':''}>4px</option>
            </select>
            <button id="ftTextBtn" style="background:#2a2e39; color:#d1d4dc; border:1px solid #363c4e; border-radius:4px; padding:2px 6px; font-size:12px; cursor:pointer;" title="Add/Edit Text">T Text</button>
            <button id="ftSettingsBtn" style="background:#2a2e39; color:#d1d4dc; border:1px solid #363c4e; border-radius:4px; padding:2px 6px; font-size:12px; cursor:pointer;" title="Settings Panel">⚙️</button>
            <div style="width:1px; height:16px; background:#363c4e;"></div>
            <button id="ftDel" style="background:transparent; border:none; color:#ef5350; cursor:pointer; font-size:14px;" title="Delete">🗑️</button>
        `;

        this.manager.container.appendChild(bar);

        let isDraggingBar = false;
        let startX, startY;

        bar.onmousedown = (e) => {
            if (['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
            isDraggingBar = true;
            startX = e.clientX - bar.offsetLeft;
            startY = e.clientY - bar.offsetTop;
            bar.style.cursor = 'grabbing';
        };

        window.onmousemove = (e) => {
            if (!isDraggingBar) return;
            bar.style.left = `${e.clientX - startX}px`;
            bar.style.top = `${e.clientY - startY}px`;
        };

        window.onmouseup = () => {
            isDraggingBar = false;
            bar.style.cursor = 'grab';
        };

        document.getElementById('ftColor').oninput = (e) => {
            drawing.color = e.target.value;
            this.manager.redrawCanvas();
        };

        document.getElementById('ftWidth').onchange = (e) => {
            drawing.width = parseInt(e.target.value);
            this.manager.redrawCanvas();
        };

        document.getElementById('ftTextBtn').onclick = () => {
            let txt = prompt('Enter text for this tool:', drawing.text || '');
            if (txt !== null) {
                drawing.text = txt;
                this.manager.redrawCanvas();
            }
        };

        document.getElementById('ftSettingsBtn').onclick = (e) => {
            const rect = e.target.getBoundingClientRect();
            this.showSettingsModal(drawing, rect.left, rect.bottom + 10);
        };

        document.getElementById('ftDel').onclick = () => {
            this.manager.drawings = this.manager.drawings.filter(d => d !== drawing);
            this.manager.selectedDrawing = null;
            this.removeFloatingToolbar();
            this.manager.redrawCanvas();
        };
    }

    showSettingsModal(drawing, posX, posY) {
        this.removeSettingsModal();

        const modal = document.createElement('div');
        modal.id = 'nexusSettingsModal';
        modal.style.cssText = `
            position: fixed; left: ${Math.min(posX, window.innerWidth - 260)}px; top: ${Math.min(posY, window.innerHeight - 300)}px; z-index: 100000;
            background: #1e222d; border: 1px solid #363c4e; border-radius: 8px; width: 240px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.6); padding: 14px; font-family: Inter, sans-serif; color: #d1d4dc; user-select: none;
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #363c4e; padding-bottom: 8px;">
                <span style="font-weight: 600; font-size: 13px;">Drawing Settings</span>
                <button id="closeModal" style="background:none; border:none; color:#848e9c; cursor:pointer; font-size:14px;">✕</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Line Color:</span>
                    <input type="color" id="modalColor" value="${drawing.color || '#26a69a'}" style="border:none; width:28px; height:22px; background:none; cursor:pointer;">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Line Thickness:</span>
                    <select id="modalWidth" style="background:#2a2e39; color:#fff; border:1px solid #363c4e; border-radius:4px; padding:3px 6px;">
                        <option value="1" ${drawing.width==1?'selected':''}>1px</option>
                        <option value="2" ${drawing.width==2?'selected':''}>2px</option>
                        <option value="3" ${drawing.width==3?'selected':''}>3px</option>
                        <option value="4" ${drawing.width==4?'selected':''}>4px</option>
                    </select>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span>Custom Text:</span>
                    <input type="text" id="modalText" value="${drawing.text || ''}" placeholder="Enter text..." style="background:#2a2e39; color:#fff; border:1px solid #363c4e; border-radius:4px; padding:5px 8px; font-size:12px; outline:none;">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeModal').onclick = () => this.removeSettingsModal();

        document.getElementById('modalColor').oninput = (e) => {
            drawing.color = e.target.value;
            const ftColor = document.getElementById('ftColor');
            if (ftColor) ftColor.value = drawing.color;
            this.manager.redrawCanvas();
        };

        document.getElementById('modalWidth').onchange = (e) => {
            drawing.width = parseInt(e.target.value);
            const ftWidth = document.getElementById('ftWidth');
            if (ftWidth) ftWidth.value = drawing.width;
            this.manager.redrawCanvas();
        };

        document.getElementById('modalText').oninput = (e) => {
            drawing.text = e.target.value;
            this.manager.redrawCanvas();
        };

        setTimeout(() => {
            window.addEventListener('click', function closeMod(evt) {
                if (!modal.contains(evt.target) && !evt.target.closest('#nexusFloatingBar')) {
                    modal.remove();
                    window.removeEventListener('click', closeMod);
                }
            });
        }, 100);
    }

    removeSettingsModal() {
        const modal = document.getElementById('nexusSettingsModal');
        if (modal) modal.remove();
    }

    removeFloatingToolbar() {
        const bar = document.getElementById('nexusFloatingBar');
        if (bar) bar.remove();
        this.removeSettingsModal();
    }
}