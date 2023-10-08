import traceback

from flask import Flask, render_template, request, jsonify, session
import pandas as pd
import os
from flask_session import Session
import json
import random
import base64
import numpy as np
from PIL import Image
from io import BytesIO
import re
import matplotlib.pyplot as plt

app = Flask(__name__, static_folder='../frontend', static_url_path='/' , template_folder='templates')
# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
# app.secret_key = 'supersecretkey'
Session(app)

from werkzeug.exceptions import HTTPException

debug = True  # global variable setting the debug config

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e

    res = {'code': 500,
           'errorType': 'Internal Server Error',
           'errorMessage': "Something went really wrong!"}
    if debug:
        print("E == ",e)
        res['traceback'] = str(traceback.format_exc())
        res['errorMessage'] = e.message if hasattr(e, 'message') else f'{e}'
        res['e'] = f'{e}'

    return jsonify(res), 500


@app.route('/<collection_index>')
def index(collection_index=None):
    return render_template('index.html')

@app.route('/thanks')
def thanks():
    return render_template('thanks.html')


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
    # global annotation_data
    # global heatmaps_data
    global all_classes
    
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
    session['all_classes'] = all_classes

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

        # sketch_path, class_label = session['current_sketch_class_list'].pop(0)
        # with open(sketch_path, "rb") as image_file:
        #     encoded_string = base64.b64encode(image_file.read()).decode()
        # return render_template('annotate.html', sketch=encoded_string, classLabel=class_label , sketch_path=sketch_path)
        return render_template('annotate.html')

    else:
        return "Session not initialized. Call /start first.", 400


@app.route('/next_sketch/<sketch_index>', methods=['GET'])
def next_sketch(sketch_index):
    sketch_index = int(sketch_index)
    print("length of user sketches: ", len(session['current_sketch_class_list']))

    # Fetch the next sketch and class label from the session variable
    if 'current_sketch_class_list' in session:
        if len(session['current_sketch_class_list']) > 0:
            isLast = False
            if( sketch_index+1 == len(session['current_sketch_class_list']) ):
                isLast = True

            # sketch_path, class_label = session['current_sketch_class_list'].pop(0)
            sketch_path, class_label = session['current_sketch_class_list'][sketch_index]
            # Open image file
            with open(sketch_path, "rb") as image_file:
                # Encode as base64
                encoded_string = base64.b64encode(image_file.read()).decode()

            return jsonify({"sketch": encoded_string, "class_label": class_label , "sketch_path" : sketch_path , "isLast" : isLast , "remaining" : (len(session['current_sketch_class_list']) -1) - sketch_index  }), 200
        
        elif len(session['current_sketch_class_list']) == 0:
            return jsonify({"status": "done", "message": "All sketches annotated, ready for next user."}), 200
        else:
            return jsonify({"status": "error", "message": "Session not initialized. Call /start first."}), 400
    else:
        return jsonify({"status": "error", "message": "Session not initialized. Call /start first."}), 400


@app.route('/save_user_image', methods=['POST'])
def save_canvas():
    inputs = request.get_json(force=True)
    RADIUS = int(inputs['radius'])
    CLASS_LABEL = inputs['classLabel']
    SKETCH_PATH = inputs['sketchPath']

    print('radius =', RADIUS, "CLASS LABEL =", CLASS_LABEL, 'SKETCH PATH =', SKETCH_PATH)
    # print("GET JSON  =", inputs)
    # print("REQUEST =", request.form)
    # print("USEENAME = ",inputs["userName"] , "IMAGE = ", inputs["userName"]  )
    # print("STARTING USER IMAGE" )
    image_data = re.sub('^data:image/.+;base64,', '', inputs['img'])
    # print("IMAGE DATA  =" , image_data  )
    im = Image.open(BytesIO(base64.b64decode(image_data)))

    img_np = np.array(im)
    # Initialize a zeros array of shape (512, 512)
    img_result = np.zeros((512, 512), dtype=np.uint8)
    all_classes = session['all_classes']
    global_index = all_classes.index(CLASS_LABEL)

    for i in range(512):
        for j in range(512):
            pixel_value = img_np[i, j]
            if np.all(pixel_value == [255, 0, 0, 255]):
                img_result[i, j] = global_index

    def is_within_radius(x, y, cx, cy, radius=RADIUS):
        distance = np.sqrt((x - cx) * 2 + (y - cy) * 2)
        return distance <= radius

    def timestamp_to_numpy(timestamp_list, size=512):
        # Step 1: Initialize the array
        result = np.zeros((size, size), dtype=np.float64)

        # Step 2: Find the min and max timestamps
        timestamps = [entry['timestamp'] for entry in timestamp_list]
        t_min = min(timestamps)
        t_max = max(timestamps)

        # Step 3 & 4: Populate the array with normalized timestamps
        for entry in timestamp_list:
            y, x, timestamp = entry['X'], entry['Y'], entry['timestamp']
            normalized_timestamp = (timestamp - t_min) / (t_max - t_min)
            normalized_timestamp = 1 - normalized_timestamp
            for x1 in range(x - RADIUS // 2, x + RADIUS // 2):
                for y1 in range(y - RADIUS // 2, y + RADIUS // 2):
                    if is_within_radius(x1, y1, x, y, radius=RADIUS):
                        if x1 < 0 or x1 >= size or y1 < 0 or y1 >= size:
                            continue
                        else:
                            result[x1, y1] = normalized_timestamp
        return result

    heatmap = timestamp_to_numpy(inputs['userDataDrawingHistory'])
    heatmap[img_result == 0] = 0
    # print("SKETCH PATH =", SKETCH_PATH)
    user_name = inputs['userName']
    img_id = SKETCH_PATH.split('/')[-1].split('.')[0]
    user_id = SKETCH_PATH.split('/')[-2]
    folder_path = os.path.join('user_annotations', user_name, user_id)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    annotation_path = os.path.join(folder_path, 'annotations')
    heatmap_path = os.path.join(folder_path, 'heatmaps')
    if not os.path.exists(annotation_path):
        os.makedirs(annotation_path)
    if not os.path.exists(heatmap_path):
        os.makedirs(heatmap_path)
    print("folder_path =",os.path.abspath(folder_path) )
    img_class_name = f'{img_id}_{CLASS_LABEL}.npy'
    np.save(os.path.join(annotation_path, img_class_name), img_result)
    np.save(os.path.join(heatmap_path, img_class_name), heatmap)

    # print("userDataDrawingHistory =", inputs['userDataDrawingHistory'])
    # print("userDataErasingHistory =", inputs['userDataErasingHistory'])

    return json.dumps({'result': 'success' , 'ABSOLUTE_PATH' : os.path.abspath(folder_path) }), 200, {'ContentType': 'application/json'}


if __name__ == "__main__":
    app.run(debug=True,port=5000)