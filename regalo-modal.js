/* ===== Modal de Regalos (módulo reutilizable) =====
   Para usarlo en otra invitación:
   1) Copiar regalo-modal.css, regalo-modal.js y regalo-fondo.jpg a la carpeta.
   2) Enlazar regalo-modal.css en el head (etiqueta link).
   3) Cargar regalo-modal.js al final del body, despues de java2.js.
   4) El botón de regalos llama a openGiftModal()  (o showGifts()). */
(function () {
    const REGALO = {
        tipoCuenta: 'Cuenta corriente',
        numeroCuenta: '001001001',
        cedula: '0010001002003',
        mesaRegalosUrl: 'http://invitavale.com/Lista-de-regalo-de-boda/'
    };

    const ICON_COPY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    const ICON_CHECK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
    const ICON_BANK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>';
    const ICON_GIFT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';

    function row(label, value) {
        return '<div class="rg-row"><div class="rg-row-text"><span class="rg-label">' + label +
            '</span><span class="rg-value">' + value + '</span></div>' +
            '<button type="button" class="rg-copy" data-copy="' + value + '" aria-label="Copiar ' + label + '">' + ICON_COPY + '</button></div>';
    }

    function build() {
        if (document.getElementById('rgOverlay')) return;
        const html =
            '<div id="rgOverlay" class="rg-overlay" role="dialog" aria-modal="true" aria-label="Regalos">' +
              '<div class="rg-sheet">' +
                '<button type="button" class="rg-close" data-rg="close" aria-label="Cerrar">&times;</button>' +
                '<div class="rg-choose" id="rgChoose">' +
                  '<div class="rg-title">Regalos</div>' +
                  '<p class="rg-sub">Tu presencia es nuestro mejor regalo. Si deseas tener un detalle con nosotros:</p>' +
                  '<button type="button" class="rg-option" data-rg="bank">' +
                    '<span class="rg-option-icon">' + ICON_BANK + '</span>' +
                    '<span class="rg-option-text"><strong>Datos bancarios</strong><span>Transferencia o depósito</span></span>' +
                    '<span class="rg-option-arrow">›</span></button>' +
                  '<button type="button" class="rg-option" data-rg="mesa">' +
                    '<span class="rg-option-icon">' + ICON_GIFT + '</span>' +
                    '<span class="rg-option-text"><strong>Mesa de regalos</strong><span>Ver nuestra lista de regalos</span></span>' +
                    '<span class="rg-option-arrow">›</span></button>' +
                '</div>' +
                '<div class="rg-bank rg-hidden" id="rgBank">' +
                  '<button type="button" class="rg-back" data-rg="back">‹ Volver</button>' +
                  '<div class="rg-bank-card">' +
                    '<div class="rg-title">Datos Bancarios</div>' +
                    row('Tipo de cuenta', REGALO.tipoCuenta) +
                    row('Número de cuenta', REGALO.numeroCuenta) +
                    row('Cédula', REGALO.cedula) +
                    '<p class="rg-note">¡Gracias por tu cariño!</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div id="rgToast" class="rg-toast">Copiado ✓</div>';
        document.body.insertAdjacentHTML('beforeend', html);

        const overlay = document.getElementById('rgOverlay');
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) return closeGiftModal();
            const btn = e.target.closest('[data-rg],[data-copy]');
            if (!btn) return;
            if (btn.dataset.copy !== undefined) return copyValue(btn);
            const a = btn.dataset.rg;
            if (a === 'close') closeGiftModal();
            else if (a === 'bank') showStep('bank');
            else if (a === 'back') showStep('choose');
            else if (a === 'mesa') window.open(REGALO.mesaRegalosUrl, '_blank', 'noopener');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeGiftModal();
        });
    }

    function showStep(step) {
        document.getElementById('rgChoose').classList.toggle('rg-hidden', step !== 'choose');
        document.getElementById('rgBank').classList.toggle('rg-hidden', step !== 'bank');
    }

    function copyValue(btn) {
        const text = btn.dataset.copy;
        const done = function () {
            btn.classList.add('copied');
            btn.innerHTML = ICON_CHECK;
            const t = document.getElementById('rgToast');
            t.classList.add('show');
            setTimeout(function () {
                btn.classList.remove('copied');
                btn.innerHTML = ICON_COPY;
                t.classList.remove('show');
            }, 1600);
        };
        const fallback = function () {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, text.length);
            try { document.execCommand('copy'); } catch (_) {}
            document.body.removeChild(ta);
            done();
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, fallback);
        } else {
            fallback();
        }
    }

    function openGiftModal() {
        build();
        showStep('choose');
        document.getElementById('rgOverlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeGiftModal() {
        const o = document.getElementById('rgOverlay');
        if (!o) return;
        o.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.openGiftModal = openGiftModal;
    window.closeGiftModal = closeGiftModal;
    window.showGifts = openGiftModal; // compatibilidad con onclick="showGifts()"
})();
