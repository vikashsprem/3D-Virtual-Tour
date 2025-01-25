import React from "react";
import PointCloudViewerWithWebcam from "./components/PointCloudViewer";
import WebcamStream from "./components/WebcamStream";

const App = () => {
  const plyFilePath = "./scaniverse-model62.ply";

  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "20px" }}>
      <div style={{ width: "45%" }}>
        <h2>Camera Stream</h2>
        <WebcamStream/>
      </div>
      <div style={{ width: "45%" }}>
        <h2>Point Cloud Viewer</h2>
        <PointCloudViewerWithWebcam plyFilePath={plyFilePath}/>
      </div>
    </div>
  );
};

export default App;
