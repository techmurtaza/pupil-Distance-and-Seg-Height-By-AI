let video = document.querySelector("#video");
let click_button = document.querySelector("#click-photo");
let canvas = document.querySelector("#canvas");
let ctx = canvas.getContext('2d')
let reset_photo = document.querySelector("#reset-photo");
let reset_and_calculate_buttons_div = document.querySelector("#reset-and-calculate-buttons");
let calculate_distance = document.querySelector("#calculate");
let video_image_div = document.querySelector("#video-and-image");
let loader = document.querySelector(".loader");
let calculate = document.querySelector("#calculate");
let calculate_manually = document.querySelector("#calculate-manually");
let canvasFabric = new fabric.Canvas('canvasFabric', {selection: false,});
let canvasFabricID = document.querySelector("#main-div-for-video #canvasFabric");

let pupil_distance_text = document.querySelector(".pupil-distance-text");
let ctxImage = document.getElementById('canvasForImage').getContext('2d');
let mainDivForVideo = document.querySelector("#main-div-for-video");
let mainDivForImage = document.querySelector("#main-div-for-Image");
let cameraOnButton = document.querySelector("#camera-on-button");
let chooseImageButton = document.querySelector("#choose-image-button");
let imageForEyePupils = document.querySelector("#image-for-eye-pupils");
let loaderImage = document.querySelector(".loader-image");
let calculateManuallyValue = document.getElementById("calculate-manually-value");

let cropCanvas = document.getElementById("cropCanvas");
let cropCanvasCtx = cropCanvas.getContext("2d");
let thrCanvas = document.getElementById("threshold-canvas");
let thrCanvasCtx = thrCanvas.getContext("2d");

let pupilOffsetWidth=0;
let pupilOffsetHeight=0;
let irisWidth=0;
let leftEyeCenterX = 0;
let leftEyeCenterY = 0;
let leftEyelidBottomX = 0;
let leftEyelidBottomY = 0;


let rightEyeCenterX = 0;
let rightEyeCenterY = 0;

let eyelidOffsetHeight = 0;

let canvasForImage = document.querySelector("#canvasForImage");
let calculateImagePd = document.querySelector("#calculate-image-pd");

let canvasContainer = document.querySelector('#main-div-for-video .canvas-container');
canvasContainer.style.display = 'none';
canvasContainer.style.position = "absolute";
canvasContainer.style.top = "0";

let flagImage = false;

let fabricCanvasForImage =  new fabric.Canvas('fabricCanvasForImage', {selection: false,});
let calculateImagePdManually = document.querySelector("#calculate-image-pd-manually");
let imageCanvasContainer = document.querySelector("#main-div-for-Image .canvas-container");
imageCanvasContainer.style.display = 'none';
imageCanvasContainer.style.position = "absolute";
imageCanvasContainer.style.top = "0";

let getManualPdResult = document.querySelector("#calculate-image-pd-for-manually");
getManualPdResult.style.display = "none";

let lightning_and_face_div = document.querySelector("#main-div-for-video .face-and-lightning");
let lightning = document.querySelector("#main-div-for-video .face-and-lightning .lightning");
let faceDiv = document.querySelector("#main-div-for-video .face-and-lightning .face");

cameraOnButton.addEventListener("click", () => {
    resetPhotoFunction();
    canvasFabric.clear();
    fabricCanvasForImage.clear();
    canvasContainer.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mainDivForImage.style.display = "none";
    mainDivForVideo.style.display = "";
    startCamera();
    flagImage = false;
});

chooseImageButton.addEventListener("click", () => {
    ctxImage.clearRect(0, 0, canvasForImage.width, canvasForImage.height);
    flagImage = true;
    fabricCanvasForImage.clear()
    imageCanvasContainer.style.display = 'none';
    imageForEyePupils.value = '';
    mainDivForVideo.style.display = "none";
    mainDivForImage.style.display = "";
    calculateImagePd.style.display = "none";
    calculateImagePdManually.style.display = "none";
    pupil_distance_text.innerHTML = "";
})

imageForEyePupils.addEventListener('change', (e) => {
    pupil_distance_text.innerHTML = "";
    let image = e.target.files[0];
    ctxImage.clearRect(0, 0, canvasForImage.width, canvasForImage.height);
    var img = new Image;
    img.src = URL.createObjectURL(image);
    img.onload = function() {
        let imgWidth = this.width;
        let imgHeight = this.height;
        while(imgWidth > canvasForImage.width && imgHeight > canvasForImage.height) {
            imgWidth = imgWidth / 2;
            imgHeight = imgHeight / 2;
        }
        ctxImage.drawImage(img, 0, 0, imgWidth, imgHeight);
    }
    calculateImagePd.style.display = "";
    calculateImagePdManually.style.display = "";
    fabricCanvasForImage.clear()
})


let imageData
let loopForVideoFunction = async () => {
    click_button.style.display = "none";
    let model = await loadFaceLandmarkDetectionModel();
    (async function loop() {
        if (video_image_div.style.display != "none") {

            lightning_and_face_div.style.display = "flex";
            
            let result = isItDark()
            const faces = await model.estimateFaces({
                input: imageData,
            });

            if (faces.length) {
                faceDiv.style.color = "green"
                faceDiv.children[1].innerHTML = "✓";
            }else{
                faceDiv.style.color = "red";
                faceDiv.children[1].innerHTML = "✕";
            }

            if (!result) {
                lightning.style.color = "green";
                lightning.children[1].innerHTML = "✓";
            }else{
                lightning.style.color = "red";
                lightning.children[1].innerHTML = "✕";
            }
            if(faces.length && !result) {
                click_button.style.display = "";
            }else{
                click_button.style.display = "none";
            }

            setTimeout(loop, 1000 / 30); // drawing at 30fps
        }else{
            click_button.style.display = "none";
            lightning_and_face_div.style.display = "none";
        }
    })();
}


video.addEventListener("playing", function () {
    setTimeout(function () {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvasFabric.setWidth(video.videoWidth);
        canvasFabric.setHeight(video.videoHeight);
    }, 500);
    loopForVideoFunction();
    
});

function isItDark() {
    let fuzzy = 0.1;
    let canvas = document.createElement("canvas");
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(video,0,0);

    imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    let data = imageData.data;
    let r,g,b, max_rgb;
    let light = 0, dark = 0;

    for(let x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];

        max_rgb = Math.max(Math.max(r, g), b);
        if (max_rgb < 128)
            dark++;
        else
            light++;
    }

    let dl_diff = ((light - dark) / (video.videoWidth*video.videoHeight));

    if (dl_diff + fuzzy < 0)
        return true; /* Dark. */
    else
        return false;  /* Not dark. */
}

async function startCamera() {
    let stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });
    video.srcObject = stream;
}

calculateImagePd.addEventListener("click", () => {
    loaderImage.style.display = "flex";
    calculateImagePd.style.display = "none";
    calculateImagePdManually.style.display = "none";
    autoDraw(ctxImage, canvasForImage);
})

calculateImagePdManually.addEventListener("click", () => {
    loaderImage.style.display = "flex";
    calculateImagePdManually.style.display = "none";
    calculateImagePd.style.display = "none";
    getManualPdResult.style.display = "";
    autoDraw(ctxImage, canvasForImage, true);
})

getManualPdResult.addEventListener("click", () => {
    calculateManuallyValueFunction()
    getManualPdResult.style.display = "none";
})

click_button.addEventListener('click', function () {
    video_image_div.style.display = "none";
    canvas.style.display = "block";
    reset_and_calculate_buttons_div.style.display = "flex";
    click_button.style.display = "none";
    calculate_manually.style.display = "block";
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, canvas.width * -1, 0, canvas.width, canvas.height);
    ctx.restore();
});

reset_photo.addEventListener('click', function () {
    resetPhotoFunction();
    loopForVideoFunction();
})

let resetPhotoFunction = () => {
    canvasFabric.clear();
    canvasContainer.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
    video_image_div.style.display = "";
    calculate.style.display = "";
    reset_and_calculate_buttons_div.style.display = "none";
    click_button.style.display = "block";
    pupil_distance_text.innerHTML = "";
}

calculate_distance.addEventListener('click', function () {
    loader.style.display = "flex";
    calculate.style.display = "none";
    calculate_manually.style.display = "none";
    autoDraw(ctx, canvas);
});

calculate_manually.addEventListener('click', function () {
    loader.style.display = "flex";
    calculate.style.display = "none";
    calculate_manually.style.display = "none";
    calculateManuallyValue.style.display = "block";
    autoDraw(ctx, canvas, true);
});

var calculateManuallyValueFunction = () => {
    let rightEyeMidXY = new Point(fixedEyePositionRight.left + fixedEyePositionRight.radius, 
        fixedEyePositionRight.top + fixedEyePositionRight.radius)
    let rightEyeDistancePP = rightEyeMidXY.distanceTo(new Point(movableEyePositionRight.left, movableEyePositionRight.top));

    let leftEyeMidXY = new Point(fixedEyePositionLeft.left + fixedEyePositionLeft.radius, 
            fixedEyePositionLeft.top + fixedEyePositionLeft.radius)
    let leftEyeDistancePP = leftEyeMidXY.distanceTo(new Point(movableEyePositionLeft.left, movableEyePositionLeft.top));

    let segHeightInProgressiveMM = (11.7 / irisWidth) * rightEyeDistancePP;

    let segHeightInBiFocalMM = (11.7 / irisWidth) * leftEyeDistancePP;//bifocal SH in mm

    pupil_distance_text.innerHTML = "<h3>Your SH(progressive) is approximately " +
            roundToNearest5(segHeightInProgressiveMM * 100) / 100 + "mm</h3>" +
            "<h3>Your SH(bifocal) is approximately " +
            roundToNearest5(segHeightInBiFocalMM * 100) / 100 + "mm</h3>"
}

calculateManuallyValue.addEventListener('click', function () {
    calculateManuallyValueFunction()
    calculateManuallyValue.style.display = "none";
})

// AUTO CALC PD METHODS START-----------------------------------------------

async function autoDraw(canvas, workingCanvas, manual = false) {

    model = await loadFaceLandmarkDetectionModel();
    //Render Face Mesh Prediction
    renderPrediction(canvas, workingCanvas, manual);

}

async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
            maxFaces: 1
        }
    );
}

async function renderPrediction(ctx, workingCanvas, manual = false) {
    const predictions = await model.estimateFaces({
        input: ctx.getImageData(0, 0, workingCanvas.width, workingCanvas.height),
    });

    if(predictions.length){
        displayIrisPosition(predictions, ctx, manual);
        if(!manual) {
            drawSH(ctx);
        }   
    }else{
        pupil_distance_text.innerHTML = "<h2>No Face Detected</h2>";
        loader.style.display = "none";
        loaderImage.style.display = "none";
    }
}

let fixedEyePositionRight = '';
let movableEyePositionRight = '';

let fixedEyePositionLeft = '';
let movableEyePositionLeft = '';

let createElementForFabricCanvas = () => {

    fixedEyePositionLeft = new fabric.Circle({
        top:    leftEyelidBottomY - 5,
        left:   leftEyelidBottomX - 5,
        radius: 5,
        fill:   'blue',
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
    });

    movableEyePositionLeft = new fabric.Path('M 73 56 L -4 4 L 20 94 L 20 38 Z', {
        top:    leftEyelidBottomY,
        left:   leftEyelidBottomX,
        hasControls: false,
        fill: 'red',
        scaleX: .4,
        scaleY: .4,
        lockMovementX: true,
    })

    fixedEyePositionRight = new fabric.Circle({
        top:    rightEyeCenterY - 5,
        left:   rightEyeCenterX - 5,
        radius: 5,
        fill:   'blue',
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
    });
    
    movableEyePositionRight = new fabric.Path('M 73 56 L -4 4 L 20 94 L 20 38 Z', {
        top:    rightEyeCenterY,
        left:   rightEyeCenterX,
        hasControls: false,
        fill: 'red',
        scaleX: .4,
        scaleY: .4,
        lockMovementX: true,
    })

}

function displayIrisPosition(predictions, ctx, manual = false) {

    ctx.strokeStyle = "red";
    if (predictions.length > 0) {
        predictions.forEach((prediction) => {
            const keyPoints = prediction.scaledMesh;
            if (keyPoints.length == 478) {
                let cropLeftX = keyPoints[9][0];
                let cropLeftY = keyPoints[9][1];

                let cropTopX = keyPoints[334][0];
                let cropTopY = keyPoints[334][1];

                let cropRightX = keyPoints[356][0];
                let cropRightY = keyPoints[356][1];

                let cropBottomX = keyPoints[371][0];
                let cropBottomY = keyPoints[371][1];

                leftEyeCenterX = keyPoints[468][0];
                leftEyeCenterY = keyPoints[468][1];
                
                rightEyeCenterX = keyPoints[473][0];
                rightEyeCenterY = keyPoints[473][1];

                leftEyelidBottomX =  keyPoints[374][0];
                leftEyelidBottomY =  keyPoints[374][1];

                pupilOffsetWidth = cropLeftX - rightEyeCenterX;
                pupilOffsetHeight = rightEyeCenterY - cropTopY;

                eyelidOffsetWidth = cropLeftX - leftEyelidBottomX;
                eyelidOffsetHeight = leftEyelidBottomY - cropTopY;

                let cropHeight = cropBottomY - cropTopY;
                let cropWidth = cropRightX - cropLeftX;
            //   console.log(cropWidth, cropHeight);
                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;
                cropCanvasCtx.clearRect(0, 0, cropWidth, cropHeight);
                cropCanvasCtx.fillStyle = "transparent";

                cropCanvasCtx.drawImage(
                ctx.canvas,
                cropLeftX,
                cropTopY,
                cropWidth,
                cropHeight,
                0,
                0,
                cropWidth,
                cropHeight
                );
                
                for (let i = 468; i < 478; i++) {
                    let x = keyPoints[i][0];
                    let y = keyPoints[i][1];
                    ctx.beginPath();
                    ctx.rect(x, y, 2, 2);
                    ctx.stroke();
                }
                let midX = keyPoints[168][0];
                let midY = (keyPoints[473][1] + keyPoints[468][1]) / 2;

                if(manual && !flagImage){
                    
                    let backgroundImageDataURL = canvas.toDataURL();
                    canvasFabric.setBackgroundImage(backgroundImageDataURL, canvasFabric.renderAll.bind(canvasFabric), {
                        backgroundImageStretch: false
                    });

                    canvasContainer.style.display = "block";

                    createElementForFabricCanvas()
                    
                    canvasFabric.add(fixedEyePositionRight);
                    canvasFabric.add(movableEyePositionRight);
                    canvasFabric.add(fixedEyePositionLeft);
                    canvasFabric.add(movableEyePositionLeft);

                }else if(manual && flagImage){

                    let backgroundImageDataURL = canvasForImage.toDataURL();
                    fabricCanvasForImage.setBackgroundImage(backgroundImageDataURL, fabricCanvasForImage.renderAll.bind(fabricCanvasForImage), {
                        backgroundImageStretch: false
                    });

                    imageCanvasContainer.style.display = "block";
                    createElementForFabricCanvas()

                    fabricCanvasForImage.add(fixedEyePositionRight);
                    fabricCanvasForImage.add(movableEyePositionRight);
                    fabricCanvasForImage.add(fixedEyePositionLeft);
                    fabricCanvasForImage.add(movableEyePositionLeft);
                }
                
                //iris left
                let xLeft = keyPoints[474][0];
                let yLeft = keyPoints[474][1];
                let xRight = keyPoints[476][0];
                let yRight = keyPoints[476][1];
                
                //iris right
                let xLeft2 = keyPoints[471][0];
                let yLeft2 = keyPoints[471][1];
                let xRight2 = keyPoints[469][0];
                let yRight2 = keyPoints[469][1];

                let leftEyePoint = new Point(leftEyeCenterX, leftEyeCenterY);
                let rightEyePoint = new Point(rightEyeCenterX, rightEyeCenterY);
                let pupilDistance = leftEyePoint.distanceTo(rightEyePoint);
                
                let midPoint = new Point(midX, midY);
                let leftEyePdInDistance = midPoint.distanceTo(leftEyePoint);
                let rightEyePdInDistance = midPoint.distanceTo(rightEyePoint);
                
                let left = new Point(xLeft, yLeft);
                let right = new Point(xRight, yRight);
                
                let left2 = new Point(xLeft2, yLeft2);
                let right2 = new Point(xRight2, yRight2);
                
                let irisDiameterLeft = left.distanceTo(right);
                let irisDiameterRight = left2.distanceTo(right2);
                
                irisWidth = (irisDiameterLeft + irisDiameterRight) / 2;
                
                let LeftEyePD = (11.7 / irisWidth) * leftEyePdInDistance;
                let RightEyePD = (11.7 / irisWidth) * rightEyePdInDistance;
                let pd = (11.7 / irisWidth) * pupilDistance;
                loader.style.display = "none";
                loaderImage.style.display = "none";
            }
        });
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.distanceTo = function (point) {
            var distance = Math.sqrt(
                Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
            );
            return distance;
        };
    }
}

roundToNearest5 = (num) => Math.round(num / 50) * 50;

function drawSH(ctx) {
    let threshold = (+85) / 100;
    thrCanvas.width = pupilOffsetWidth;

    let thresholded = computeAdaptiveThreshold(cropCanvasCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height), threshold);
    //full thresholded on main canvas corner
    ctx.putImageData(thresholded, 0, 0);

     //crop thresholded on separate canvas
    thrCanvasCtx.putImageData(thresholded, 0, 0);

    let imageData = thrCanvasCtx.getImageData(0, 0, thrCanvas.width, thrCanvas.height);
    
    let blackpixel = 0; 
    let shp = 0; 
    let shbp = 0; 
    for (var row = imageData.height; row > 0; row--) {
        col = imageData.width - 1;
        var pixel = imageData.data.subarray(
            (row * imageData.width + col) * 4,
            (row * imageData.width + col) * 4 + 4
        );

        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 && pixel[3] == 255) {
            blackpixel++;
        }

        if (blackpixel > 0 && pixel.every(p => p === 255)) {
            shp = row - pupilOffsetHeight;// SH in pixel(frameoffsetheight - pupiloffet)
            shbp = row - eyelidOffsetHeight;// SH in pixel(frameoffsetheight - pupiloffet)
            break;
        }

    }

    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.moveTo(leftEyeCenterX, leftEyeCenterY);
    ctx.lineTo(leftEyeCenterX, leftEyeCenterY + shp);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.moveTo(leftEyelidBottomX, leftEyelidBottomY);
    ctx.lineTo(leftEyelidBottomX, leftEyelidBottomY + shbp);
    ctx.stroke();

    let shmm = (11.7 / irisWidth) * shp;
    let shbmm = (11.7 / irisWidth) * shbp;//bifocal SH in mm
    pupil_distance_text.innerHTML = "<h3>Your SH(progressive) is approximately " +
                                    roundToNearest5(shmm * 100) / 100 + "mm</h3>" +
                                    "<h3>Your SH(bifical) is approximately " +
                                    roundToNearest5(shbmm * 100) / 100 + "mm</h3>"
}


function buildIntegral_Gray(sourceImageData) {
    var sourceData = sourceImageData.data;
    var width = sourceImageData.width;
    var height = sourceImageData.height;
    // should it be Int64 Array ??
    // Sure for big images 
    var integral = new Int32Array(width * height)
    // ... for loop
    var x = 0,
        y = 0,
        lineIndex = 0,
        sum = 0;
    for (x = 0; x < width; x++) {
        sum += sourceData[x << 2];
        integral[x] = sum;
    }

    for (y = 1, lineIndex = width; y < height; y++, lineIndex += width) {
        sum = 0;
        for (x = 0; x < width; x++) {
            sum += sourceData[(lineIndex + x) << 2];
            integral[lineIndex + x] = integral[lineIndex - width + x] + sum;
        }
    }
    return integral;
}

function createImageData(width, height) {
    var canvas = document.createElement('canvas');
    
    return canvas.getContext('2d').createImageData(width, height);
}

function getIntegralAt(integral, width, x1, y1, x2, y2) {
    var result = integral[x2 + y2 * width];
    if (y1 > 0) {
        result -= integral[x2 + (y1 - 1) * width];
        if (x1 > 0) {
            result += integral[(x1 - 1) + (y1 - 1) * width];
        }
    }
    if (x1 > 0) {
        result -= integral[(x1 - 1) + (y2) * width];
    }
    return result;
}

function computeAdaptiveThreshold(sourceImageData, ratio, callback) {
    var integral = buildIntegral_Gray(sourceImageData);

    var width = sourceImageData.width;
    var height = sourceImageData.height;
    var s = width >> 4; // in fact it's s/2, but since we never use s...

    var sourceData = sourceImageData.data;
    var result = createImageData(width, height);
    var resultData = result.data;
    var resultData32 = new Uint32Array(resultData.buffer);

    var x = 0,
        y = 0,
        lineIndex = 0;

    for (y = 0; y < height; y++, lineIndex += width) {
        for (x = 0; x < width; x++) {

            var value = sourceData[(lineIndex + x) << 2];
            var x1 = Math.max(x - s, 0);
            var y1 = Math.max(y - s, 0);
            var x2 = Math.min(x + s, width - 1);
            var y2 = Math.min(y + s, height - 1);
            var area = (x2 - x1 + 1) * (y2 - y1 + 1);
            var localIntegral = getIntegralAt(integral, width, x1, y1, x2, y2);
            if (value * area > localIntegral * ratio) {
                resultData32[lineIndex + x] = 0xFFFFFFFF;
            } else {
                resultData32[lineIndex + x] = 0xFF000000;
            }
        }
    }
    return result;
}

var zoom = document.getElementById("zoom");
var zoomCtx = zoom.getContext("2d");

let lineForRight = ""
let lineForLeft = ""

fabricCanvasForImage.on('object:moving', function(e) {
    let object = e.target;
    if(object.top > 67 && object.top < 393 && object.left > 150 && object.left < 489) {
        this.isDragging = true;
    }else{
        this.isDragging = false;
    }

});

fabricCanvasForImage.on('object:modified', function(e) {
    this.isDragging = false;
    zoom.style.display = "none";
    console.log(e.target.left);
    if(e.target.left == movableEyePositionRight.left){
        if(lineForRight){
            fabricCanvasForImage.remove(lineForRight);
        }

        lineForRight = new fabric.Line([fixedEyePositionRight.left + fixedEyePositionRight.radius, 
                                fixedEyePositionRight.top + fixedEyePositionRight.radius, 
                                movableEyePositionRight.left, 
                                movableEyePositionRight.top], {
            stroke: 'blue',
            strokeWidth: 4,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
        });
        fabricCanvasForImage.add(lineForRight);
    }else{

        if(lineForLeft){
            fabricCanvasForImage.remove(lineForLeft);
        }

        lineForLeft = new fabric.Line([fixedEyePositionLeft.left + fixedEyePositionLeft.radius, 
                                fixedEyePositionLeft.top + fixedEyePositionLeft.radius, 
                                movableEyePositionLeft.left, 
                                movableEyePositionLeft.top], {
            stroke: 'blue',
            strokeWidth: 4,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
        });
        fabricCanvasForImage.add(lineForLeft);
    }
})

fabricCanvasForImage.on('mouse:move', function(opt) {
    if (this.isDragging) {
        var e = opt.e;
        zoomCtx.clearRect(0, 0, zoom.width, zoom.height);
        zoomCtx.fillStyle = "transparent";
        zoomCtx.drawImage(
            fabricCanvasForImage.lowerCanvasEl, e.offsetX - 50, e.offsetY - 50, 100, 100, 0, 0, 200, 200
        );
        zoom.style.top = e.pageY + 10 + "px";
        zoom.style.left = e.pageX + 10 + "px";
        zoom.style.display = "block";
    }
});

canvasFabric.on('object:moving', function(e) {
    let object = e.target;
    if(object.top > 67 && object.top < 393 && object.left > 150 && object.left < 489) {
        this.isDragging = true;
    }else{
        this.isDragging = false;
    }

});

canvasFabric.on('object:modified', function(e) {
    this.isDragging = false;
    zoom.style.display = "none";
    console.log(e.target.left);
    if(e.target.left == movableEyePositionRight.left){
        if(lineForRight){
            canvasFabric.remove(lineForRight);
        }

        lineForRight = new fabric.Line([fixedEyePositionRight.left + fixedEyePositionRight.radius, 
                                fixedEyePositionRight.top + fixedEyePositionRight.radius, 
                                movableEyePositionRight.left, 
                                movableEyePositionRight.top], {
            stroke: 'blue',
            strokeWidth: 4,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
        });
        canvasFabric.add(lineForRight);
    }else{

        if(lineForLeft){
            canvasFabric.remove(lineForLeft);
        }

        lineForLeft = new fabric.Line([fixedEyePositionLeft.left + fixedEyePositionLeft.radius, 
                                fixedEyePositionLeft.top + fixedEyePositionLeft.radius, 
                                movableEyePositionLeft.left, 
                                movableEyePositionLeft.top], {
            stroke: 'blue',
            strokeWidth: 4,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
        });
        canvasFabric.add(lineForLeft);
    }
})

canvasFabric.on('mouse:move', function(opt) {
    if (this.isDragging) {
        var e = opt.e;
        zoomCtx.clearRect(0, 0, zoom.width, zoom.height);
        zoomCtx.fillStyle = "transparent";
        zoomCtx.drawImage(
            canvasFabric.lowerCanvasEl, e.offsetX - 50, e.offsetY - 50, 100, 100, 0, 0, 200, 200
        );
        zoom.style.top = e.pageY + 10 + "px";
        zoom.style.left = e.pageX + 10 + "px";
        zoom.style.display = "block";
    }
});

