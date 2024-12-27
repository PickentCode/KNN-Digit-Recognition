
let visualizerCanvas, visualizerCtx;
let xAxisSelect, yAxisSelect, rangeSlider, guessBox;
let points = [];

let scalingX, scalingY;
let k = 4;

const colors = [
    "#FFFFFF",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FFA500",
    "#800080",
    "#00FFFF",
    "#FFC0CB",
    "#000000",
    "#008000" 
    //"#FF0000"
];

document.addEventListener('DOMContentLoaded', () => {
    setupDrawingCanvas();
    setupVisualizerCanvas();
    bindFeatureSelectors();
    resizeCanvas();
    clearCanvas();
    usePreviouslyExtractedData(); // For this demo, I'm using my previously extracted data cloud
    //loadData(); // Call when using your own data
});



const guess = () => {
    if (!dataLoaded) return;

    let drawingMatrix = createCenteredMatrix();
    let dataVector = createDataVector(drawingMatrix, 10);

    if (points.length == imagesLoaded + 1) points.pop();
    points.push(dataVector);
    drawPointCloud(xAxisSelect.value, yAxisSelect.value);

    let answer = classifyPoint(dataVector, k);

    guessBox.innerText = `This is ${answer}!`;
    guessBox.classList.add('show');
    setTimeout(() => {
        guessBox.classList.remove('show');
    }, 1500);
    
    console.table(drawingMatrix);
    console.log(dataVector);
    console.log(answer);
}

const setupVisualizerCanvas = () => {
    visualizerCanvas = document.getElementById('visualizerCanvas');
    visualizerCtx = visualizerCanvas.getContext('2d');
};

const drawPointCloud = (xFeature, yFeature) => {
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    let pointSize = 2 * parseInt(rangeSlider.value);

    points.forEach(point => {
        const userPointMult = point.Number == 10 ? 3 : 1;
        const color = point.Number == 10 ? "#FF0000FF" : colors[point.Number] + "FF";
        const x = point[xFeature] * visualizerCanvas.width * parseInt(rangeSlider.value) + pointSize;
        const y = visualizerCanvas.height - point[yFeature] * visualizerCanvas.height * parseInt(rangeSlider.value) - pointSize;
        visualizerCtx.beginPath();
        visualizerCtx.arc(x, y, pointSize * userPointMult, 0, Math.PI * 2);
        visualizerCtx.fillStyle = color;
        visualizerCtx.fill();
        visualizerCtx.closePath();
    });

    const rectWidth = 35;
    const rectHeight = 270;
    const rectX = visualizerCanvas.width - rectWidth - 10;
    const rectY = 10;

    visualizerCtx.fillStyle = "#181B1E";
    visualizerCtx.fillRect(rectX, rectY, rectWidth, rectHeight);

    visualizerCtx.font = "24px Arial";
    visualizerCtx.textAlign = "center";
    visualizerCtx.textBaseline = "middle";

    colors.forEach((color, index) => {
        const textX = rectX + rectWidth / 2;
        const textY = rectY + 20 + index * 26;

        visualizerCtx.fillStyle = color;
        visualizerCtx.fillText(index, textX, textY);
    });
};

const bindFeatureSelectors = () => {
    xAxisSelect = document.getElementById('xAxis');
    yAxisSelect = document.getElementById('yAxis');
    rangeSlider = document.getElementById('visualRange');
    guessBox = document.getElementById('guess');

    xAxisSelect.addEventListener('change', () => {
        drawPointCloud(xAxisSelect.value, yAxisSelect.value);
    });

    yAxisSelect.addEventListener('change', () => {
        drawPointCloud(xAxisSelect.value, yAxisSelect.value);
    });

    rangeSlider.addEventListener('change', () => {
        drawPointCloud(xAxisSelect.value, yAxisSelect.value);
    });
};

const resizeCanvas = () => {
    const drawingRect = drawingCanvas.getBoundingClientRect();
    drawingCanvas.width = drawingRect.width;
    drawingCanvas.height = drawingRect.height;

    const visualizerRect = visualizerCanvas.getBoundingClientRect();
    visualizerCanvas.width = visualizerRect.width;
    visualizerCanvas.height = visualizerRect.height;

    drawPointCloud(xAxisSelect.value, yAxisSelect.value);
};

window.addEventListener('resize', resizeCanvas);