from flask import Flask, render_template, request, jsonify, session
import pandas as pd
import os
from flask_session import Session
import json
import random
import base64

from PIL import Image
from io import BytesIO
import re

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
# app.secret_key = 'supersecretkey'
Session(app)
 
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit_form', methods=['POST'])
def submit_form():
    print("Form submitted")
    # Retrieve data from the form
    data = request.json

    # Saving data to a CSV file
    df = pd.DataFrame(data, index=[0])
    user_name = data['user_name']
    folder_path = os.path.join('user_annotations', user_name)

    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    df.to_csv(os.path.join(folder_path, 'user_info.csv'), index=False)

    return jsonify({"status": "success", "message": "Form submitted successfully"}), 200


# @app.route('/start', methods=['GET'])
@app.route('/start/<int:index>', methods=['GET'])
def start(index):
    print("current user: ", index)
    all_sketches_lists = []
    with open('all_classes.json', "r") as f:
        all_classes = json.load(f)

    base_dir = "users"
    users = sorted(os.listdir(base_dir))
    sketches_classes_all = [os.listdir(os.path.join(base_dir, users[i])) for i in range(len(users))]

    sketches_path_all = []
    for d,sketches_classes in enumerate(sketches_classes_all):
        sketches_path = [os.path.join(base_dir, users[d], i) for i in sketches_classes if i.endswith('.jpg')]
        sketches_path_all.append(sketches_path)

    for sketches_path in sketches_path_all:
        classes_images_dict = {}
        for i in sketches_path:
            sketch_id = i.split('/')[-1]
            classes_images_dict[sketch_id] = json.load(open(i.replace('jpg', 'json'), "r"))

        sketch_class_list = [(sketch_path, class_label) for sketch_path in sketches_path for class_label in json.load(open(sketch_path.replace('jpg', 'json'), "r"))]
        random.shuffle(sketch_class_list)
        all_sketches_lists.append(sketch_class_list)
    
    # # Store the shuffled list in a session variable
    session['all_sketches_lists'] = all_sketches_lists
    # session['current_sketch_class_list'] = all_sketches_lists[index] if all_sketches_lists else []  # Start with the first user's sketches    
    
    if index < len(all_sketches_lists):
        session['current_sketch_class_list'] = all_sketches_lists[index]
        return jsonify({"status": "started"}), 200
    else:
        return jsonify({"status": "finished", "message": "All participants have finished"}), 200


@app.route('/annotate')
def annotate():
    print("Annotate called")
    if 'current_sketch_class_list' in session and len(session['current_sketch_class_list']) > 0:
        sketch_path, class_label = session['current_sketch_class_list'].pop(0)
        with open(sketch_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode()
        return render_template('annotate.html', sketch=encoded_string, classLabel=class_label)
    else:
        return "Session not initialized. Call /start first.", 400


@app.route('/next_sketch', methods=['GET'])
def next_sketch():
    # Fetch the next sketch and class label from the session variable
    if 'current_sketch_class_list' in session:
        if len(session['current_sketch_class_list']) > 0:
            sketch_path, class_label = session['current_sketch_class_list'].pop(0)
            # Open image file
            with open(sketch_path, "rb") as image_file:
                # Encode as base64
                encoded_string = base64.b64encode(image_file.read()).decode()
            
            return jsonify({"sketch": encoded_string, "class_label": class_label}), 200
        
        elif len(session['current_sketch_class_list']) == 0:
            return jsonify({"status": "done", "message": "All sketches annotated, ready for next user."}), 200
        else:
            return jsonify({"status": "error", "message": "Session not initialized. Call /start first."}), 400
    else:
        return jsonify({"status": "error", "message": "Session not initialized. Call /start first."}), 400



@app.route('/save_user_image', methods=['POST'])
def save_canvas():
    inputs = request.get_json(force=True)
    # print("GET JSON  =", inputs)
    # print("REQUEST =", request.form)
    # print("USEENAME = ",inputs["userName"] , "IMAGE = ", inputs["userName"]  )
    # print("STARTING USER IMAGE" )
    image_data = re.sub('^data:image/.+;base64,', '', inputs['img'])
    # print("IMAGE DATA  =" , image_data  )
    im = Image.open(BytesIO(base64.b64decode(image_data)))
    # print("opening image =" , im  )
    # user_name = data['user_name']
    folder_path = os.path.join('user_annotations', inputs["userName"])

    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    im.save(f'{folder_path}/FILENAME.png')
    print("userDataDrawingHistory =", inputs['userDataDrawingHistory'])
    return json.dumps({'result': 'success'}), 200, {'ContentType': 'application/json'}


if __name__ == "__main__":
    app.run(debug=True,port=5050)