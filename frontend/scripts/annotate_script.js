const fileInput = document.querySelector("#upload");
var tooltype = 'draw';
//Use draw|erase
use_tool = function(tool) {
    tooltype = tool; //update
    document.querySelector('#circle').style.borderColor = tool === "draw"? "red" : "black"
}

// enabling drawing on the blank canvas
drawOnImage();
let image = document.querySelector('#sketchCanvas')
var initialImageData;
var userDataDrawingHistory = []
var userDataErasingHistory = []
var timeStampNow= Date.now()

const sizeElement = document.querySelector("#sizeRange");
let size = sizeElement.value;
sizeElement.oninput = (e) => {
    console.log("ON SIZE INPUT !", document.querySelector('#circle') , e.target.value)
  size = e.target.value;

    document.querySelector('#circle').style.height = e.target.value +'px'
    document.querySelector('#circle').style.width = e.target.value +'px'

    document.querySelector('#brush-size-circle').style.height = e.target.value +'px'
    document.querySelector('#brush-size-circle').style.width = e.target.value +'px'


};
let color = "red"

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



  let isDrawing;

  canvasElement.onmousedown = (e) => {
    var rect = canvasElement.getBoundingClientRect();

    // the position related to the viewport
    const x = rect.x;
    const y = rect.y;

    console.log("X, Y ON MOUSE DOWN FOR THE MOUSE= ",e.offsetX,e.offsetY)
      if(tooltype ==="draw"){
          userDataDrawingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow })
      } else if(tooltype==="erase"){
            userDataErasingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow })

      }
    // console.log("USER DATA DRAWING NOW =", userDataDrawingHistory)
    isDrawing = true;
    context.beginPath();
    context.lineWidth = size;
    if(tooltype==="draw"){
        context.strokeStyle = "red";
    }else{
        context.strokeStyle = "black";
    }
    context.strokeStyle = color;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.moveTo(e.clientX-x, e.clientY-y);
  };

  canvasElement.onmousemove = (e) => {
    if (isDrawing) {
          var rect = canvasElement.getBoundingClientRect();
          // the position related to the viewport
          const x = rect.x;
          const y = rect.y;
          // if(tooltype==="draw"){
              if(tooltype==="draw"){
                  context.strokeStyle = "red";
                  userDataDrawingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow });
              }else if (tooltype==="erase"){
                  context.strokeStyle = "#00ff00";
                  userDataErasingHistory.push({"X": e.offsetX , "Y" : e.offsetY , "timestamp" : Date.now()-timeStampNow });

              }
              // context.globalCompositeOperation = 'source-over';
              context.lineTo(e.clientX-x, e.clientY-y);
              context.stroke();
              let imageData =context.getImageData(0, 0, canvasElement.width, canvasElement.height)
              let imageDataArr= imageData.data
              // console.log("INITIAL IMAGE DATA = ", initialImageData.data)
              if( tooltype === "draw"){
                  // if it was white -> keep it white , if it's black -> make it red
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
              }else if( tooltype ==="erase"){
                  console.log(' CONTEXT IMAGE DATA =', imageData)
                  // if it was white-> keep it white , if it's green -> make it black
                  for(var i=0;i<imageDataArr.length;i+=4){
                      // if it's green : make it back to its original color
                        if(imageDataArr[i+1] === 255){
                            imageDataArr[i]=initialImageData.data[i]
                          imageDataArr[i+1]=initialImageData.data[i+1]
                          imageDataArr[i+2]=initialImageData.data[i+2]
                          imageData[i+3]=initialImageData.data[i+3]
                        }
                    // if it was previously white , then we must keep it white
                    // if(initialImageData.data[i] > 255/2 || initialImageData.data[i+1] > 255/2 || initialImageData.data[i+2] > 255/2 ){
                    //   // console.log("PREVIOSULY WHITE !")
                    //   imageDataArr[i]=initialImageData.data[i]
                    //   imageDataArr[i+1]=initialImageData.data[i+1]
                    //   imageDataArr[i+2]=initialImageData.data[i+2]
                    //   imageData[i+3]=initialImageData.data[i+3]
                    // }


                }
              }
              // context.fillStyle = "white";
              context.putImageData(imageData,0,0);
          // }else{
          //     context.strokeStyle = "green";
          //   console.log("ERASE !")
          //   // context.globalCompositeOperation = 'destination-out';
          //   context.lineTo(e.clientX-x, e.clientY-y);
          //   context.stroke();
          //     let imageData =context.getImageData(0, 0, canvasElement.width, canvasElement.height)
          //     let imageDataArr= imageData.data
          //     // console.log(' CONTEXT IMAGE DATA =', imageData)
          //     // console.log("INITIAL IMAGE DATA = ", initialImageData.data)
          //     for(var i=0;i<imageDataArr.length;i+=4){
          //           // if it was previously black , then we must keep it black
          //           if(initialImageData.data[i] < 255/2 || initialImageData.data[i+1] < 255/2 || initialImageData.data[i+2] < 255/2 ){
          //             imageDataArr[i]=initialImageData.data[i]
          //             imageDataArr[i+1]=initialImageData.data[i+1]
          //             imageDataArr[i+2]=initialImageData.data[i+2]
          //             imageData[i+3]=initialImageData.data[i+3]
          //           }
          //           // if(dataStroke[i+3]<200){
          //           //     // not under stroke, no changes to image
          //           // }else if(dataImage[i+3]<200){
          //           //     // is under stroke, but not over image
          //           //     // so replace the image pixel with the color of the stroke
          //           //     dataImage[i+0]=dataStroke[i+0];
          //           //     dataImage[i+1]=dataStroke[i+1];
          //           //     dataImage[i+2]=dataStroke[i+2];
          //           //     dataImage[i+3]=dataStroke[i+3];
          //           // }else if(dataImage[i]+dataImage[i+1]+dataImage[i+2]>150){
          //           //     // this image pixel is under the stroke and is "blackish",
          //           //     // so replace the image pixel with the color of the stroke
          //           //     dataImage[i+0]=dataStroke[i+0];
          //           //     dataImage[i+1]=dataStroke[i+1];
          //           //     dataImage[i+2]=dataStroke[i+2];
          //           //     dataImage[i+3]=dataStroke[i+3];
          //           // }else{
          //           //     // the pixel is under the stroke but is not "blackish",
          //           //     // so no changes to image
          //           // }
          //
          //       }
          //
          //     context.putImageData(imageData,0,0);
          //
          // }

    }
  };


  canvasElement.onmouseup = function () {
    isDrawing = false;
    context.closePath();
  };
}

async function fetchUserSketchedImageResponse(userName , userDataDrawingHistory , userDataErasingHistory ,  classLabel= document.querySelector('#classLabel > span').innerText , radius=size, sketchPath= document.querySelector('#sketchPath').innerText ) {
  const canvasElement = document.getElementById("canvas");

  var imageURL = canvasElement.toDataURL();
  // console.log("DATA URL", imageURL)
  console.log("SKETCH PATH =", sketchPath)
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
      userDataDrawingHistory : userDataDrawingHistory,
      userDataErasingHistory : userDataErasingHistory,

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