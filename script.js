document.addEventListener('DOMContentLoaded', ()=>{
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
  document.getElementById('clear-signature').addEventListener('click', ()=>{ signaturePad.clear(); });
  // Image preview
  const valttiInput = document.getElementById('valttikuva');
  const valttiPreview = document.getElementById('valttiPreview');
  valttiInput.addEventListener('change', e=>{
    const file = e.target.files[0];
    if(file){
      valttiPreview.src = URL.createObjectURL(file);
      valttiPreview.classList.remove('hidden');
    }
  });
  // Harjoittelija kenttä visible
  const rooli = document.getElementById('rooli');
  const harjoKentta = document.getElementById('harjoKentta');
  rooli.addEventListener('change', ()=> {
    harjoKentta.classList.toggle('hidden', rooli.value !== 'Harjoittelija');
  });
  // Kansalaisuus link
  const kansalaisuus = document.getElementById('kansalaisuus');
  const foreignLink = document.getElementById('foreignLink');
  kansalaisuus.addEventListener('input', ()=> {
    foreignLink.classList.toggle('hidden', kansalaisuus.value === 'Suomi');
  });
  // Navigation
  function showStep(){
    step1.style.display = step===1 ? 'block' : 'none';
    step2.style.display = step===2 ? 'block' : 'none';
    nextBtn.classList.toggle('hidden', step!==1);
    prevBtn.classList.toggle('hidden', step!==2);
    submitBtn.classList.toggle('hidden', step!==2);
  }
  showStep();
  nextBtn.addEventListener('click', ()=>{
    if(form.checkValidity()){ step=2; showStep(); }
    else form.reportValidity();
  });
  prevBtn.addEventListener('click', ()=>{ step=1; showStep(); });
  // Submit
  submitBtn.addEventListener('click', async ()=>{
    if(signaturePad.isEmpty()){ alert('Ole hyvä ja allekirjoita lomake.'); return; }
    const formData = new FormData(form);
    const dataURL = signaturePad.toDataURL();
    const blob = await (await fetch(dataURL)).blob();
    formData.append('signature', blob, 'signature.png');
    fetch(form.action, { method:'POST', body: formData })
      .then(res=>{
        if(res.ok){
          successMessage.style.display = 'flex';
          setTimeout(()=>{
            successMessage.style.display = 'none';
            form.reset();
            signaturePad.clear();
            step = 1; showStep();
            valttiPreview.classList.add('hidden');
          }, 5000);
        } else alert('Lähetyksessä tapahtui virhe. Yritä uudelleen.');
      }).catch(()=> alert('Lähetyksessä tapahtui virhe. Yritä uudelleen.'));
  });
});
