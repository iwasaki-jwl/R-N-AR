const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ========================================
// リング画像
// ========================================

const blueRingImg = new Image();
blueRingImg.src = "./models/blueR_5784.PNG";

const orangeRingImg = new Image();
orangeRingImg.src = "./models/orangeR_5785.PNG";

// ========================================
// ネックレス画像
// ========================================

const necImg = new Image();
necImg.src = "./models/IMG_6158.PNG";

const necklaceImg = new Image();
necklaceImg.src = "./models/IMG_6161.PNG";

// ========================================
// 現在選択中
// ========================================

let currentRingImg = blueRingImg;
let currentNecklaceImg = null;

// ========================================
// 検出結果保存用
// ========================================

let handLandmarks = null;
let poseLandmarks = null;

// ========================================
// カメラ
// ========================================

async function startCamera() {

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: true
    });

  video.srcObject = stream;

  video.onloadedmetadata = () => {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    renderLoop();
  };
}

startCamera();

// ========================================
// リングUI
// ========================================

const ringSelector = document.createElement("div");

ringSelector.style.position = "absolute";
ringSelector.style.bottom = "20px";
ringSelector.style.left = "50%";
ringSelector.style.transform = "translateX(-50%)";
ringSelector.style.display = "flex";
ringSelector.style.gap = "10px";

document.body.appendChild(ringSelector);

function createRingButton(label, img) {

  const btn = document.createElement("button");

  btn.innerText = label;

  btn.onclick = () => {
    currentRingImg = img;
  };

  ringSelector.appendChild(btn);
}

createRingButton("リング①", blueRingImg);
createRingButton("リング②", orangeRingImg);

// ========================================
// ネックレスUI
// ========================================

const necklaceSelector = document.createElement("div");

necklaceSelector.style.position = "absolute";
necklaceSelector.style.bottom = "80px";
necklaceSelector.style.left = "50%";
necklaceSelector.style.transform = "translateX(-50%)";
necklaceSelector.style.display = "flex";
necklaceSelector.style.gap = "10px";

document.body.appendChild(necklaceSelector);

function createNecklaceButton(label, img) {

  const btn = document.createElement("button");

  btn.innerText = label;

  btn.onclick = () => {
    currentNecklaceImg = img;
  };

  necklaceSelector.appendChild(btn);
}

// OFF
const offBtn = document.createElement("button");

offBtn.innerText = "OFF";

offBtn.onclick = () => {
  currentNecklaceImg = null;
};

necklaceSelector.appendChild(offBtn);

// ネックレス切替
createNecklaceButton("①", necImg);
createNecklaceButton("②", necklaceImg);

// ========================================
// MediaPipe Hands
// ========================================

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ========================================
// MediaPipe Pose
// ========================================

const pose = new Pose({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ========================================
// Hands結果保存
// ========================================

hands.onResults(results => {

  if (
    results.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0
  ) {

    handLandmarks =
      results.multiHandLandmarks[0];

  } else {

    handLandmarks = null;
  }
});

// ========================================
// Pose結果保存
// ========================================

pose.onResults(results => {

  if (results.poseLandmarks) {

    poseLandmarks =
      results.poseLandmarks;

  } else {

    poseLandmarks = null;
  }
});

// ========================================
// 描画ループ
// ========================================

async function renderLoop() {

  // MediaPipeへ送信
  await hands.send({ image: video });
  await pose.send({ image: video });

  // Canvasクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // カメラ映像
  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // ========================================
  // リング描画
  // ========================================

  if (handLandmarks) {

    const p13 = handLandmarks[13];
    const p14 = handLandmarks[14];

    const x =
      (p13.x + p14.x) / 2 * canvas.width;

    const y =
      (p13.y + p14.y) / 2 * canvas.height;

    const dx = p14.x - p13.x;
    const dy = p14.y - p13.y;

    const angle = Math.atan2(dy, dx);

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    const ringSize =
      distance * canvas.width * 0.7;

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(angle + Math.PI / 2);

    ctx.drawImage(
      currentRingImg,
      -ringSize / 2,
      -ringSize / 2,
      ringSize,
      ringSize
    );

    ctx.restore();
  }

  // ========================================
  // ネックレス描画
  // ========================================

  if (
    poseLandmarks &&
    currentNecklaceImg
  ) {

    const leftShoulder =
      poseLandmarks[11];

    const rightShoulder =
      poseLandmarks[12];

    const lx =
      leftShoulder.x * canvas.width;

    const ly =
      leftShoulder.y * canvas.height;

    const rx =
      rightShoulder.x * canvas.width;

    const ry =
      rightShoulder.y * canvas.height;

    const centerX = (lx + rx) / 2;
    const centerY = (ly + ry) / 2 + 40;

    const shoulderWidth =
      Math.hypot(rx - lx, ry - ly);

    const necklaceWidth =
      shoulderWidth * 1.8;

    const aspect =
      currentNecklaceImg.height /
      currentNecklaceImg.width;

    const necklaceHeight =
      necklaceWidth * aspect;

    const angle =
      Math.atan2(ry - ly, rx - lx);

    ctx.save();

    ctx.translate(centerX, centerY);

    ctx.rotate(angle);

    ctx.drawImage(
      currentNecklaceImg,
      -necklaceWidth / 2,
      -necklaceHeight / 4,
      necklaceWidth,
      necklaceHeight
    );

    ctx.restore();
  }

  requestAnimationFrame(renderLoop);
}