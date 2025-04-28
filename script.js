// Päälogiikka: kamera & EmailJS

document.addEventListener('DOMContentLoaded', () => {
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

  // Käynnistä kamera
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

  // Ota kuva rajatusta aukosta
  captureBtn.addEventListener('click', () => {
    const frameW = cameraFrame.clientWidth;
    const frameH = cameraFrame.clientHeight;
    const ratio  = 0.8;
    const cropW  = frameW * ratio;
    const cropH  = cropW / 1.586;
    const offsetX = (frameW - cropW) / 2;
    const offsetY = (frameH - cropH) / 2;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const scaleX = vw / frameW;
    const scaleY = vh / frameH;

    const sx = offsetX * scaleX;
    const sy = offsetY * scaleY;
    const sw = cropW * scaleX;
    const sh = cropH * scaleY;

    canvas.width  = Math.round(cropW);
    canvas.height = Math.round(cropH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    preview.innerHTML = `<img src="${dataUrl}">`;
    cardInput.value = dataUrl;

    // Sammuta kamera
    stream.getTracks().forEach(t => t.stop());
    captureBtn.disabled = true;
    openCameraBtn.textContent = 'Ota uusi kuva tarvittaessa';
    openCameraBtn.disabled = false;
  });

  // Lähetä lomake EmailJS:llä
  form.addEventListener('submit', event => {
    event.preventDefault();
    const templateParams = {
      firstName: firstNameInput.value.trim(),
      lastName:  lastNameInput.value.trim(),
      cardImage: cardInput.value
    };
    emailjs.send('service_bvdu9lj', 'valttikortti_template', templateParams)
      .then(() => {
        alert('Lomake lähetetty sähköpostitse!');
        form.reset();
        preview.innerHTML = '';
        openCameraBtn.textContent = 'Avaa kamera';
      }, error => {
        console.error('EmailJS error:', error);
        alert('Sähköpostin lähetys epäonnistui.');
      });
  });
});
