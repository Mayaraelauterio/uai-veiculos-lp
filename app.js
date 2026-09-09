(function(){
  // ---- paises suportados (BR primeiro; demais cobrem a diaspora brasileira) ----
  var PAISES = [
    { iso: 'BR', nome: 'Brasil',           ddi: '55', bandeira: '🇧🇷', min: 10, max: 11, mascara: 'br' },
    { iso: 'PT', nome: 'Portugal',         ddi: '351', bandeira: '🇵🇹', min: 9,  max: 9,  mascara: 'simples' },
    { iso: 'US', nome: 'Estados Unidos',   ddi: '1',   bandeira: '🇺🇸', min: 10, max: 10, mascara: 'us' },
    { iso: 'PY', nome: 'Paraguai',         ddi: '595', bandeira: '🇵🇾', min: 9,  max: 9,  mascara: 'simples' },
    { iso: 'AR', nome: 'Argentina',        ddi: '54',  bandeira: '🇦🇷', min: 10, max: 11, mascara: 'simples' },
    { iso: 'UY', nome: 'Uruguai',          ddi: '598', bandeira: '🇺🇾', min: 8,  max: 9,  mascara: 'simples' },
    { iso: 'ES', nome: 'Espanha',          ddi: '34',  bandeira: '🇪🇸', min: 9,  max: 9,  mascara: 'simples' },
    { iso: 'GB', nome: 'Reino Unido',      ddi: '44',  bandeira: '🇬🇧', min: 10, max: 10, mascara: 'simples' },
    { iso: 'JP', nome: 'Japão',            ddi: '81',  bandeira: '🇯🇵', min: 10, max: 10, mascara: 'simples' }
  ];

  // ---- UTMs ----
  var CHAVES = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'];
  var params = new URLSearchParams(window.location.search);
  var utms = {};
  try { utms = JSON.parse(sessionStorage.getItem('uai_utm') || '{}'); } catch(e){}
  CHAVES.forEach(function(k){ var v = params.get(k); if (v) utms[k] = v; });
  try { sessionStorage.setItem('uai_utm', JSON.stringify(utms)); } catch(e){}

  function eventId(){ return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(new Date().getTime()) + Math.random(); }

  // ---- reveal ----
  var alvos = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && alvos.length) {
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: .12 });
    alvos.forEach(function(el){ obs.observe(el); });
  } else {
    alvos.forEach(function(el){ el.classList.add('in'); });
  }

  // ---- modal ----
  var scrollYSalvo = 0;
  window.abrirModal = function(){
    var m = document.getElementById('modal');
    scrollYSalvo = window.scrollY;
    m.classList.add('open');
    document.body.style.position = 'fixed';
    document.body.style.top = (-scrollYSalvo) + 'px';
    document.body.style.width = '100%';
    if (!window.matchMedia('(pointer:coarse)').matches) {
      var inp = m.querySelector('input[name=nome]');
      if (inp) inp.focus();
    }
  };
  window.fecharModal = function(){
    document.getElementById('modal').classList.remove('open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollYSalvo);
  };
  var modalEl = document.getElementById('modal');
  if (modalEl) {
    modalEl.addEventListener('click', function(e){ if (e.target === this) fecharModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') fecharModal(); });
  }

  // ---- sticky ----
  var stickyBtn = document.querySelector('.sticky-cta .btn');
  if (stickyBtn) {
    stickyBtn.addEventListener('click', function(e){
      e.preventDefault();
      var final_ = document.getElementById('cta-final');
      if (!final_) { abrirModal(); return; }
      var r = final_.getBoundingClientRect();
      if (r.top < window.innerHeight * 2) {
        final_.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else { abrirModal(); }
    });
  }

  // ---- mascaras por pais ----
  function formatar(digitos, pais) {
    var d = digitos.slice(0, pais.max);
    if (pais.mascara === 'br') {
      var out = '';
      if (d.length > 0) out = '(' + d.slice(0, 2);
      if (d.length >= 3) { out += ') '; var corte = d.length >= 11 ? 7 : 6; out += d.slice(2, corte); }
      if (d.length >= 7) { var corte2 = d.length >= 11 ? 7 : 6; out += '-' + d.slice(corte2); }
      return out;
    }
    if (pais.mascara === 'us') {
      var o = '';
      if (d.length > 0) o = '(' + d.slice(0, 3);
      if (d.length >= 4) o += ') ' + d.slice(3, 6);
      if (d.length >= 7) o += '-' + d.slice(6, 10);
      return o;
    }
    return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }

  function validarEmail(v) {
    var s = String(v || '').trim();
    if (s.length < 6 || s.length > 254) return false;
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(s)) return false;
    if (s.indexOf('..') >= 0) return false;
    return true;
  }

  // ---- inicializa cada formulario ----
  document.querySelectorAll('.form-lead').forEach(function(form){
    var wrap = form.querySelector('.tel-wrap');
    var btnPais = wrap.querySelector('.pais-btn');
    var lista = wrap.querySelector('.pais-lista');
    var inputTel = wrap.querySelector('input[name=whatsapp]');
    var paisAtual = PAISES[0];

    // monta o dropdown
    lista.innerHTML = PAISES.map(function(p, i){
      return '<button type="button" class="pais-opt" data-i="' + i + '">' +
        '<span class="bandeira">' + p.bandeira + '</span>' +
        '<span class="nome">' + p.nome + '</span>' +
        '<span class="ddi">+' + p.ddi + '</span></button>';
    }).join('');

    function aplicarPais(p) {
      // O rotulo acessivel precisa conter o texto visivel do botao (o DDI),
      // senao leitor de tela e comando de voz anunciam coisas diferentes.
      var botaoPais = document.querySelector('.pais-btn');
      if (botaoPais) botaoPais.setAttribute('aria-label', 'Pais: ' + p.nome + ', codigo +' + p.ddi + '. Tocar para trocar.');

      paisAtual = p;
      btnPais.querySelector('.bandeira').textContent = p.bandeira;
      btnPais.querySelector('.ddi').textContent = '+' + p.ddi;
      inputTel.placeholder = p.mascara === 'br' ? '(11) 91234-5678' : (p.mascara === 'us' ? '(555) 123-4567' : '912 345 678');
      inputTel.value = formatar(inputTel.value.replace(/\D/g, ''), p);
    }

    btnPais.addEventListener('click', function(e){
      e.stopPropagation();
      lista.hidden = !lista.hidden;
    });
    lista.addEventListener('click', function(e){
      var opt = e.target.closest('.pais-opt');
      if (!opt) return;
      aplicarPais(PAISES[Number(opt.dataset.i)]);
      lista.hidden = true;
      inputTel.focus();
    });
    document.addEventListener('click', function(){ lista.hidden = true; });

    inputTel.addEventListener('input', function(){
      inputTel.value = formatar(inputTel.value.replace(/\D/g, ''), paisAtual);
      wrap.parentElement.querySelector('.erro').style.display = 'none';
    });

    var inputEmail = form.querySelector('input[name=email]');
    inputEmail.addEventListener('input', function(){
      inputEmail.closest('.field').querySelector('.erro').style.display = 'none';
    });

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var msg = form.querySelector('.form-msg');
      var fd = new FormData(form);

      // valida nome
      var nomeVal = String(fd.get('nome') || '').trim();
      if (nomeVal.length < 2) {
        form.querySelector('input[name=nome]').focus();
        msg.textContent = 'Preenche seu nome pra gente saber com quem falar.';
        msg.className = 'form-msg err';
        return;
      }
      // valida consentimento
      if (fd.get('consentimento') !== 'on') {
        msg.textContent = 'Precisa aceitar receber o contato pra entrar na lista.';
        msg.className = 'form-msg err';
        return;
      }
      msg.textContent = ''; msg.className = 'form-msg';
      // valida e-mail
      if (!validarEmail(fd.get('email'))) {
        inputEmail.closest('.field').querySelector('.erro').style.display = 'block';
        inputEmail.focus();
        return;
      }
      // valida telefone pelo pais escolhido
      var digitos = String(fd.get('whatsapp') || '').replace(/\D/g, '');
      var telOk = digitos.length >= paisAtual.min && digitos.length <= paisAtual.max;
      if (telOk && paisAtual.iso === 'BR') {
        var ddd = parseInt(digitos.slice(0, 2), 10);
        if (ddd < 11 || ddd > 99) telOk = false;
        if (digitos.length === 11 && digitos[2] !== '9') telOk = false;
      }
      if (!telOk) {
        wrap.parentElement.querySelector('.erro').style.display = 'block';
        inputTel.focus();
        return;
      }

      btn.disabled = true; btn.textContent = 'Enviando...';
      var eid = eventId();
      var body = Object.assign({
        narrativa_slug: window.NARRATIVA_SLUG,
        nome: fd.get('nome'),
        email: fd.get('email'),
        whatsapp: '+' + paisAtual.ddi + digitos,
        pais: paisAtual.iso,
        consentimento: fd.get('consentimento') === 'on',
        empresa: fd.get('empresa'),
        event_id: eid
      }, utms);

      try {
        var r = await fetch('/api/lead', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
        if (r.ok) {
          if (typeof fbq === 'function') { try { fbq('track', 'Lead', {}, { eventID: eid }); } catch(err){} }
          window.location = '/obrigado';
        } else {
          msg.textContent = 'Não deu pra registrar agora, tenta de novo em instantes.';
          msg.className = 'form-msg err';
          btn.disabled = false; btn.textContent = 'Quero garantir minha vaga';
        }
      } catch(err) {
        msg.textContent = 'Erro de conexão, tenta de novo.';
        msg.className = 'form-msg err';
        btn.disabled = false; btn.textContent = 'Quero garantir minha vaga';
      }
    });

    aplicarPais(PAISES[0]);
  });
})();

// A barra inferior so aparece depois que o CTA do hero sai da tela.
// IntersectionObserver em vez de listener de scroll: nao roda em cada
// frame de rolagem, que e justamente o que trava scroll em celular fraco.
(function () {
  var barra = document.querySelector('.sticky-cta');
  var ctaHero = document.querySelector('[data-cta="hero"]');
  if (!barra || !ctaHero || !('IntersectionObserver' in window)) {
    if (barra) barra.classList.add('visivel');
    return;
  }
  new IntersectionObserver(function (entradas) {
    barra.classList.toggle('visivel', !entradas[0].isIntersecting);
  }, { threshold: 0 }).observe(ctaHero);
})();
