import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getStorage, ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Alusta Firebase
const app     = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db      = getFirestore(app);

// Elementtien hakeminen
const openCameraBtn = document.getElementById('openCamera');
const captureBtn    = document.getElementById('capture');
const cameraFrame   = document.getElementById('cameraFrame');
const preview       = document.getElementById('preview');
const cardInput     = document.getElementById('cardImageInput');
const firstNameInput= document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const form          = document.getElementById('card-form');

let video, stream;
const canvas = document.createElement('canvas');

// Kamera päälle ja korttikuvan rajaus
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

captureBtn.addEventListener('click', () => {
  const frameW = cameraFrame.clientWidth;
  const frameH = cameraFrame.clientHeight;
  const innerRatio = 0.8;
  const cropWFrame  = frameW * innerRatio;
  const cropHFrame  = cropWFrame / 1.586;
  const offsetXFrame = (frameW - cropWFrame) / 2;
  const offsetYFrame = (frameH - cropHFrame) / 2;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scaleX = vw / frameW;
  const scaleY = vh / frameH;

  const sx = offsetXFrame * scaleX;
  const sy = offsetYFrame * scaleY;
  const sw = cropWFrame * scaleX;
  const sh = cropHFrame * scaleY;

  canvas.width  = Math.round(cropWFrame);
  canvas.height = Math.round(cropHFrame);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  preview.innerHTML = `<img src="${dataUrl}">`;
  cardInput.value = dataUrl;

  // Sammuta kamera ja päivitä nappi
  stream.getTracks().forEach(t => t.stop());
  captureBtn.disabled = true;
  openCameraBtn.textContent = 'Ota uusi kuva tarvittaessa';
  openCameraBtn.disabled = false;
});

// Lomakkeen lähetys Firebaseen
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
    form.reset(); preview.innerHTML = '';
    openCameraBtn.textContent = 'Avaa kamera';
  } catch (err) {
    console.error(err);
    alert('Virhe lähetyksessä: ' + err.message);
  }
});
