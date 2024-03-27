const CANVAS_SIZE = 300;   //WE ARE COUNTING ALL THE LENGTHS IN PIXELS (UNIT).
const INTERVAL = 42;   //milliseconds. WE CALCULATED THIS EXACT VALUE BY KEEPING IN MIND THE CAMERA'S SHUTTER SPEED - 24 fps. HENCE, TO CAPTURE ONE FRAME THE TIME REQUIRED WOULD BE 1/24 SECONDS.
const THRESHOLD = 50;
let CURRENT_PROPERTIES;
let MEMORY = [];
let canvasA = document.getElementById("canvas-A");
let canvasB = document.getElementById("canvas-B");
let inputField = document.getElementById("input");
let learnButton = document.getElementById("learn-button");
let output = document.getElementById("output");

function main()
{
    // let canvas = initializeCanvas(CANVAS_SIZE, CANVAS_SIZE);
    let ctxA = canvasA.getContext("2d", { willReadFrequently: true });
    ctxA.canvas.width = CANVAS_SIZE;
    ctxA.canvas.height = CANVAS_SIZE;
    console.log(ctxA);

    let ctxB = canvasB.getContext("2d", { willReadFrequently: true });
    ctxB.canvas.width = CANVAS_SIZE;
    ctxB.canvas.height = CANVAS_SIZE;
    
    initializeCamera();
}

function initializeCamera()
{
    let promise = navigator.mediaDevices.getUserMedia({video:true});
    promise.then((signal) => {
        let video = document.createElement("video");
        video.srcObject = signal;
        video.play();
        setInterval(processVideoFrame, INTERVAL, video);
    }).catch((err) => {
        alert("Camera Error!");
    });
}

function processVideoFrame(video)
{
    let vw = video.videoWidth;
    let vh = video.videoHeight;
    let min = Math.min(vw, vh);

    let sx = (vw - min) / 2;
    let sy = (vh - min) / 2;

    let ctxA = canvasA.getContext("2d", { willReadFrequently: true });
    ctxA.drawImage(video, sx, sy, min, min, 
        0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let ctxB = canvasB.getContext("2d", { willReadFrequently: true });
    ctxB.drawImage(video, sx, sy, min, min, 
        0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let Gray2dMatrix = getGrayMatrix();
    Gray2dMatrix = thresholdMatrix(Gray2dMatrix);   //or processMatrix(Gray2dMtrix);
    CURRENT_PROPERTIES = getObjectProperties(Gray2dMatrix);
    drawPixelMatrix(Gray2dMatrix);
    classify();
}

function getBlackPixels(Gray2dMatrix)
{
    let blackPixels = 0;

    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            if(Gray2dMatrix[i][j] == 0)
            {
                blackPixels++;
            }
        }
    }

    return blackPixels;
}

function getBoundingBox(Gray2dMatrix)
{
    let bbox = {
        xMin: CANVAS_SIZE,
        xMax: 0,
        yMin: CANVAS_SIZE,
        yMax: 0
    };

    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            if(Gray2dMatrix[i][j] == 0)
            {
                bbox.xMin = Math.min(j, bbox.xMin);
                bbox.xMax = Math.max(j, bbox.xMax);
                bbox.yMin = Math.min(i, bbox.yMin);
                bbox.yMax = Math.max(i, bbox.yMax);
            }
        }
    }

    return bbox;
}

function getObjectProperties(Gray2dMatrix)
{
    let bbox = getBoundingBox(Gray2dMatrix);

    let width = bbox.xMax - bbox.xMin;
    let height = bbox.yMax - bbox.yMin;
    let aspectRatio = (Math.min(width, height)) / (Math.max(width, height));

    let blackPixels = getBlackPixels(Gray2dMatrix);
    let fullness = blackPixels / (width * height);   //the black pixels are always going to be within the bounding box itlsef.

    return {aspectRatio: aspectRatio, fullness: fullness};
}

function thresholdMatrix(Gray2dMatrix)
{
    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            if(Gray2dMatrix[i][j] < THRESHOLD)
            {
                Gray2dMatrix[i][j] = 0;
            }
            else if(Gray2dMatrix[i][j] > THRESHOLD)
            {
                Gray2dMatrix[i][j] = 255;
            }
        }
    }
    return Gray2dMatrix;
}

function processMatrix(Gray2dMatrix)
{
    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            Gray2dMatrix[i][j] = 255 - Gray2dMatrix[i][j];
        }
    }
    return Gray2dMatrix;
}

// function initializeCanvas(width, height)
// {
//     let c = document.getElementById("canvas");
//     let ctx = c.getContext("2d");
//     ctx.canvas.width = width;
//     ctx.canvas.height = height;
//     return c;
// }

function getGrayMatrix()
{
    let ctx = canvasA.getContext("2d", { willReadFrequently: true });
    let Gray2dMatrix = [];

    let imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    let rgba1dArray = imageData.data;
    // console.log(rgba1dArray);

    // let rgb1dArray = [];
    // let i = 0;
    // let n = 1;
    // for(let i = 0; i < rgba1dArray.length; i + 4)
    // {
    //      rgb1dArray.push(rgba1dArray[i]);
    //      rgb1dArray.push(rgba1dArray[i + 1]);
    //      rgb1dArray.push(rgba1dArray[i + 2]);
    // }
    // // console.log(rgb1dArray);

    // for(let i = 0; i < CANVAS_SIZE; i++)
    // {
    //     Gray2dMatrix[i] = [];
    //     for(let j = 0; j < CANVAS_SIZE; j = j++)
    //     {
    //         let weightedMean = (rgb1dArray[3 * CANVAS_SIZE * i + 3 * j] + rgb1dArray[3 * CANVAS_SIZE * i + 3 * j + 1] + rgb1dArray[3 * CANVAS_SIZE * i + 3 * j + 2]) / 3;
    //         Gray2dMatrix[i][j] = weightedMean;
    //     }
    // }

    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        Gray2dMatrix[i] = [];
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            let r = rgba1dArray[(4 * i * CANVAS_SIZE) + (4 * j)];
            let g = rgba1dArray[(4 * i * CANVAS_SIZE) + (4 * j) + 1];
            let b = rgba1dArray[(4 * i * CANVAS_SIZE) + (4 * j) + 2];
            let a = rgba1dArray[(4 * i * CANVAS_SIZE) + (4 * j) + 3];
            // let weightedMean = (r + g + b) / 3;
            let weightedMean = (0.3 * r + 0.6 * g + 0.1 * b);
            Gray2dMatrix[i][j] = weightedMean;
        }
    }

    return Gray2dMatrix;
}

function drawPixelMatrix(Gray2dMatrix)
{
    let ctx = canvasB.getContext("2d", { willReadFrequently: true });
    let imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for(let i = 0; i < CANVAS_SIZE; i++)
    {
        for(let j = 0; j < CANVAS_SIZE; j++)
        {
            imageData.data[4 * i * CANVAS_SIZE + 4 * j] = Gray2dMatrix[i][j];   //red to gray
            imageData.data[4 * i * CANVAS_SIZE + 4 * j + 1] = Gray2dMatrix[i][j];   //green to gray
            imageData.data[4 * i * CANVAS_SIZE + 4 * j + 2] = Gray2dMatrix[i][j];   //blue to gray
            imageData.data[4 * i * CANVAS_SIZE + 4 * j + 3] = 255;
        }
    }
    // imageData.data.map(element => {
    //     if(indexOf(element) % 4 == 0)
    //     {
    //         element = 255 - element;
    //         imageData.data[indexOf(element) + 1] = 255 - imageData.data[indexOf(element) + 1];
    //         imageData.data[indexOf(element) + 2] = 255 - imageData.data[indexOf(element) + 2];
    //     }
    // });

    ctx.putImageData(imageData, 0, 0);
}

learnButton.addEventListener("click", learn);

function learn()
{
    let inputFieldValue = inputField.value;
    if(inputFieldValue == "")
    {
        alert("Hey! Put a name there!");
    }
    else
    {
        let observation = {
            name: inputFieldValue,
            CURRENT_PROPERTIES: CURRENT_PROPERTIES
        }
        MEMORY.push(observation);
        console.log(MEMORY);
    }
    inputField.value = "";
}

function distance(CURRENT_PROPERTIES, currentPropertiesOfMemoryElement)
{
    let dist = Math.sqrt(((currentPropertiesOfMemoryElement.aspectRatio - CURRENT_PROPERTIES.aspectRatio) * (currentPropertiesOfMemoryElement.aspectRatio - CURRENT_PROPERTIES.aspectRatio)) + ((currentPropertiesOfMemoryElement.fullness - CURRENT_PROPERTIES.fullness) * (currentPropertiesOfMemoryElement.fullness - CURRENT_PROPERTIES.fullness)));
    return dist;
}

function getNearestNeighbour()
{
    let minDist = Infinity;
    let neighbour = null;
    for(let i = 0; i < MEMORY.length; i++)
    {
        let dist = distance(CURRENT_PROPERTIES, MEMORY[i].CURRENT_PROPERTIES);
        if(dist < minDist)
        {
            minDist = dist;
            neighbour = MEMORY[i];
        }
    }

    return neighbour;
}

function classify()
{
    let neighbour = getNearestNeighbour();
    if(neighbour == null)
    {
        output.innerHTML = "???";
    }
    else
    {
        output.innerHTML = neighbour.name;
    }
}