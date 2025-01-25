# 3D-Virtual Tour

This application divided into two sections:
- **First:** We can stream the video and can start recording and download from here (it will record and download only video stream capture by webcam).

- **Second:** Allows users to record content from an HTML canvas (*3D Rendering the content*) element (*We can play with element like zoom in/out or movement*) and upload the recorded video to a server. The video is captured using the `MediaRecorder` API and saved as a WebM file. We can download the video from ui only (*It will request the backend to get video for you*).

- **Diagram:**

## Setup Instructions

To get started with the project, follow these steps:

### Prerequisites
1. **Node.js**: Make sure you have [Node.js](https://nodejs.org/en/) installed.

2. **Python**: Ensure Python is installed for running the backend server (used for uploading the recorded video).

3. **Python Dependencies**: You'll need `Flask` for the backend. You can install it by running the following command: `pip install Flask`
   
## Steps to Run the Application

Clone the Repository Clone this repository to your local machine:

    git clone https://github.com/vikashsprem/3D-Virtual-Tour.git
    cd 3D-Virtual-Tour


### Frontend Setup:


Install the required frontend dependencies and run the frontend:

```
npm install
npm run dev
```
`This will start a local development server on http://localhost:5173.`

### Backend Setup:

Navigate to the backend directory and run the Flask server:
```
cd backend
python app.py
```
`Optional:` For virtual python environment (vnv) setup use following command
```
python3 -m venv venv
source venv/bin/activate
```
**Note:** you should have all dependency installed.
`The Flask server will start on http://127.0.0.1:5000.`

**Note:** Open the Application Open your browser and navigate to http://localhost:5173 to access the application.



## Used Libraries and Tools
- **React:** JavaScript library for building the user interface.
MediaRecorder API: Native browser API for recording media streams (used to record canvas content).

- **Axios:** Promise-based HTTP client for making requests to the backend.

- **Flask:** Python web framework used to handle video uploads to the server.

- **WebM Format:** Chosen for recording because it is widely supported for web video playback.

- **Additional Dependencies:** `react`, `react-dom`, `axios`, `Flask`, 
`Python 3.x`(for running the backend).


## Technical Decisions
- **Canvas Recording:** We use the captureStream method to record the content of an HTML canvas at 30 frames per second. This ensures a smooth and consistent capture of the canvas content.

- **Backend Server:** Flask is used for handling the backend video upload process. It listens for POST requests and saves the video to the server’s storage.

- **File Format:** The video is saved as a WebM file, which is supported by modern browsers and has a smaller file size compared to other video formats.

- **Cross-Origin Requests:** We use Axios to handle POST requests to the Flask backend. The backend should handle CORS (Cross-Origin Resource Sharing) headers to allow requests from the frontend.

- **Server-side Storage:** The backend server only stores the video file temporarily. For production use, you might want to store the video files in a cloud storage service (like AWS S3) or a more permanent database.

## Known Limitations

- **No Webcam Recording**: The current version of the app only records the content from the canvas and does not include any webcam stream in the recording.
  
- **Browser Compatibility**: The `MediaRecorder` API used for capturing the canvas content may not be fully supported across all browsers. While it works well in most modern browsers like Chrome and Firefox, some older browsers or versions may have limited or no support for this API.

- **Performance**: Recording at 30 FPS may lead to performance issues on older or resource-limited devices. For better performance, especially on low-end devices, the frame rate may need to be adjusted or optimized to ensure smooth recording.

## Social media links
* LinkedIn: [Link](https://linkedin.com/in/vikashsprem/)
* Twitter: [Link](https://x.com/vikashsprem)

Free free to dm me if you encounter any issues. Thanks 🤩