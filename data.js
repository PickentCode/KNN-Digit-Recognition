const SAMPLES_PER_NUMBER = 1000;
const BASE_URL = `${window.location.pathname}digits`;
let dataLoaded = false;

// Loads MNIST images and creates feature vectors
async function loadData() {
    const mainContainer = document.getElementsByClassName('main-container')[0];
    const overlay = document.getElementById('overlay');
    overlay.innerText = "Loading data...";
    mainContainer.classList.add('blurred');

    const canvas = document.createElement('canvas'); // Canvas for loading img data
    canvas.width = 28;
    canvas.height = 28;
    const ctx = canvas.getContext('2d');
    let imagesLoaded = 0;
    let imagesFailed = 0;

    const imagePromises = [];

    for (let folder = 0; folder <= 9; folder++) {
        for (let i = 0; i < SAMPLES_PER_NUMBER; i++) {
            const imgUrl = `${BASE_URL}/${folder}/image_${i}.png`;

            imagePromises.push(
                loadImage(imgUrl, folder, ctx)
                    .then((vector) => {
                        points.push(vector);
                        imagesLoaded++;
                        overlay.innerText = `Data Loaded: ${imagesLoaded}/${SAMPLES_PER_NUMBER * 10}`;
                    })
                    .catch(() => {
                        imagesFailed++;
                        console.error(`Failed to load image: ${imgUrl}`);
                    })
            );
        }
    }

    await Promise.allSettled(imagePromises);

    if (imagesLoaded > 0) {
        dataLoaded = true;
        shuffleArray(points);
        overlay.classList.add('hidden');
        mainContainer.classList.remove('blurred');
        drawPointCloud(xAxisSelect.value, yAxisSelect.value);
        console.log("Data loaded successfully!");
    } else {
        overlay.innerText = "Failed to load any data.";
        console.error("No data could be loaded.");
    }
}

function loadImage(url, label, ctx) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;

        img.onload = () => {
            
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const pixels = imageData.data;
            resolve(createDataVector(imageToMatrix(pixels), label));
        };

        img.onerror = reject;
    });
}

function imageToMatrix(pixels) {
    let result = [];
    for (let y = 0; y < 28; y++) {
        result[y] = [];
        for (let x = 0; x < 28; x++) {
            result[y][x] = pixels[(y * 28 + x) * 4] / 255;
        }
    }
    return result;
}

function createDataVector(matrix, number) {
    const features = [
        BFS(matrix, 0), // TopPourLeftSide
        BFS(matrix, 0), // TopPourRightSide
        BFS(matrix, 1), // BottomPourLeftSide
        BFS(matrix, 1), // BottomPourRightSide
        BFS(matrix, 2), // LeftPourTopSide
        BFS(matrix, 2), // LeftPourBottomSide
        BFS(matrix, 3), // RightPourTopSide
        BFS(matrix, 3), // RightPourBottomSide
        BFS(matrix, 4)  // FullPour
    ];

    const dataVector = features.map((map, i) => {
        let waterAccumulation = 0;
        if (i < 8) {
            const even = i % 2 === 0;
            const vertical = i < 4;
    
            const startX = !even && vertical ? 14 : 0;
            const endX = even && vertical ? 14 : 28;
            const startY = !even && !vertical ? 14 : 0;
            const endY = even && !vertical ? 14 : 28;
    
    
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (map[y][x] != features[8][y][x]) waterAccumulation++;
                }
            }
    
        } else {
            for (let y = 0; y < 28; y++) {
                for (let x = 0; x < 28; x++) {
                    if (!map[y][x] && matrix[y][x] == 0) waterAccumulation++;
                }
            }
        }

        return waterAccumulation;
    });

    //console.log(dataVector);

    return {
        TopPourLeftSide: dataVector[0] / (784 / 4),
        TopPourRightSide: dataVector[1] / (784 / 4),
        BottomPourLeftSide: dataVector[2] / (784 / 4),
        BottomPourRightSide: dataVector[3] / (784 / 4),
        LeftPourTopSide: dataVector[4] / (784 / 3),
        LeftPourBottomSide: dataVector[5] / (784 / 3),
        RightPourTopSide: dataVector[6] / (784 / 4),
        RightPourBottomSide: dataVector[7] / (784 / 4),
        FullPour: dataVector[8] / (784 / 8),
        Number: number
    };
}

function BFS(matrix, directionFuncIndex) {
    const visited = Array.from({ length: 28 }, () => Array(28).fill(false));
    const queue = [];

    const enqueueIfValid = (x, y) => {
        if (
            x >= 0 && x < 28 &&
            y >= 0 && y < 28 &&
            !visited[y][x] &&
            matrix[y][x] === 0
        ) {
            queue.push([x, y]);
            visited[y][x] = true;
        }
    };

    const directionFunctions = [
        (pos) => { // Top pour
            enqueueIfValid(pos[0] - 1, pos[1]);
            enqueueIfValid(pos[0] + 1, pos[1]);
            enqueueIfValid(pos[0], pos[1] - 1);
        },
        (pos) => { // Bottom pour
            enqueueIfValid(pos[0] - 1, pos[1]);
            enqueueIfValid(pos[0] + 1, pos[1]);
            enqueueIfValid(pos[0], pos[1] + 1);
        },
        (pos) => { // Left pour
            enqueueIfValid(pos[0] - 1, pos[1]);
            enqueueIfValid(pos[0], pos[1] - 1);
            enqueueIfValid(pos[0], pos[1] + 1);
        },
        (pos) => { // Right pour
            enqueueIfValid(pos[0] + 1, pos[1]);
            enqueueIfValid(pos[0], pos[1] - 1);
            enqueueIfValid(pos[0], pos[1] + 1);
        },
        (pos) => { // Full pour
            enqueueIfValid(pos[0] - 1, pos[1]);
            enqueueIfValid(pos[0] + 1, pos[1]);
            enqueueIfValid(pos[0], pos[1] - 1);
            enqueueIfValid(pos[0], pos[1] + 1);
        }
    ];

    const startPositions = [
        [14, 27],
        [14, 0],
        [27, 14],
        [0, 14],
        [0, 0]
    ];

    queue.push(startPositions[directionFuncIndex]);
    visited[startPositions[directionFuncIndex][1]][startPositions[directionFuncIndex][0]] = true;

    let iterations = 0;
    while (queue.length > 0) {
        const current = queue.shift();
        directionFunctions[directionFuncIndex](current);

        iterations++;
        if (iterations > 785) break;
    }

    return visited;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
}

// Very simple, but ineffective
function classifyPoint(newPoint, k) {
    k = ~~k;
    // Sort points by distance to the newPoint
    const sortedPoints = points.slice().sort((a, b) => {
        const distanceA = calculateDistance(a, newPoint);
        const distanceB = calculateDistance(b, newPoint);
        return distanceA - distanceB;
    });

    //console.table(sortedPoints);

    const counts = {};
    for (let i = 0; i < sortedPoints.length; i++) {
        const neighbor = sortedPoints[i];
        const number = neighbor.Number;

        counts[number] = (counts[number] || 0) + 1;

        if (counts[number] == k) {
            return number;
        }
    }

    return null;
}

function calculateDistance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1.TopPourLeftSide - point2.TopPourLeftSide, 2) +
        Math.pow(point1.TopPourRightSide - point2.TopPourRightSide, 2) +
        Math.pow(point1.BottomPourLeftSide - point2.BottomPourLeftSide, 2) +
        Math.pow(point1.BottomPourRightSide - point2.BottomPourRightSide, 2) +
        Math.pow(point1.LeftPourTopSide - point2.LeftPourTopSide, 2) +
        Math.pow(point1.LeftPourBottomSide - point2.LeftPourBottomSide, 2) +
        Math.pow(point1.RightPourTopSide - point2.RightPourTopSide, 2) +
        Math.pow(point1.RightPourBottomSide - point2.RightPourBottomSide, 2) +
        Math.pow(point1.FullPour - point2.FullPour, 2)
    );
}