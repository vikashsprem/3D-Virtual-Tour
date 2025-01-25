import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000"

const WebcamStream = () => {
  const videoRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [filename, setFilename] = useState("");
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [frameRate, setFrameRate] = useState(0);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const frameTimes = useRef([]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      setIsWebcamActive(true);

      // Set resolution once the video metadata is loaded
      videoRef.current.onloadedmetadata = () => {
        setResolution({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        });
      };
    } catch (error) {
      console.error("Webcam access error:", error);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setIsWebcamActive(false);
      setStream(null);
      setResolution({ width: 0, height: 0 }); // Reset resolution
    }
  };

  const toggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const startRecording = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/record/start`);
      setFilename(response.data.filename);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      await axios.post(`${BASE_URL}/record/stop`);
      setIsRecording(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const downloadRecording = async () => {
    try {
      const url = `${BASE_URL}/video/${filename}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } catch (error) {
      console.error("Error downloading video:", error);
    }
  };

  const calculateFrameRate = () => {
    const now = performance.now();
    frameTimes.current.push(now);

    // Keep only the last 1 second of frame times
    frameTimes.current = frameTimes.current.filter(
      (time) => now - time <= 1000
    );

    setFrameRate(frameTimes.current.length);
    requestAnimationFrame(calculateFrameRate);
  };

  useEffect(() => {
    if (isWebcamActive) {
      requestAnimationFrame(calculateFrameRate);
    } else {
      frameTimes.current = [];
      setFrameRate(0);
    }
    // Cleanup on unmount or when webcam stops
    return () => {
      frameTimes.current = [];
      setFrameRate(0);
    };
  }, [isWebcamActive]);

  return (
    <div className="webcam-container" style={{ width: "100%", height: "74.5%" }}>
      <video
        ref={videoRef}
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#111111",
        }}
      />
      <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
        <button onClick={toggleWebcam}>
          {isWebcamActive ? "Stop Webcam" : "Start Webcam"}
        </button>
        {!isRecording ? (
          <button onClick={startRecording} disabled={!isWebcamActive}>
            Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} style={{ color: "red" }}>
            Stop Recording
          </button>
        )}
        {filename && !isRecording && (
          <button onClick={downloadRecording}>Download Recording</button>
        )}
      </div>
      {isRecording && (
        <div style={{ color: "red", fontWeight: "bold", marginTop: "5px" }}>
          ● Recording...
        </div>
      )}
      {isWebcamActive && (
        <div style={{ color: "white", marginTop: "10px" }}>
          <div>Frame Rate: {frameRate} fps</div>
          <div>
            Resolution: {resolution.width} x {resolution.height} pixels
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamStream;
