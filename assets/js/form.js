(function () {
   const form = document.querySelector('.form-wrap');
   if (!form) return;

   // status UI
   let statusEl = document.getElementById('form-status');
   if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'form-status';
      statusEl.className = 'hint';
      const actions = form.querySelector('.actions');
      actions.parentNode.insertBefore(statusEl, actions.nextSibling);
   }
   const setStatus = (t, k) => {
      statusEl.textContent = t;
   };

   // chips: permitir UNA sola selección
   const chips = form.querySelectorAll('.chips-group input[type="checkbox"]');
   chips.forEach((ch) =>
      ch.addEventListener('change', (e) => {
         if (e.target.checked)
            chips.forEach((x) => {
               if (x !== e.target) x.checked = false;
            });
      })
   );
   const getProjectType = () => Array.from(chips).find((x) => x.checked)?.value || '';

   // endpoints: Netlify → PHP
   const ENDPOINTS = ['/.netlify/functions/contact', '/contact.php'];

   async function send(payload) {
      let lastErr;
      for (const url of ENDPOINTS) {
         try {
            const r = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload),
            });
            const data = await r.json().catch(() => ({}));
            if (r.ok && data.ok) return data;
            lastErr = new Error(data.error || `Failure in ${url}`);
         } catch (e) {
            lastErr = e;
         }
      }
      throw lastErr || new Error('The message could not be sent.');
   }

   form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('.btn[type="submit"]');
      const payload = {
         name: form.querySelector('#name')?.value?.trim() || '',
         email: form.querySelector('#email')?.value?.trim() || '',
         project_type: getProjectType(),
         project_description: form.querySelector('#desc')?.value?.trim() || '',
      };
      if (!payload.name || !payload.email || !payload.project_type) {
         setStatus('Complete Name, Email and Project type.', 'err');
         return;
      }
      btn.disabled = true;
      btn.style.opacity = '0.7';
      setStatus('Sending…', 'neutral');
      try {
         await send(payload);
         setStatus('Message sent successfully!', 'ok');
         form.reset();
      } catch (e) {
         setStatus(e.message || 'Error sending message.', 'err');
      } finally {
         btn.disabled = false;
         btn.style.opacity = '1';
      }
   });
})();
