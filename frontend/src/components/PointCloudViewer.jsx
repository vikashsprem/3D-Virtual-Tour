import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const PointCloudViewerWithWebcam = ({ plyFilePath }) => {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const videoRef = useRef(document.createElement("video"));
  const [stream, setStream] = useState(null);
  const [videoPlane, setVideoPlane] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFilename, setRecordedFilename] = useState("");
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0x111111);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 1.5);
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 500;

    // Load PLY file
    const plyLoader = new PLYLoader();
    plyLoader.load(
      plyFilePath,
      (geometry) => {
        geometry.computeVertexNormals();

        // Center geometry
        const boundingBox = new THREE.Box3().setFromBufferAttribute(
          geometry.attributes.position
        );
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Create point cloud material
        const pointCloudMaterial = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.05,
          vertexColors: true,
        });

        // Add point cloud to scene
        const pointCloud = new THREE.Points(geometry, pointCloudMaterial);
        scene.add(pointCloud);
      },
      null,
      (error) => console.error("Error loading PLY file:", error)
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth / 2;
      const height = window.innerHeight / 1.5;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      if (stream) {
        stopStream();
      }
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [plyFilePath, stream]);

  // Function to start the webcam stream
  const startStream = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((mediaStream) => {
        setStream(mediaStream);
        const videoElement = videoRef.current;
        videoElement.srcObject = mediaStream;
        videoElement.play();

        // Create video texture and material
        const videoTexture = new THREE.VideoTexture(videoElement);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;

        const videoMaterial = new THREE.MeshBasicMaterial({
          map: videoTexture,
        });

        // Create a plane for the video feed
        const videoPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(25, 14),
          videoMaterial
        );

        videoPlane.position.set(0, 0, -10);
        videoPlane.userData.fixedPosition = true;
        sceneRef.current.add(videoPlane);
        setVideoPlane(videoPlane);
        const controls = new OrbitControls(
          cameraRef.current,
          renderer.domElement
        );
        controls.enableDamping = true;
        controls.screenSpacePanning = false;
        controls.enablePan = false;
      })
      .catch((error) => console.error("Error accessing webcam:", error));
  };

  const startRecordingCanvasAndWebcam = async () => {
    if (mountRef.current) {
      const canvas = mountRef.current.querySelector("canvas");

      if (canvas) {
        const canvasStream = canvas.captureStream(30);

        mediaRecorderRef.current = new MediaRecorder(canvasStream, {
          mimeType: "video/webm",
        });

        const chunks = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const filename = `${Date.now()}.webm`;

          // Save file to the server
          const formData = new FormData();
          formData.append("video", blob, filename);

          try {
            const response = await axios.post(
              "http://127.0.0.1:5000/upload",
              formData
            );
            setRecordedFilename(response.data.filename);
          } catch (error) {
            console.error("Error uploading video:", error);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    }
  };

  const stopRecordingCanvasAndWebcam = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Function to stop the webcam stream and clean up resources
  const stopStream = () => {
    if (stream) {
      // Stop all media tracks in the stream
      stream.getTracks().forEach((track) => track.stop());
      setStream(null); // Clear the stream state
    }

    // Remove the video plane and dispose of associated resources
    if (videoPlane) {
      sceneRef.current.remove(videoPlane);
      if (videoPlane.material.map) {
        videoPlane.material.map.dispose();
      }
      videoPlane.material.dispose();
      videoPlane.geometry.dispose();
      setVideoPlane(null);
    }
  };

  // Function to download recorded video
  const downloadRecording = async () => {
    if (recordedFilename) {
      try {
        const url = `http://127.0.0.1:5000/video/${recordedFilename}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = recordedFilename;
        a.click();
      } catch (error) {
        console.error("Error downloading video:", error);
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div ref={mountRef} style={{ width: "100%", height: "50%" }}></div>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
        <button
          onClick={() => (cameraRef.current.position.z -= 1)}
          style={{ margin: "5px" }}
        >
          Zoom In
        </button>
        <button
          onClick={() => (cameraRef.current.position.z += 1)}
          style={{ margin: "5px" }}
        >
          Zoom Out
        </button>
        {!stream ? (
          <button
            onClick={startStream}
            style={{ margin: "5px" }}
            disabled={!!stream}
          >
            Start Webcam
          </button>
        ) : (
          <button
            onClick={stopStream}
            style={{ margin: "5px" }}
            disabled={!stream}
          >
            Stop Webcam
          </button>
        )}
      </div>
      {isRecording && (
        <div
          style={{
            position: "absolute",
            bottom: 70,
            left: 20,
            color: "red",
            fontWeight: "bold",
          }}
        >
          ● Recording
        </div>
      )}
      <button
        onClick={startRecordingCanvasAndWebcam}
      >
        Start Recording
      </button>
      <button
        onClick={stopRecordingCanvasAndWebcam}
        disabled={!isRecording}
        style={{ color: isRecording ? "red" : "inherit", marginLeft: "5px" }}
      >
        Stop Recording
      </button>
      <button
        onClick={downloadRecording}
        style={{ margin: "5px" }}
        disabled={!recordedFilename || isRecording}
      >
        Download Recording
      </button>
    </div>
  );
};

export default PointCloudViewerWithWebcam;
