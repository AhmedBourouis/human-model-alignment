// import {fetchUserSketchedImageResponse} from "./annotate_script";

var sketch_index=0
var user_name=localStorage.getItem("USERNAME") || null

document.addEventListener("DOMContentLoaded", () => {
  // Initialize or retrieve currentIndex from localStorage
  let currentIndex = localStorage.getItem('currentIndex') ? parseInt(localStorage.getItem('currentIndex')) : 0;
    // Function to handle the next participant
  const loadNextParticipant = async () => {
    currentIndex++;
    localStorage.setItem('currentIndex', currentIndex);  // Update the stored value of currentIndex

    // Fetch the next participant
    const response = await fetch(`/start/${currentIndex}`);
    const data = await response.json();

    if (data.status === "started") {
      window.location.href = "/"; // Reset the session
    } else if (data.status === "finished") {
      document.getElementById("annotationContainer").innerHTML = "<h1>All participants have finished!</h1>";
    }
  };

     // Function to fetch the next sketch for annotation
  const fetchNextSketch = async (savingCurrent=false) => {
    if(!savingCurrent || (savingCurrent && confirm("Are you sure you want to confirm ?"))){
          confirmButton.disabled=true
    console.log("CALLING FETCH NEXT SKETCH !")
    // TODO: activate it later
      console.log("SAVING CURRENT CHECK !")
      if( (userDataDrawingHistory.length && savingCurrent) || !savingCurrent){
        console.log("SENDING THE IMAGE !")
        // THIS IS  THE LINE WHERE I HAVE CALLED THE SAVING IMAGE OPEARTION
        if(savingCurrent){
          fetchUserSketchedImageResponse(user_name , userDataDrawingHistory, userDataErasingHistory )
        }
           const response = await fetch(`/next_sketch/${sketch_index}`);
            sketch_index++
          const data = await response.json();
          console.log("DATA FETCH NEXT SKETCH  =", data)


          // // Check if all annotations are done
          // if (data.status === "done") {
          //   console.log("DONE !!!!!!!!!!!!!")
          //   // Display a thank you message and a Next Participant button
          //   document.getElementById("annotationContainer").innerHTML = "<h1>Thank you for participating!</h1><button id='nextParticipantButton'>Next Participant</button>";
          //   document.getElementById("nextParticipantButton").addEventListener("click", loadNextParticipant);
          //   // return;
          // }

          // Update the sketch and class label without reloading the page
          const sketchCanvas = document.getElementById("sketchCanvas");
          const classLabelElement = document.getElementById("classLabel");

          sketchCanvas.src = `data:image/jpeg;base64,${data.sketch}`;
          document.querySelector('#classLabel > span').innerText = data.class_label
          document.querySelector('#sketchPath').innerText = data.sketch_path
          // if(savingCurrent){
                initializeCanvasElementForNextSketch()
          // }

          if (confirmButton) {
            console.log("CONFIRM BUTTON EXISTS !")
            if(data.isLast){
              console.log("THIS IS THE LAST DATA !")
              // hide the confirmation button and show the next participant button
              confirmButton.style.display='none'
              nextParticipantButton.style.display ='inline-block'
            }
        }
            confirmButton.disabled=false


      }else{
        confirmButton.disabled=false
        alert("You must do the sketching before movinf to the next ones !")

      }
    }






    // classLabelElement.innerText = `Please annotate class: ${data.class_label}`;
  };
  // const confirmButton = document.getElementById("confirmButton");

  // CONFIGURING THE BUTTONS

  // Add an event listener for the Confirm Annotation button
  const confirmButton = document.getElementById("confirmButton");
  const nextParticipantButton = document.querySelector('#nextParticipant')
  if(confirmButton){
      confirmButton.addEventListener("click", ()=>fetchNextSketch(savingCurrent=true));
      nextParticipantButton.addEventListener("click" , ()=> window.location.href = "/thanks" )
  }





  const form = document.getElementById("user-info-form");
  if(form){
      form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const skill = document.getElementById("skill").value;
    const terms = document.getElementById("terms").checked;
    user_name = document.getElementById("user_name").value;
    const skill_freq = document.getElementById("skill_freq").value;

    const data = {
      user_name: user_name, // replace this as needed
      Age: age,
      Gender: gender,
      "Drawing Skills": skill,
      "Drawing Frequency": skill_freq,
      "Terms Accepted": terms ? "Yes" : "No",
    };


    // Send form data to the server
    const response = await fetch("/submit_form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    // if (result.status === "success") {
    //   const proceed = window.confirm("Do you want to go to the annotation screen?");
    //   if (proceed) {
    //     await fetch(`/start/${currentIndex}`);
    //     fetchNextSketch(); // Display the first annotation
    //   }

    //   } else {
    //   alert("Form submission failed.");
    // }
    if (result.status === "success") {
      const proceed = window.confirm("Do you want to go to the annotation screen?");

      if (proceed) {
        console.log("starting the annotation session");
        let collection_index = window.location.href.split('/').slice(-1)[0];
        const startResponse = await fetch(`/start/${collection_index}`);
        const startData = await startResponse.json();
        if (startData.status === "started") {
          localStorage.setItem("USERNAME", user_name)
          window.location.href = "/annotate"; // Navigate to the annotation page
        } else {
          alert("Could not start the annotation session.");
        }
      }
    } else { alert("Form submission failed."); }
  });

  }










  
  // window.fetchNextSketch = fetchNextSketch;


  // If we are on the annotation screen, fetch the first sketch
  if (window.location.pathname === '/annotate') {
    fetchNextSketch(savingCurrent=false);
    let circle = document.getElementById('circle');

    const onMouseMove = (e) =>{
      circle.style.left = e.pageX + 'px';
      circle.style.top = e.pageY + 'px';
    }

    document.addEventListener('mousemove', onMouseMove);
  }


}, { once: true });



//   const fetchNextSketch = async () => {
//     const response = await fetch("/next_sketch");
//     const data = await response.json();

//     // Clear the existing annotation screen
//     document.body.innerHTML = "";

//     // Check if all annotations are done
//     if(data.status === "done") {
//         // Display a thank you message
//         document.body.innerHTML = "<h1>Thank you for participating!</h1>";
//         // Add a Next Participant button to the frontend
//         const nextParticipantButton = document.createElement("button");
//         nextParticipantButton.innerHTML = "Next Participant";
//         document.body.appendChild(nextParticipantButton);

//         // Add an event listener for the Next Participant button
//         nextParticipantButton.addEventListener("click", loadNextParticipant);

//         return;
//       }

//     const sketchPath = data.sketch; // The sketch path
//     const classLabel = data.class_label; // The corresponding class label

//     // Create a title and class label annotation message
//     const titleElement = document.createElement("h1");
//     titleElement.innerHTML = "Annotation Screen";
//     document.body.appendChild(titleElement);

//     const classLabelElement = document.createElement("h2");
//     classLabelElement.innerHTML = `Please annotate class: ${classLabel}`;
//     document.body.appendChild(classLabelElement);

//     // Create an image element and set its source to the sketch path
//     const imgElement = document.createElement("img");
//     imgElement.src = `data:image/jpeg;base64,${sketchPath}`; // Set the src to the Base64 string
//     document.body.appendChild(imgElement);

//     // Create the Confirm Annotation button
//     const confirmButton = document.createElement("button");
//     confirmButton.innerHTML = "Confirm Annotation";
//     document.body.appendChild(confirmButton);

//     confirmButton.addEventListener("click", () => {
//       fetchNextSketch();  
//     });
//   };
  

//   // Function to handle next participant
//   const loadNextParticipant = async () => {
//     currentIndex++;
//     localStorage.setItem('currentIndex', currentIndex);  // Update the stored value of currentIndex

//     // Fetch the next participant    
//     const response = await fetch(`/start/${currentIndex}`);
//     const data = await response.json();

//     if (data.status === "started") {
//       // Reset the session
//       window.location.href = "/";
      
//     } else if (data.status === "finished") {
//       document.body.innerHTML = "<h1>All participants have finished!</h1>";
//     }
//   };
  
// });
  