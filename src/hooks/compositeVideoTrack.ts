export function createCompositeTrack(
  screenStream: MediaStream,
  webcamStream: MediaStream
): MediaStreamTrack {

  const screenTrack = screenStream.getVideoTracks()[0];
  const webcamTrack = webcamStream.getVideoTracks()[0];

  // Ekran çözünürlüğünü al
  const settings = screenTrack.getSettings();
  const width = settings.width || 1920;
  const height = settings.height || 1080;

  // Canvas oluştur
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Canvas'tan video track üret
  const compositeStream = canvas.captureStream(30);
  const compositeTrack = compositeStream.getVideoTracks()[0];

  // Ekran ve webcam video elementleri
  const screenVideo = document.createElement("video");
  screenVideo.srcObject = new MediaStream([screenTrack]);
  screenVideo.play();

  const webcamVideo = document.createElement("video");
  webcamVideo.srcObject = new MediaStream([webcamTrack]);
  webcamVideo.play();

  // PiP boyutu ve pozisyonu
  const webcamSize = Math.floor(width * 0.20);
  const margin = 20;

  function draw() {
    // Ekranı çiz
    ctx.drawImage(screenVideo, 0, 0, width, height);

    // Webcam PiP çiz
    ctx.drawImage(
      webcamVideo,
      width - webcamSize - margin,
      height - webcamSize - margin,
      webcamSize,
      webcamSize
    );

    requestAnimationFrame(draw);
  }

  draw();

  return compositeTrack;
}
