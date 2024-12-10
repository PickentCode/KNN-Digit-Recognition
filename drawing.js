let drawingCanvas, drawingCtx, isDrawing = false;
let drawingHistory = [];
const LINE_WIDTH = 10;

const setupDrawingCanvas = () => {
    drawingCanvas = document.getElementById('drawingCanvas');
    drawingCtx = drawingCanvas.getContext('2d');

    const getMousePos = (e) => {
        const rect = drawingCanvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (drawingCanvas.width / rect.width),
            y: (e.clientY - rect.top) * (drawingCanvas.height / rect.height)
        };
    };

    drawingCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDrawing = true;
            const pos = getMousePos(e);
            drawingCtx.beginPath();
            drawingCtx.moveTo(pos.x, pos.y);
            drawingHistory.push({ x: -1, y: -1 });
        } else {
            clearCanvas();
        }
    });

    drawingCanvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const pos = getMousePos(e);
            drawingCtx.lineTo(pos.x, pos.y);
            drawingCtx.strokeStyle = '#D3D3D3';
            drawingCtx.lineWidth = LINE_WIDTH;
            drawingCtx.lineCap = 'round';
            drawingCtx.stroke();

            drawingHistory.push(pos);
            if (pos.x > scalingX.biggest) {
                scalingX.biggest = pos.x;
            } else if (pos.x < scalingX.smallest) {
                scalingX.smallest = pos.x;
            }
            if (pos.y > scalingY.biggest) {
                scalingY.biggest = pos.y;
            } else if (pos.y < scalingY.smallest) {
                scalingY.smallest = pos.y;
            }
        }
    });

    drawingCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    drawingCanvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
};

const clearCanvas = () => {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawingHistory = [];
    scalingX = { smallest: drawingCanvas.width, biggest: 0 };
    scalingY = { smallest: drawingCanvas.height, biggest: 0 };
};

// This creates a matrix similar to MNIST dataset images based on the drawingHistory points
function createCenteredMatrix() {
    const matrix = Array.from({ length: 28 }, () => Array(28).fill(0));

    const cropWidth = scalingX.biggest - scalingX.smallest + 1;
    const cropHeight = scalingY.biggest - scalingY.smallest + 1;
    const maxDimension = Math.max(cropWidth, cropHeight);

    const scaleFactor = 18 / maxDimension;

    const centerX = (scalingX.biggest + scalingX.smallest) / 2;
    const centerY = (scalingY.biggest + scalingY.smallest) / 2;

    function drawLine(x0, y0, x1, y1, thickness) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            for (let tx = -thickness; tx <= thickness; tx++) {
                for (let ty = -thickness; ty <= thickness; ty++) {
                    const px = Math.round(x0 + tx);
                    const py = Math.round(y0 + ty);
                    if (px >= 4 && px < 24 && py >= 4 && py < 24) {
                        matrix[py][px] = 1;
                    }
                }
            }

            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    for (let i = 1; i < drawingHistory.length; i++) {
        const prevPoint = drawingHistory[i - 1];
        const currPoint = drawingHistory[i];

        if (prevPoint.x < 0 || prevPoint.y < 0 || 
            currPoint.x < 0 || currPoint.y < 0) {
            continue;
        }

        const x0 = Math.round(
            ((prevPoint.x - centerX) * scaleFactor) + 14
        );
        const y0 = Math.round(
            ((prevPoint.y - centerY) * scaleFactor) + 14
        );
        const x1 = Math.round(
            ((currPoint.x - centerX) * scaleFactor) + 14
        );
        const y1 = Math.round(
            ((currPoint.y - centerY) * scaleFactor) + 14
        );

        drawLine(x0, y0, x1, y1, 1.3);
    }

    return matrix;
}