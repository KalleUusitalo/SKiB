import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getStorage, ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Alusta Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Elementtien hakeminen
const openCameraBtn = document.getElementById('openCamera');
const captureBtn    = document.getElementById('capture');
const cameraFrame   = document.getElementById('cameraFrame');
const preview       = document.getElementById('preview');
const cardInput     = document.getElementById('cardImageInput');
const firstNameInput= document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const form          = document.getElementById('card-form');
const canvas        = document.createElement('canvas');
let video, stream;

// Kamera päälle
openCameraBtn.addEventListener('click', async () => {
  openCameraBtn.disabled = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    cameraFrame.appendChild(video);
    video.addEventListener('loadedmetadata', () => captureBtn.disabled = false);
  } catch (err) {
    alert('Kameran avaaminen epäonnistui: ' + err.message);
    openCameraBtn.disabled = false;
  }
});

// Ota kuva
captureBtn.addEventListener('click', () => {
  const cw = cameraFrame.clientWidth;
  const ch = cameraFrame.clientHeight;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const frameRatio = cw / ch;
  let sx, sy, sw, sh;
  if (vw / vh > frameRatio) {
    sh = vh;
    sw = vh * frameRatio;
    sx = (vw - sw) / 2; sy = 0;
  } else {
    sw = vw;
    sh = vw / frameRatio;
    sx = 0; sy = (vh - sh) / 2;
  }
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  preview.innerHTML = `<img src="${dataUrl}">`;
  cardInput.value = dataUrl;
  // Sammuta kamera
  stream.getTracks().forEach(t => t.stop());
  openCameraBtn.textContent = 'Ota uusi kuva tarvittaessa';
  openCameraBtn.disabled = false;
});

// Lomakkeen käsittely ja tallennus Firebaseen
form.addEventListener('submit', async e => {
  e.preventDefault();
  const firstName = firstNameInput.value.trim();
  const lastName  = lastNameInput.value.trim();
  const dataUrl    = cardInput.value;
  if (!firstName || !lastName || !dataUrl) {
    alert('Täytä kaikki kentät ja ota kuva kortista.');
    return;
  }
  try {
    const storageRef = ref(storage, `cards/${firstName}_${lastName}_${Date.now()}.jpg`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, 'cards'), { firstName, lastName, imageUrl: url, timestamp: Date.now() });
    alert('Lomake lähetetty onnistuneesti!');
    form.reset();
    preview.innerHTML = '';
    openCameraBtn.textContent = 'Avaa kamera';
  } catch (err) {
    console.error(err);
    alert('Virhe lähetyksessä: ' + err.message);
  }
});
