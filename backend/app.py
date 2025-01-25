from flask import Flask, request, jsonify, send_from_directory
import os
import time
import cv2
import threading
import queue
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)


# Directory to save video recordings
VIDEO_FOLDER = 'recorded_videos'
if not os.path.exists(VIDEO_FOLDER):
    os.makedirs(VIDEO_FOLDER)

# Video recording handling
class VideoRecorder:
    def __init__(self):
        self.is_recording = False
        self.video_writer = None
        self.capture_thread = None
        self.frame_queue = queue.Queue()
        self.frame_rate = 30.0  # Increased frame rate
        self.frame_size = (640, 480)
        self.filename = ""

    def start_recording(self):
        self.is_recording = True
        self.filename = f"{int(time.time())}.mp4"
        video_path = os.path.join(VIDEO_FOLDER, self.filename)
        
        # Use more reliable codec
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        self.video_writer = cv2.VideoWriter(
            video_path, fourcc, self.frame_rate, self.frame_size
        )
        
        self.capture_thread = threading.Thread(target=self._capture_frames)
        self.write_thread = threading.Thread(target=self._write_frames)
        
        self.capture_thread.start()
        self.write_thread.start()
        
        return self.filename

    def _capture_frames(self):
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_size[0])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_size[1])
        cap.set(cv2.CAP_PROP_FPS, self.frame_rate)
        
        while self.is_recording:
            ret, frame = cap.read()
            if not ret:
                break
            self.frame_queue.put(frame)
        
        cap.release()
        self.frame_queue.put(None)

    def _write_frames(self):
        while True:
            frame = self.frame_queue.get()
            if frame is None:
                break
            self.video_writer.write(frame)
        
        self.video_writer.release()

    def stop_recording(self):
        if self.is_recording:
            self.is_recording = False
            self.capture_thread.join()
            self.write_thread.join()

# Instantiate the video recorder
video_recorder = VideoRecorder()


@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "CORS is working!"})

@app.route('/record/start', methods=['POST'])
def start_recording():
    filename = video_recorder.start_recording()
    return jsonify({"message": "Recording started", "filename": filename})

@app.route('/record/stop', methods=['POST'])
def stop_recording():
    video_recorder.stop_recording()
    return jsonify({"message": "Recording stopped"})

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file uploaded"}), 400

    video_file = request.files['video']
    filename = video_file.filename
    filepath = os.path.join(VIDEO_FOLDER, filename)
    video_file.save(filepath)
    return jsonify({"filename": filename}), 200


@app.route('/video/<filename>', methods=['GET'])
def download_video(filename):
    video_path = os.path.join(VIDEO_FOLDER, filename)
    if os.path.exists(video_path):
        return send_from_directory(VIDEO_FOLDER, filename)
    else:
        return jsonify({"error": "Video not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
