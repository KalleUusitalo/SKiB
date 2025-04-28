import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getStorage, ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Firebase
const app     = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db      = getFirestore(app);

// DOM
const openCameraBtn = document.getElementById('openCamera');
const captureBtn    = document.getElementById('capture');
const cameraFrame   = document.getElementById('cameraFrame');
const preview       = document.getElementById('preview');
const cardInput     = document.getElementById('cardImageInput');
const firstNameInput= document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const form          = document.getElementById('card-form');

const nfcBtn        = document.getElementById('readNfc');
const nfcResult     = document.getElementById('nfcResult');

const startScanBtn  = document.getElementById('startScan');
const barcodeVideo  = document.getElementById('barcodeVideo');
const barcodeResult = document.getElementById('barcodeResult');

let video, stream;
const canvas = document.createElement('canvas');

// 1) Kamera & korttikuvan rajaus
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

  stream.getTracks().forEach(t => t.stop());
  captureBtn.disabled = true;
  openCameraBtn.textContent = 'Ota uusi kuva tarvittaessa';
  openCameraBtn.disabled = false;
});

// 2) NFC-luku (Android Chrome)
if ('NDEFReader' in window) {
  nfcBtn.addEventListener('click', async () => {
    try {
      nfcBtn.disabled = true;
      nfcResult.textContent = 'Odota NFC-korttia…';
      const ndef = new NDEFReader();
      await ndef.scan();
      ndef.onreading = event => {
        const decoder = new TextDecoder();
        let out = '';
        for (const rec of event.message.records) {
          out += `${rec.recordType}: ${rec.recordType==='text'?decoder.decode(rec.data):'[binääri]'}\n`;
        }
        nfcResult.textContent = out.trim() || 'Ei luettavia tietueita';
        nfcBtn.disabled = false;
      };
      ndef.onreadingerror = () => {
        nfcResult.textContent = 'Virhe lukemisessa';
        nfcBtn.disabled = false;
      };
    } catch(err) {
      nfcResult.textContent = 'NFC epäonnistui: ' + err;
      nfcBtn.disabled = false;
    }
  });
} else {
  nfcBtn.disabled = true;
  nfcResult.textContent = 'Web NFC ei ole tuettu tässä selaimessa.';
}

// 3) Viivakoodin skannaus QuaggaJS
let scanning = false;
startScanBtn.addEventListener('click', () => {
  if (scanning) {
    Quagga.stop();
    barcodeVideo.srcObject.getTracks().forEach(t=>t.stop());
    startScanBtn.textContent = 'Käynnistä viivakoodin skannaus';
    scanning = false;
    return;
  }
  scanning = true;
  startScanBtn.textContent = 'Lopeta skannaus';
  Quagga.init({
    inputStream: { name:'Live', type:'LiveStream', target:barcodeVideo, constraints:{ facingMode:'environment'} },
    decoder:{ readers:['ean_reader','code_128_reader'] },
    locate:true
  }, err => {
    if (err) console.error(err);
    else Quagga.start();
  });
  Quagga.onDetected(data => {
    barcodeResult.textContent = 'Löytyi koodi: ' + data.codeResult.code;
    Quagga.stop();
    barcodeVideo.srcObject.getTracks().forEach(t=>t.stop());
    startScanBtn.textContent = 'Käynnistä viivakoodin skannaus';
    scanning = false;
  });
});

// 4) Lomakkeen tallennus Firebaseen
form.addEventListener('submit', async e => {
  e.preventDefault();
  const firstName = firstNameInput.value.trim();
  const lastName  = lastNameInput.value.trim();
  const dataUrl    = cardInput.value;
  if (!firstName||!lastName||!dataUrl) { alert('Täytä kaikki kentät ja ota kuva'); return; }
  try {
    const storageRef = ref(storage, `cards/${firstName}_${lastName}_${Date.now()}.jpg`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db,'cards'),{ firstName, lastName, imageUrl:url, timestamp:Date.now() });
    alert('Lomake lähetetty!');
    form.reset(); preview.innerHTML=''; openCameraBtn.textContent='Avaa kamera';
  } catch(err) {
    console.error(err);
    alert('Virhe lähetyksessä: ' + err.message);
  }
});
