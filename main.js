const video = document.getElementById('video'); 
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ===============================
// リング画像
// ===============================
const blueRingImg = new Image();
blueRingImg.src = "./models/blueR_5784.PNG";

const orangeRingImg = new Image();
orangeRingImg.src = "./models/orangeR_5785.PNG";

const paraRingImg = new Image();
paraRingImg.src = "./models/IMG_6110.PNG";

const emeRingImg = new Image();
emeRingImg.src = "./models/IMG_6113.PNG";

const ydRingImg = new Image();
ydRingImg.src = "./models/IMG_6112.PNG";

const zirRingImg = new Image();
zirRingImg.src = "./models/IMG_6111.PNG";

const opRingImg = new Image();
opRingImg.src = "./models/IMG_6109.PNG";

// ===============================
// ネックレス画像
// ===============================
const necImg1 = new Image();
necImg1.src = "./models/IMG_6158.PNG";

const necImg2 = new Image();
necImg2.src = "./models/IMG_6161.PNG";

// ===============================
// 現在選択中
// ===============================
let currentRingImg = blueRingImg;
let currentNecklaceImg = null;

// ===============================
// カメラ制御
// ===============================
let currentStream = null;
let currentFacingMode = "environment";

// スムージング
let smoothX = 0;
let smoothY = 0;
let smoothAngle = 0;

// ネックレス用
let poseLandmarks = null;

// ===============================
// カメラ起動
// ===============================
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

// ===============================
// カメラ切替ボタン
// ===============================
const switchBtn = document.createElement("button");
switchBtn.innerText = "カメラ切替";
switchBtn.style.position = "absolute";
switchBtn.style.top = "20px";
switchBtn.style.right = "20px";
switchBtn.style.zIndex = "10";
document.body.appendChild(switchBtn);

switchBtn.onclick = () => {
  currentFacingMode =
    currentFacingMode === "user" ? "environment" : "user";
  startCamera(currentFacingMode);
};

// ===============================
// ネックレスUI（リングの上）
// ===============================
const necklaceSelector = document.createElement("div");
necklaceSelector.style.position = "absolute";
necklaceSelector.style.bottom = "90px";
necklaceSelector.style.left = "50%";
necklaceSelector.style.transform = "translateX(-50%)";
necklaceSelector.style.display = "flex";
necklaceSelector.style.gap = "10px";
necklaceSelector.style.zIndex = "10";
document.body.appendChild(necklaceSelector);

// OFF
const offN = document.createElement("button");
offN.innerText = "OFF";
offN.style.padding = "10px";
offN.onclick = () => currentNecklaceImg = null;
necklaceSelector.appendChild(offN);

// N1
const n1 = document.createElement("button");
n1.innerText = "N1";
n1.style.padding = "10px";
n1.onclick = () => currentNecklaceImg = necImg1;
necklaceSelector.appendChild(n1);

// N2
const n2 = document.createElement("button");
n2.innerText = "N2";
n2.style.padding = "10px";
n2.onclick = () => currentNecklaceImg = necImg2;
necklaceSelector.appendChild(n2);

// ===============================
// リングUI
// ===============================
const ringSelector = document.createElement("div");
ringSelector.style.position = "absolute";
ringSelector.style.bottom = "20px";
ringSelector.style.left = "50%";
ringSelector.style.transform = "translateX(-50%)";
ringSelector.style.display = "flex";
ringSelector.style.gap = "10px";
ringSelector.style.zIndex = "10";
document.body.appendChild(ringSelector);

function addBtn(label, img) {
  const btn = document.createElement("button");
  btn.innerText = label;
  btn.style.padding = "10px";
  btn.onclick = () => currentRingImg = img;
  ringSelector.appendChild(btn);
}

addBtn("①", blueRingImg);
addBtn("②", orangeRingImg);
addBtn("③", paraRingImg);
addBtn("④", emeRingImg);
addBtn("⑤", ydRingImg);
addBtn("⑥", zirRingImg);
addBtn("⑦", opRingImg);

// ===============================
// MediaPipe Hands
// ===============================
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

// ===============================
// MediaPipe Pose
// ===============================
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

pose.onResults(results => {
  poseLandmarks = results.poseLandmarks || null;
});

// ===============================
// Hands結果
// ===============================
hands.onResults(results => {

  if (!video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // ===========================
  // リング
  // ===========================
  if (results.multiHandLandmarks?.length > 0) {

    const lm = results.multiHandLandmarks[0];

    const p13 = lm[13];
    const p14 = lm[14];

    const x = (p13.x + p14.x) / 2 * canvas.width;
    const y = (p13.y + p14.y) / 2 * canvas.height;

    const dx = p14.x - p13.x;
    const dy = p14.y - p13.y;

    const angle = Math.atan2(dy, dx);

    smoothX += (x - smoothX) * 0.5;
    smoothY += (y - smoothY) * 0.5;
    smoothAngle += (angle - smoothAngle) * 0.5;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const size = dist * canvas.width * 0.7;

    ctx.save();
    ctx.translate(smoothX, smoothY);
    ctx.rotate(smoothAngle + Math.PI / 2);

    ctx.drawImage(
      currentRingImg,
      -size / 2,
      -size / 2,
      size,
      size
    );

    ctx.restore();
  }

  // ===========================
  // ネックレス
  // ===========================
  if (poseLandmarks && currentNecklaceImg) {

    const l = poseLandmarks[11];
    const r = poseLandmarks[12];

    const lx = l.x * canvas.width;
    const ly = l.y * canvas.height;
    const rx = r.x * canvas.width;
    const ry = r.y * canvas.height;

    const cx = (lx + rx) / 2;
    const cy = (ly + ry) / 2 + 40;

    const dx = rx - lx;
    const dy = ry - ly;

    const angle = Math.atan2(dy, dx);

    const width = Math.sqrt(dx * dx + dy * dy) * 1.8;
    const aspect = currentNecklaceImg.height / currentNecklaceImg.width;
    const height = width * aspect;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.drawImage(
      currentNecklaceImg,
      -width / 2,
      -height / 4,
      width,
      height
    );

    ctx.restore();
  }
});

// ===============================
// ループ
// ===============================
async function renderLoop() {

  if (video.readyState >= 2) {

    await Promise.all([
      hands.send({ image: video }),
      pose.send({ image: video })
    ]);
  }

  requestAnimationFrame(renderLoop);
}

renderLoop();
