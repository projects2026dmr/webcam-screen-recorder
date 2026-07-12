export async function createCompositeTrack(
  screenStream: MediaStream,
  webcamStream: MediaStream
): Promise<MediaStreamTrack> {

  const screenTrack = screenStream.getVideoTracks()[0];
  const webcamTrack = webcamStream.getVideoTracks()[0];

  const screenProcessor = new MediaStreamTrackProcessor({ track: screenTrack });
  const webcamProcessor = new MediaStreamTrackProcessor({ track: webcamTrack });

  const screenReader = screenProcessor.readable.getReader();
  const webcamReader = webcamProcessor.readable.getReader();

  // Canvas boyutu ekranın çözünürlüğüne göre ayarlanır
  const settings = screenTrack.getSettings();
  const width = settings.width || 1920;
  const height = settings.height || 1080;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const compositeStream = canvas.captureStream(30);
  const compositeTrack = compositeStream.getVideoTracks()[0];

  async function loop() {
    const screenFrame = await screenReader.read();
    const webcamFrame = await webcamReader.read();

    if (screenFrame.done || webcamFrame.done) return;

    const sFrame = screenFrame.value;
    const wFrame = webcamFrame.value;

    // Ekranı çiz
    ctx.drawImage(sFrame, 0, 0, width, height);

    // Webcam PiP boyutu
    const webcamSize = Math.floor(width * 0.20); // ekranın %20'si
    const margin = 20;

    // Webcam PiP pozisyonu (bottom-right)
    ctx.drawImage(
      wFrame,
      width - webcamSize - margin,
      height - webcamSize - margin,
      webcamSize,
      webcamSize
    );

    sFrame.close();
    wFrame.close();

    requestAnimationFrame(loop);
  }

  loop();

  return compositeTrack;
}
