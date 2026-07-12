export async function createCompositeTrack(screenStream: MediaStream, webcamStream: MediaStream) {
  const screenTrack = screenStream.getVideoTracks()[0];
  const webcamTrack = webcamStream.getVideoTracks()[0];

  const screenProcessor = new MediaStreamTrackProcessor({ track: screenTrack });
  const webcamProcessor = new MediaStreamTrackProcessor({ track: webcamTrack });

  const screenReader = screenProcessor.readable.getReader();
  const webcamReader = webcamProcessor.readable.getReader();

  const canvas = new OffscreenCanvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  const compositeStream = canvas.captureStream(30);
  const compositeTrack = compositeStream.getVideoTracks()[0];

  async function loop() {
    const screenFrame = await screenReader.read();
    const webcamFrame = await webcamReader.read();

    if (screenFrame.done || webcamFrame.done) return;

    const sFrame = screenFrame.value;
    const wFrame = webcamFrame.value;

    ctx.drawImage(sFrame, 0, 0, canvas.width, canvas.height);

    const webcamSize = 300;
    ctx.drawImage(
      wFrame,
      canvas.width - webcamSize - 20,
      canvas.height - webcamSize - 20,
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
