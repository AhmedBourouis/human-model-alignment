const fileInput = document.querySelector("#upload");

// enabling drawing on the blank canvas
drawOnImage();
let image = document.querySelector('#sketchCanvas')
var initialImageData;
var userDataDrawingHistory = []
var timeStampNow= Date.now()
drawOnImage(image);

// fileInput.addEventListener("change", async (e) => {
//   const [file] = fileInput.files;
//
//   // displaying the uploaded image
//   const image = document.createElement("img");
//   image.src = await fileToDataUri(file);
//
//   // enbaling the brush after after the image
//   // has been uploaded
//   image.addEventListener("load", () => {
//     drawOnImage(image);
//   });
//
//   return false;
// });

// function fileToDataUri(field) {
//   return new Promise((resolve) => {
//     const reader = new FileReader();
//
//     reader.addEventListener("load", () => {
//       resolve(reader.result);
//     });
//
//     reader.readAsDataURL(field);
//   });
// }

const sizeElement = document.querySelector("#sizeRange");
let size = sizeElement.value;
sizeElement.oninput = (e) => {
  size = e.target.value;
};

// const colorElement = document.getElementsByName("colorRadio");
// let color;
// colorElement.forEach((c) => {
//   if (c.checked) color = c.value;
// });
//
// colorElement.forEach((c) => {
//   c.onclick = () => {
//     color = c.value;
//   };
// });

let color = "red"

function drawOnImage(image = null) {
  // console.log("IMAGE VALUE =", image)
  const canvasElement = document.getElementById("canvas");
  // console.log("CANVAS VALUE =", canvasElement)
  const context = canvasElement.getContext("2d", { willReadFrequently: true });
  // console.log("CANVAS CONTEXT =", context)
  context.clearRect(0,0,512,512);

  // if an image is present,
  // the image passed as a parameter is drawn in the canvas
  if (image) {
    const imageWidth = image.width;
    const imageHeight = image.height;

    // rescaling the canvas element
    canvasElement.width = imageWidth;
    canvasElement.height = imageHeight;

    context.drawImage(image, 0, 0, imageWidth, imageHeight);
    initialImageData= context.getImageData(0, 0, canvasElement.width, canvasElement.height)
  }

  const clearElement = document.getElementById("clear");
  clearElement.onclick = () => {
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  };

  let isDrawing;

  canvasElement.onmousedown = (e) => {
    var rect = canvasElement.getBoundingClientRect();

    // the position related to the viewport
    const x = rect.x;
    const y = rect.y;
    console.log("X, Y ON MOUSE DOWN FOR THE MOUSE= ",e.offsetX,e.offsetY)
    userDataDrawingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow })
    // console.log("USER DATA DRAWING NOW =", userDataDrawingHistory)
    isDrawing = true;
    context.beginPath();
    context.lineWidth = size;
    context.strokeStyle = color;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.moveTo(e.clientX-x, e.clientY-y);
  };

  canvasElement.onmousemove = (e) => {
    if (isDrawing) {
          var rect = canvasElement.getBoundingClientRect();
          userDataDrawingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow });

    // the position related to the viewport
    const x = rect.x;
    const y = rect.y;
      context.lineTo(e.clientX-x, e.clientY-y);
      context.stroke();
      let imageData =context.getImageData(0, 0, canvasElement.width, canvasElement.height)
      let imageDataArr= imageData.data
      // console.log(' CONTEXT IMAGE DATA =', imageData)
      // console.log("INITIAL IMAGE DATA = ", initialImageData.data)
      for(var i=0;i<imageDataArr.length;i+=4){
            // if it was previously white , then we must keep it white
            if(initialImageData.data[i] > 255/2 || initialImageData.data[i+1] > 255/2 || initialImageData.data[i+2] > 255/2 ){
              // console.log("PREVIOSULY WHITE !")
              imageDataArr[i]=initialImageData.data[i]
              imageDataArr[i+1]=initialImageData.data[i+1]
              imageDataArr[i+2]=initialImageData.data[i+2]
              imageData[i+3]=initialImageData.data[i+3]
            }
            // if(dataStroke[i+3]<200){
            //     // not under stroke, no changes to image
            // }else if(dataImage[i+3]<200){
            //     // is under stroke, but not over image
            //     // so replace the image pixel with the color of the stroke
            //     dataImage[i+0]=dataStroke[i+0];
            //     dataImage[i+1]=dataStroke[i+1];
            //     dataImage[i+2]=dataStroke[i+2];
            //     dataImage[i+3]=dataStroke[i+3];
            // }else if(dataImage[i]+dataImage[i+1]+dataImage[i+2]>150){
            //     // this image pixel is under the stroke and is "blackish",
            //     // so replace the image pixel with the color of the stroke
            //     dataImage[i+0]=dataStroke[i+0];
            //     dataImage[i+1]=dataStroke[i+1];
            //     dataImage[i+2]=dataStroke[i+2];
            //     dataImage[i+3]=dataStroke[i+3];
            // }else{
            //     // the pixel is under the stroke but is not "blackish",
            //     // so no changes to image
            // }

        }

        context.putImageData(imageData,0,0);
    }
  };


  canvasElement.onmouseup = function () {
    isDrawing = false;
    context.closePath();
  };
}

async function fetchUserSketchedImageResponse(userName , userDataDrawingHistory ,  classLabel= document.querySelector('#classLabel > span').innerText , radius=size, sketchPath= document.querySelector('#sketchPath').innerText ) {
  const canvasElement = document.getElementById("canvas");

  var imageURL = canvasElement.toDataURL();
  // console.log("DATA URL", imageURL)
  const response = await fetch("/save_user_image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sketchPath : sketchPath,
      classLabel : classLabel,
      radius : size,
      img: imageURL,
      userName : userName,
      userDataDrawingHistory : userDataDrawingHistory
    })
  });
  return response
}

function initializeCanvasElementForNextSketch(){
  setTimeout(()=>{
      image = document.querySelector('#sketchCanvas')
    userDataDrawingHistory = []
    timeStampNow= Date.now()
    // console.log("IMAGE AFTER INIT =", image)
    drawOnImage(image);
  },300)

}