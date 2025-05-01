document.addEventListener('DOMContentLoaded', () => {
  let step = 1;
  const form = document.getElementById('perehdytyslomake');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');
  const successMessage = document.getElementById('successMessage');

  // Signature Pad
  const canvas = document.getElementById('signature-pad');
  const signaturePad = new SignaturePad(canvas);
  document.getElementById('clear-signature').addEventListener('click', () => {
    signaturePad.clear();
  });

  // Valttikorttikuvan esikatselu
  const valttiInput = document.getElementById('valttikuva');
  const valttiPreview = document.getElementById('valttiPreview');
  valttiInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      valttiPreview.src = URL.createObjectURL(file);
      valttiPreview.classList.remove('hidden');
    }
  });

  // Harjoittelijan kenttä näkyviin, jos rooli = Harjoittelija
  const rooli = document.getElementById('rooli');
  const harjoKentta = document.getElementById('harjoKentta');
  rooli.addEventListener('change', () => {
    harjoKentta.classList.toggle('hidden', rooli.value !== 'Harjoittelija');
  });

  // Kansalaisuus-linkki näkyviin, jos muu kuin Suomi
  const kansalaisuus = document.getElementById('kansalaisuus');
  const foreignLink = document.getElementById('foreignLink');
  kansalaisuus.addEventListener('input', () => {
    foreignLink.classList.toggle('hidden', kansalaisuus.value === 'Suomi');
  });

  // Vaiheiden näyttö
  function showStep() {
    step1.style.display = step === 1 ? 'block' : 'none';
    step2.style.display = step === 2 ? 'block' : 'none';
    nextBtn.classList.toggle('hidden', step !== 1);
    prevBtn.classList.toggle('hidden', step !== 2);
    submitBtn.classList.toggle('hidden', step !== 2);
  }
  showStep();

  // Next / Prev
  nextBtn.addEventListener('click', () => {
    if (form.checkValidity()) {
      step = 2;
      showStep();
    } else {
      form.reportValidity();
    }
  });
  prevBtn.addEventListener('click', () => {
    step = 1;
    showStep();
  });

  // Lähetä lomake Apps Scriptiin
  submitBtn.addEventListener('click', async () => {
    // Varmista allekirjoitus
    if (signaturePad.isEmpty()) {
      alert('Ole hyvä ja allekirjoita lomake.');
      return;
    }

    // Kerää lomakedata
    const formData = new FormData(form);

    // Allekirjoitus blobiksi
    const dataURL = signaturePad.toDataURL();
    const blob = await (await fetch(dataURL)).blob();
    formData.append('signature', blob, 'signature.png');

    // POST-pyyntö
    fetch(form.action, {
      method: 'POST',
      body: formData
    })
    .then(async res => {
      const text = await res.text();
      if (res.ok) {
        successMessage.style.display = 'flex';
        setTimeout(() => {
          successMessage.style.display = 'none';
          form.reset();
          signaturePad.clear();
          step = 1;
          showStep();
          valttiPreview.classList.add('hidden');
        }, 5000);
      } else {
        console.error('Server response:', text);
        alert('Lähetyksessä tapahtui virhe: ' + text);
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      alert('Lähetyksessä tapahtui virhe, tarkista konsoli.');
    });
  });
});
