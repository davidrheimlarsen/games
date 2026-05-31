class PaintApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.brushOpacity = 1;
        this.startX = 0;
        this.startY = 0;
        this.history = [];
        this.historyStep = -1;
        this.maxHistorySteps = 50;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.saveState();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 80;
        
        this.canvas.width = Math.min(800, maxWidth);
        this.canvas.height = Math.min(600, maxHeight);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        document.getElementById('canvasSize').textContent = `${this.canvas.width}x${this.canvas.height}`;
    }
    
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.updateCursor();
            });
        });
        
        // Color selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = swatch.dataset.color;
                document.getElementById('colorPicker').value = this.currentColor;
            });
        });
        
        // Custom color picker
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        });
        
        // Brush controls
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.brushSize;
        });
        
        document.getElementById('brushOpacity').addEventListener('input', (e) => {
            this.brushOpacity = parseInt(e.target.value) / 100;
            document.getElementById('brushOpacityValue').textContent = e.target.value + '%';
        });
        
        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveImage());
        
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Mouse position tracking
        this.canvas.addEventListener('mousemove', (e) => this.updateMousePosition(e));
    }
    
    updateCursor() {
        this.canvas.classList.remove('eraser-cursor');
        if (this.currentTool === 'eraser') {
            this.canvas.classList.add('eraser-cursor');
        }
    }
    
    updateMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        document.getElementById('mousePos').textContent = `x: ${x}, y: ${y}`;
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleTouch(e, type) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(type === 'start' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        
        if (this.currentTool === 'fill') {
            this.fillArea(pos.x, pos.y);
            this.saveState();
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        this.ctx.globalAlpha = this.brushOpacity;
        
        switch (this.currentTool) {
            case 'brush':
                this.drawBrush(pos.x, pos.y);
                break;
            case 'eraser':
                this.drawEraser(pos.x, pos.y);
                break;
            case 'line':
                this.drawLine(pos.x, pos.y);
                break;
            case 'rectangle':
                this.drawRectangle(pos.x, pos.y);
                break;
            case 'circle':
                this.drawCircle(pos.x, pos.y);
                break;
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    drawBrush(x, y) {
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.startX = x;
        this.startY = y;
    }
    
    drawEraser(x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = this.brushSize * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.startX = x;
        this.startY = y;
    }
    
    drawLine(x, y) {
        this.redrawCanvas();
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawRectangle(x, y) {
        this.redrawCanvas();
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        
        this.ctx.beginPath();
        this.ctx.rect(this.startX, this.startY, x - this.startX, y - this.startY);
        this.ctx.stroke();
    }
    
    drawCircle(x, y) {
        this.redrawCanvas();
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        
        const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
        
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    fillArea(x, y) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const targetColor = this.getPixelColor(imageData, x, y);
        const fillColor = this.hexToRgb(this.currentColor);
        
        if (this.colorsMatch(targetColor, fillColor)) return;
        
        const pixels = imageData.data;
        const stack = [[x, y]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            
            if (visited.has(key)) continue;
            if (cx < 0 || cx >= this.canvas.width || cy < 0 || cy >= this.canvas.height) continue;
            
            const currentColor = this.getPixelColor(imageData, cx, cy);
            if (!this.colorsMatch(currentColor, targetColor)) continue;
            
            visited.add(key);
            this.setPixelColor(pixels, cx, cy, this.canvas.width, fillColor, this.brushOpacity);
            
            stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    getPixelColor(imageData, x, y) {
        const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }
    
    setPixelColor(pixels, x, y, width, color, opacity) {
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        pixels[index] = color.r;
        pixels[index + 1] = color.g;
        pixels[index + 2] = color.b;
        pixels[index + 3] = 255 * opacity;
    }
    
    colorsMatch(c1, c2, tolerance = 10) {
        return Math.abs(c1.r - c2.r) < tolerance &&
               Math.abs(c1.g - c2.g) < tolerance &&
               Math.abs(c1.b - c2.b) < tolerance;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    redrawCanvas() {
        if (this.historyStep >= 0) {
            const img = new Image();
            img.src = this.history[this.historyStep];
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
        }
    }
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }
    
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        
        this.history.push(this.canvas.toDataURL());
        
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
            this.historyStep--;
        }
        
        this.updateActionButtons();
    }
    
    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
            this.showToast('Undo successful', 'success');
        }
    }
    
    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
            this.showToast('Redo successful', 'success');
        }
    }
    
    restoreState() {
        const img = new Image();
        img.src = this.history[this.historyStep];
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.updateActionButtons();
        };
    }
    
    updateActionButtons() {
        document.getElementById('undoBtn').disabled = this.historyStep <= 0;
        document.getElementById('redoBtn').disabled = this.historyStep >= this.history.length - 1;
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveState();
            this.showToast('Canvas cleared', 'success');
        }
    }
    
    saveImage() {
        const link = document.createElement('a');
        link.download = `painting_${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        this.showToast('Image saved successfully', 'success');
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

const paintApp = new PaintApp();
