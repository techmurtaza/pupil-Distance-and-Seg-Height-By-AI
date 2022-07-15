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
let pupil_distance_text = document.querySelector(".pupil-distance-text");
let ctxImage = document.getElementById('canvasForImage').getContext('2d');
let mainDivForVideo = document.querySelector("#main-div-for-video");
let mainDivForImage = document.querySelector("#main-div-for-Image");
let cameraOnButton = document.querySelector("#camera-on-button");
let chooseImageButton = document.querySelector("#choose-image-button");
let imageForEyePupils = document.querySelector("#image-for-eye-pupils");
let loaderImage = document.querySelector(".loader-image");

let cropCanvas = document.getElementById("cropCanvas");
let cropCanvasCtx = cropCanvas.getContext("2d");
let thrCanvas = document.getElementById("threshold-canvas");
let thrCanvasCtx = thrCanvas.getContext("2d");

let pupilOffsetWidth=0;
let pupilOffsetHeight=0;
let irisWidth=0;
let leftEyeCenterX = 0;
let leftEyeCenterY = 0;


let canvasForImage = document.querySelector("#canvasForImage");
let calculateImagePd = document.querySelector("#calculate-image-pd");

cameraOnButton.addEventListener("click", () => {
    resetPhotoFunction();
    mainDivForImage.style.display = "none";
    mainDivForVideo.style.display = "";
    startCamera();
});

chooseImageButton.addEventListener("click", () => {
    ctxImage.clearRect(0, 0, canvasForImage.width, canvasForImage.height);
    imageForEyePupils.value = '';
    mainDivForVideo.style.display = "none";
    mainDivForImage.style.display = "";
    calculateImagePd.style.display = "none";
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
})

video.addEventListener("playing", function () {
    setTimeout(function () {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
    }, 500);
 
    
});

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
    autoDraw(ctxImage, canvasForImage);
})

click_button.addEventListener('click', function () {
    video_image_div.style.display = "none";
    canvas.style.display = "block";
    reset_and_calculate_buttons_div.style.display = "flex";
    click_button.style.display = "none";
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, canvas.width * -1, 0, canvas.width, canvas.height);
    ctx.restore();
});

reset_photo.addEventListener('click', function () {
    resetPhotoFunction();
})

let resetPhotoFunction = () => {
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
    autoDraw(ctx, canvas);
});

// AUTO CALC PD METHODS START-----------------------------------------------

async function autoDraw(canvas, workingCanvas) {

    model = await loadFaceLandmarkDetectionModel();
    //Render Face Mesh Prediction
    renderPrediction(canvas, workingCanvas);

}

async function loadFaceLandmarkDetectionModel() {
    return faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
            maxFaces: 1
        }
    );
}

async function renderPrediction(ctx, workingCanvas) {
    const predictions = await model.estimateFaces({
        input: ctx.getImageData(0, 0, workingCanvas.width, workingCanvas.height),
    });
    if(predictions.length){
        displayIrisPosition(predictions, ctx);
        drawSH(ctx);
    }else{
        pupil_distance_text.innerHTML = "<h2>No Face Detected</h2>";
        loader.style.display = "none";
        loaderImage.style.display = "none";

    }
}


function displayIrisPosition(predictions, ctx) {
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


              pupilOffsetWidth = cropLeftX - keyPoints[473][0];
              pupilOffsetHeight = keyPoints[473][1] - cropTopY;

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

              leftEyeCenterX = keyPoints[468][0];
              leftEyeCenterY = keyPoints[468][1];

              let rightEyeCenterX = keyPoints[473][0];
              let rightEyeCenterY = keyPoints[473][1];

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

              ctx.lineWidth = 3;
              ctx.strokeStyle = "green";
              ctx.beginPath();
              ctx.moveTo(leftEyeCenterX, leftEyeCenterY);
              ctx.lineTo(midX, midY);
              ctx.stroke();

              ctx.strokeStyle = "blue";
              ctx.beginPath();
              ctx.moveTo(rightEyeCenterX, rightEyeCenterY);
              ctx.lineTo(midX, midY);
              ctx.stroke();

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
              pupil_distance_text.innerHTML =
                "<h2>Your Pupil Distance is approximately " +
                roundToNearest5(pd * 100) / 100 +
                "mm</h2>" +
                "<h3>Your Left Eye Monocular PD is approximately " +
                roundToNearest5(LeftEyePD * 100) / 100 +
                "mm</h3>" +
                "<h3>Your Right Eye Monocular PD is approximately " +
                roundToNearest5(RightEyePD * 100) / 100 +
                "mm</h3>"+
                "<h3>Your Right Eye Monocular PD is approximately " +
                roundToNearest5(RightEyePD * 100) / 100 +
                "mm</h3>";
            }
        });
    }
}

roundToNearest5 = (num) => Math.round(num / 50) * 50;

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
 
 function drawSH(ctx) {
    let threshold = (+85) / 100;
    thrCanvas.width = pupilOffsetWidth;

    let thresholded = computeAdaptiveThreshold(cropCanvasCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height), threshold);
    //full thresholded on main canvas corner
     ctx.putImageData(thresholded, 0, 0);

     //crop thresholded on separate canvas
    thrCanvasCtx.putImageData(thresholded, 0, 0);

    let imageData = thrCanvasCtx.getImageData(0, 0, thrCanvas.width, thrCanvas.height);
    
    console.log(imageData);
    console.log(imageData.width, imageData.height);
   let blackpixel = 0; let shp = 0; 
    for (var row = imageData.height; row > 0; row--) {
        col = imageData.width - 1;
        var pixel = imageData.data.subarray(
            (row * imageData.width + col) * 4,
            (row * imageData.width + col) * 4 + 4
        );
        console.log(pixel);
        // to get valid black pixel(0,0,0,255)
        if (pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 && pixel[3] == 255) {
            blackpixel++;
        }
        //first valid white(255,255,255,255) after black pixel frame
        if (blackpixel > 0 && pixel.every(p => p === 255)) {
            // console.log('row', row)
            // console.log('r h', row, pupilOffsetHeight)
            // thrCanvasCtx.beginPath();
            // thrCanvasCtx.strokeStyle = "green";
            // thrCanvasCtx.rect(col, row, 3, 3);
            // thrCanvasCtx.stroke();
            shp = row - pupilOffsetHeight;// SH in pixel(frameoffsetheight - pupiloffet)
            break;
        }

    }
    console.log(shp, 'px', pupilOffsetHeight, irisWidth)
    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.moveTo(leftEyeCenterX, leftEyeCenterY);
    ctx.lineTo(leftEyeCenterX, leftEyeCenterY + shp);
    ctx.stroke();

    let shmm = (11.7 / irisWidth) * shp;

    console.log(shmm)
    pupil_distance_text.insertAdjacentHTML('beforeend', "<h3>Your SH is approximately " +
    roundToNearest5(shmm * 100) / 100 +
    "mm</h3>");
    
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



