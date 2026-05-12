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
// ★ ネックレス画像
// ========================================

const necImg = new Image();
necImg.src = "./models/nec.PNG";

const necklaceImg = new Image();
necklaceImg.src = "./models/neclace.PNG";

// ========================================
// 現在選択中リング
// ========================================

let currentRingImg = blueRingImg;

// ========================================
// ★ 現在選択中ネックレス
// null = ネックレス無し
// ========================================

let currentNecklaceImg = null;

// ========================================
// カメラ制御
// ========================================

let currentStream = null;
let currentFacingMode = "environment";

// ========================================
// リング用スムージング
// ========================================

let smoothX = 0;
let smoothY = 0;
let smoothAngle = 0;

// ========================================
// ★ ネックレス用スムージング
// ========================================

let smoothNeckX = 0;
let smoothNeckY = 0;
let smoothNeckAngle = 0;
let smoothNeckWidth = 0;

// ========================================
// カメラ開始
// ========================================

async function startCamera(facingMode) {

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: facingMode } }
    });

    video.srcObject = stream;
    currentStream = stream;

  } catch (e) {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode }
    });

    video.srcObject = stream;
    currentStream = stream;
  }
}

startCamera(currentFacingMode);

// ========================================
// カメラ切替ボタン
// ========================================

const switchBtn = document.createElement("button");

switchBtn.innerText = "カメラ切替";

switchBtn.style.position = "absolute";
switchBtn.style.top = "20px";
switchBtn.style.right = "20px";
switchBtn.style.zIndex = "10";
switchBtn.style.padding = "10px";

document.body.appendChild(switchBtn);

switchBtn.addEventListener("click", () => {

  currentFacingMode =
    currentFacingMode === "user"
      ? "environment"
      : "user";

  startCamera(currentFacingMode);
});

// ========================================
// リング選択UI
// ========================================

const ringSelector = document.createElement("div");

ringSelector.style.position = "absolute";
ringSelector.style.bottom = "20px";
ringSelector.style.left = "50%";
ringSelector.style.transform = "translateX(-50%)";
ringSelector.style.display = "flex";
ringSelector.style.gap = "10px";
ringSelector.style.zIndex = "10";

document.body.appendChild(ringSelector);

// ========================================
// リングボタン生成関数
// ========================================

function createRingButton(label, img) {

  const btn = document.createElement("button");

  btn.innerText = label;
  btn.style.padding = "10px";

  btn.addEventListener("click", () => {
    currentRingImg = img;
  });

  ringSelector.appendChild(btn);
}

// ========================================
// リングボタン
// ========================================

createRingButton("リング①", blueRingImg);
createRingButton("リング②", orangeRingImg);

// ========================================
// ★ ネックレス選択UI
// ========================================

const necklaceSelector = document.createElement("div");

necklaceSelector.style.position = "absolute";
necklaceSelector.style.bottom = "80px";
necklaceSelector.style.left = "50%";
necklaceSelector.style.transform = "translateX(-50%)";
necklaceSelector.style.display = "flex";
necklaceSelector.style.gap = "10px";
necklaceSelector.style.zIndex = "10";

document.body.appendChild(necklaceSelector);

// ========================================
// ★ ネックレスボタン生成関数
// ========================================

function createNecklaceButton(label, img) {

  const btn = document.createElement("button");

  btn.innerText = label;
  btn.style.padding = "10px";

  btn.addEventListener("click", () => {

    // ボタン押下でネックレス変更
    currentNecklaceImg = img;
  });

  necklaceSelector.appendChild(btn);
}

// ========================================
// ★ ネックレス無しボタン
// ========================================

const offBtn = document.createElement("button");

offBtn.innerText = "ネックレスOFF";
offBtn.style.padding = "10px";

offBtn.addEventListener("click", () => {

  // ネックレス消去
  currentNecklaceImg = null;
});

necklaceSelector.appendChild(offBtn);

// ========================================
// ★ ネックレスボタン
// ========================================

createNecklaceButton("①", necImg);
createNecklaceButton("②", necklaceImg);

// ========================================
// MediaPipe Hands
// ========================================

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ========================================
// ★ MediaPipe Pose
// ========================================

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ========================================
// Hands結果
// ========================================

hands.onResults(results => {

  if (!video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // カメラ描画
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // ========================================
  // リング描画
  // ========================================

  if (
    results.multiHandLandmarks &&
    results.multiHandLandmarks.length > 0
  ) {

    const landmarks = results.multiHandLandmarks[0];

    const p13 = landmarks[13];
    const p14 = landmarks[14];

    const x =
      (p13.x + p14.x) / 2 * canvas.width;

    const y =
      (p13.y + p14.y) / 2 * canvas.height;

    const smoothFactor = 0.5;

    smoothX += (x - smoothX) * smoothFactor;
    smoothY += (y - smoothY) * smoothFactor;

    const dx = p14.x - p13.x;
    const dy = p14.y - p13.y;

    const angle = Math.atan2(dy, dx);

    smoothAngle +=
      (angle - smoothAngle) * smoothFactor;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    const ringSize =
      distance * canvas.width * 0.7;

    ctx.save();

    ctx.translate(smoothX, smoothY);

    ctx.rotate(smoothAngle + Math.PI / 2);

    ctx.drawImage(
      currentRingImg,
      -ringSize / 2,
      -ringSize / 2,
      ringSize,
      ringSize
    );

    ctx.restore();
  }
});

// ========================================
// ★ Pose結果
// ネックレス描画
// ========================================

pose.onResults(results => {

  // ネックレス未選択なら終了
  if (!currentNecklaceImg) return;

  if (!results.poseLandmarks) return;

  const landmarks = results.poseLandmarks;

  // 左右肩
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  // Canvas座標
  const lx = leftShoulder.x * canvas.width;
  const ly = leftShoulder.y * canvas.height;

  const rx = rightShoulder.x * canvas.width;
  const ry = rightShoulder.y * canvas.height;

  // 首中心
  const centerX = (lx + rx) / 2;
  const centerY = (ly + ry) / 2 + 40;

  // 肩幅
  const shoulderWidth =
    Math.hypot(rx - lx, ry - ly);

  // ネックレスサイズ
  const necklaceWidth =
    shoulderWidth * 1.8;

  // 比率維持
  const aspect =
    currentNecklaceImg.height /
    currentNecklaceImg.width;

  const necklaceHeight =
    necklaceWidth * aspect;

  // 回転
  const angle =
    Math.atan2(ry - ly, rx - lx);

  // スムージング
  const smoothFactor = 0.35;

  smoothNeckX +=
    (centerX - smoothNeckX) * smoothFactor;

  smoothNeckY +=
    (centerY - smoothNeckY) * smoothFactor;

  smoothNeckAngle +=
    (angle - smoothNeckAngle) * smoothFactor;

  smoothNeckWidth +=
    (necklaceWidth - smoothNeckWidth) * smoothFactor;

  // 描画
  ctx.save();

  ctx.translate(
    smoothNeckX,
    smoothNeckY
  );

  ctx.rotate(smoothNeckAngle);

  ctx.drawImage(
    currentNecklaceImg,
    -smoothNeckWidth / 2,
    -necklaceHeight / 4,
    smoothNeckWidth,
    necklaceHeight
  );

  ctx.restore();
});

// ========================================
// フレーム処理
// ========================================

async function renderLoop() {

  if (video.readyState >= 2) {

    // Hands
    await hands.send({ image: video });

    // Pose
    await pose.send({ image: video });
  }

  requestAnimationFrame(renderLoop);
}

renderLoop();