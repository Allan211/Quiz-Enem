/* Quiz ENEM — lógica. Sem dependências, roda abrindo index.html (file://). */
(function () {
  'use strict';
  var B = window.BANCO;
  var app = document.getElementById('app');
  var topoInfo = document.getElementById('topo-info');
  if (!B || !B.questoes || !B.questoes.length) {
    app.innerHTML = '<div class="card"><h2>Banco de questões não encontrado</h2><p>Verifique se o arquivo <code>js/questoes.js</code> existe e está correto.</p></div>';
    return;
  }
  var TAM = B.meta.tamanhoBloco || 45;
  var blocos = [];
  for (var i = 0; i < B.questoes.length; i += TAM) blocos.push(B.questoes.slice(i, i + TAM));

  var CHAVE = 'enemquiz:' + (B.meta.titulo || '') + ':' + B.questoes.length + ':v' + (B.meta.versao || 1);
  var S = { tela: 'inicio', bloco: 0, modo: 'estudo', resp: {}, verif: {}, atual: 0, restante: 0, usado: 0, revisao: false };
  var timer = null, historico = {};

  function carregar() { try { var r = localStorage.getItem(CHAVE); if (r) historico = JSON.parse(r) || {}; } catch (e) { historico = {}; } }
  function salvarHist() { try { localStorage.setItem(CHAVE, JSON.stringify(historico)); } catch (e) {} }
  carregar();

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(seg) { var h = Math.floor(seg / 3600), m = Math.floor(seg % 3600 / 60), s = seg % 60; return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0'); }
  function Q() { return blocos[S.bloco]; }
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ---------- imagens opcionais (pasta img/) ---------- */
  function figura(nome, legenda) {
    var wrap = el('div', { class: 'fig' });
    var exts = ['png', 'jpg', 'jpeg', 'webp', 'svg'], k = 0;
    var img = new Image();
    img.alt = legenda;
    img.onerror = function () {
      k++;
      if (k < exts.length) { img.src = 'img/' + nome + '.' + exts[k]; }
      else { wrap.innerHTML = '<div class="fig-vazia">' + esc(legenda) + '<br><span class="peq">(figura não incluída — salve a imagem como <code>img/' + esc(nome) + '.png</code>)</span></div>'; }
    };
    img.onload = function () { wrap.innerHTML = ''; wrap.appendChild(img); };
    img.src = 'img/' + nome + '.' + exts[0];
    wrap.innerHTML = '<div class="fig-vazia">Carregando figura…</div>';
    return wrap;
  }

  /* ---------- tela inicial ---------- */
  function telaInicio() {
    parar(); S.tela = 'inicio'; topoInfo.textContent = '';
    var h = el('div');
    var c = el('div', { class: 'card' });
    c.innerHTML = '<h1>' + esc(B.meta.titulo) + '</h1><p class="mut">' + esc(B.meta.fonte) + ' · ' + B.questoes.length + ' questões · ' + esc(B.meta.caderno || '') + '</p>' +
      '<p>Responda no seu ritmo (modo estudo, com explicação logo após cada resposta) ou simule a prova com cronômetro (' + Math.floor(B.meta.duracaoMin / 60) + 'h' + pad(B.meta.duracaoMin % 60) + ').</p>';
    h.appendChild(c);

    var cb = el('div', { class: 'card' });
    cb.innerHTML = '<h2>1. Escolha o bloco</h2>';
    var gb = el('div', { class: 'grid2' });
    blocos.forEach(function (b, i) {
      var hst = historico['b' + i];
      var t = '<strong>Bloco ' + (i + 1) + '</strong><br><span class="mut">Questões ' + b[0].n + ' a ' + b[b.length - 1].n + ' (' + b.length + ' questões)</span>' + (hst ? '<br><span class="peq mut">Último resultado: ' + hst.acertos + '/' + hst.total + ' (' + hst.pct + '%)</span>' : '');
      var lab = el('label', { class: 'opcao' + (i === S.bloco ? ' sel' : '') }, '<input type="radio" name="bloco" value="' + i + '"' + (i === S.bloco ? ' checked' : '') + '> ' + t);
      lab.querySelector('input').addEventListener('change', function () { S.bloco = i; telaInicio(); });
      gb.appendChild(lab);
    });
    cb.appendChild(gb); h.appendChild(cb);

    var cm = el('div', { class: 'card' });
    cm.innerHTML = '<h2>2. Escolha o modo</h2>';
    var gm = el('div', { class: 'grid2' });
    [['estudo', 'Modo estudo', 'Você clica em “Verificar” e vê na hora se acertou e a explicação. Sem cronômetro.'],
     ['simulado', 'Modo simulado', 'Cronômetro de ' + Math.floor(B.meta.duracaoMin / 60) + 'h' + pad(B.meta.duracaoMin % 60) + '. Gabarito e explicações só no fim.']].forEach(function (m) {
      var lab = el('label', { class: 'opcao' + (S.modo === m[0] ? ' sel' : '') }, '<input type="radio" name="modo" value="' + m[0] + '"' + (S.modo === m[0] ? ' checked' : '') + '> <strong>' + m[1] + '</strong><br><span class="mut">' + m[2] + '</span>');
      lab.querySelector('input').addEventListener('change', function () { S.modo = m[0]; telaInicio(); });
      gm.appendChild(lab);
    });
    cm.appendChild(gm);
    var go = el('div', { class: 'linha', style: 'margin-top:16px' });
    var bt = el('button', { class: 'btn pri', type: 'button' }, 'Iniciar');
    bt.addEventListener('click', iniciar);
    go.appendChild(bt); cm.appendChild(go); h.appendChild(cm);
    app.innerHTML = ''; app.appendChild(h);
  }

  function iniciar() {
    S.resp = {}; S.verif = {}; S.atual = 0; S.revisao = false; S.usado = 0;
    S.restante = B.meta.duracaoMin * 60;
    S.tela = 'prova';
    parar();
    timer = setInterval(function () {
      S.usado++;
      if (S.modo === 'simulado') { S.restante--; if (S.restante <= 0) { finalizar(); return; } }
      atualizaTopo();
    }, 1000);
    telaQuestao();
  }
  function parar() { if (timer) { clearInterval(timer); timer = null; } }
  function atualizaTopo() {
    if (S.tela !== 'prova') return;
    var feitas = Object.keys(S.resp).length;
    if (S.modo === 'simulado') topoInfo.innerHTML = 'Respondidas ' + feitas + '/' + Q().length + ' · <span class="tempo' + (S.restante < 600 ? ' alerta' : '') + '">⏱ ' + fmt(Math.max(S.restante, 0)) + '</span>';
    else topoInfo.textContent = 'Respondidas ' + feitas + '/' + Q().length + ' · tempo ' + fmt(S.usado);
  }

  /* ---------- questão ---------- */
  function corpoQuestao(q, mostrarResultado) {
    var box = el('div');
    var cab = el('div', { class: 'qhead' });
    cab.innerHTML = '<span class="qnum">Questão ' + q.n + '</span><span class="chip ' + esc(q.disc) + '">' + esc(q.disc) + '</span><span class="mut peq">' + esc(q.tema) + '</span>';
    box.appendChild(cab);
    var en = el('div', { class: 'enun' });
    /* a figura entra antes do primeiro parágrafo curto sem pontuação final (legenda da figura); se não houver, depois do 1º parágrafo */
    var posFig = -1;
    q.paras.forEach(function (p, idx) { if (posFig < 0 && idx > 0 && idx < q.paras.length - 1 && p.length < 90 && !/[.?:]$/.test(p)) posFig = idx; });
    if (posFig < 0) posFig = Math.min(1, q.paras.length);
    q.paras.forEach(function (p, idx) {
      if (idx === posFig) en.appendChild(figura('q' + pad(q.n), 'Figura da questão ' + q.n));
      if (q.tabela && idx === q.paras.length - 1) en.appendChild(tabela(q.tabela));
      en.appendChild(el('p', { class: /Disponível em:|Acesso em:|\(adaptado\)\.?$/.test(p) && p.length < 330 ? 'fonte' : '' }, esc(p)));
    });
    box.appendChild(en);
    if (q.altsEmFigura) {
      box.appendChild(figura('q' + pad(q.n) + '-alternativas', 'Alternativas da questão ' + q.n + ' (estão em figura)'));
      box.appendChild(el('div', { class: 'nota-fig' }, 'As alternativas desta questão são figuras no site original. Marque a letra correspondente à figura.'));
    }
    return box;
  }
  function tabela(t) {
    var h = '<table class="tab"><thead><tr>' + t.cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.linhas.map(function (l) { return '<tr>' + l.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    var d = el('div'); d.innerHTML = h; return d.firstChild;
  }

  function telaQuestao() {
    S.tela = 'prova';
    var lista = Q(), q = lista[S.atual];
    var feita = !!S.verif[q.n] || S.revisao;
    var h = el('div');
    var card = el('div', { class: 'card' });
    card.appendChild(corpoQuestao(q));

    var alts = el('div', { class: 'alts' + (q.altsEmFigura ? ' fig-alts' : ''), role: 'radiogroup', 'aria-label': 'Alternativas' });
    ['A', 'B', 'C', 'D', 'E'].forEach(function (L) {
      var txt = q.alts[L.toLowerCase()];
      var b = el('button', { type: 'button', class: 'alt', 'data-l': L, role: 'radio', 'aria-checked': S.resp[q.n] === L ? 'true' : 'false' });
      b.innerHTML = '<span class="L">' + L + '</span><span>' + (q.altsEmFigura ? 'Alternativa ' + L + ' (figura)' : esc(txt)) + '</span>';
      if (S.resp[q.n] === L) b.classList.add('sel');
      if (feita) {
        b.disabled = true;
        if (L === q.gab) b.classList.add('certa');
        else if (S.resp[q.n] === L) b.classList.add('errada');
      }
      b.addEventListener('click', function () { escolher(q.n, L); });
      alts.appendChild(b);
    });
    card.appendChild(alts);

    if (feita) card.appendChild(blocoExplicacao(q));

    var nav = el('div', { class: 'linha', style: 'margin-top:16px' });
    var ant = el('button', { class: 'btn', type: 'button' }, '← Anterior'); ant.disabled = S.atual === 0;
    ant.addEventListener('click', function () { ir(S.atual - 1); });
    nav.appendChild(ant);
    if (S.modo === 'estudo' && !S.revisao && !S.verif[q.n]) {
      var v = el('button', { class: 'btn pri', type: 'button' }, 'Verificar'); v.disabled = !S.resp[q.n];
      v.addEventListener('click', function () { S.verif[q.n] = true; telaQuestao(); });
      nav.appendChild(v);
    }
    nav.appendChild(el('span', { class: 'espaco' }));
    var prox = el('button', { class: 'btn', type: 'button' }, 'Próxima →'); prox.disabled = S.atual === lista.length - 1;
    prox.addEventListener('click', function () { ir(S.atual + 1); });
    nav.appendChild(prox);
    if (S.revisao) {
      var rs = el('button', { class: 'btn pri', type: 'button' }, 'Voltar ao resultado');
      rs.addEventListener('click', function () { telaResultado(); });
      nav.appendChild(rs);
    } else {
      var fin = el('button', { class: 'btn pri', type: 'button' }, 'Finalizar');
      fin.addEventListener('click', function () {
        var falta = lista.length - Object.keys(S.resp).length;
        if (falta > 0 && !confirm('Você ainda tem ' + falta + ' questão(ões) sem resposta. Finalizar mesmo assim?')) return;
        finalizar();
      });
      nav.appendChild(fin);
    }
    card.appendChild(nav);
    h.appendChild(card);

    var cn = el('div', { class: 'card' });
    cn.innerHTML = '<h3 style="margin-top:0">Navegação</h3>';
    var g = el('div', { class: 'navgrid' });
    lista.forEach(function (x, i) {
      var cls = 'nav-n';
      if (S.revisao) cls += S.resp[x.n] ? (S.resp[x.n] === x.gab ? ' certa' : ' errada') : ' vazia';
      else if (S.verif[x.n]) cls += S.resp[x.n] === x.gab ? ' certa' : ' errada';
      else if (S.resp[x.n]) cls += ' resp';
      if (i === S.atual) cls += ' atual';
      var b = el('button', { class: cls, type: 'button', 'aria-label': 'Questão ' + x.n }, String(x.n));
      b.addEventListener('click', function () { ir(i); });
      g.appendChild(b);
    });
    cn.appendChild(g); h.appendChild(cn);
    app.innerHTML = ''; app.appendChild(h);
    atualizaTopo();
    window.scrollTo({ top: 0 });
  }

  function blocoExplicacao(q) {
    var resp = S.resp[q.n], acertou = resp === q.gab;
    var d = el('div', { class: 'expl ' + (resp ? (acertou ? 'ok' : 'er') : '') });
    var status = !resp ? '<span class="tag-er">Não respondida.</span>' : acertou ? '<span class="tag-ok">Você acertou.</span>' : '<span class="tag-er">Você marcou ' + resp + '.</span>';
    d.innerHTML = '<h3>' + status + ' Gabarito: <strong>' + q.gab + '</strong></h3>' +
      '<h3>Explicação</h3><p>' + esc(q.explicacao) + '</p>' +
      '<h3>Como chegar na resposta</h3><ol>' + q.passos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<h3>Armadilha comum</h3><p>' + esc(q.armadilha) + '</p>' +
      '<p class="peq mut">Referência: questão ' + q.refOficial + ' do ' + esc(B.meta.caderno.split(',').slice(0, 3).join(',')) + '. Veja também o guia (projeto separado), bloco ' + (S.bloco + 1) + ', questão ' + q.n + '.</p>';
    return d;
  }

  function escolher(n, L) {
    if (S.revisao || S.verif[n]) return;
    S.resp[n] = L;
    telaQuestao();
  }
  function ir(i) {
    if (i < 0 || i >= Q().length) return;
    S.atual = i; telaQuestao();
  }

  /* ---------- resultado ---------- */
  function finalizar() {
    parar();
    var lista = Q(), ac = 0;
    lista.forEach(function (q) { if (S.resp[q.n] === q.gab) ac++; });
    var pct = Math.round(ac / lista.length * 100);
    historico['b' + S.bloco] = { acertos: ac, total: lista.length, pct: pct, data: new Date().toISOString() };
    salvarHist();
    telaResultado();
  }
  function telaResultado() {
    S.tela = 'fim'; S.revisao = false; topoInfo.textContent = 'Resultado';
    var lista = Q(), ac = 0, er = 0, br = 0, porD = {};
    lista.forEach(function (q) {
      var r = S.resp[q.n]; porD[q.disc] = porD[q.disc] || { a: 0, t: 0 }; porD[q.disc].t++;
      if (!r) br++; else if (r === q.gab) { ac++; porD[q.disc].a++; } else er++;
    });
    var pct = Math.round(ac / lista.length * 100);
    var h = el('div');
    var c = el('div', { class: 'card' });
    c.innerHTML = '<h1>Resultado do bloco ' + (S.bloco + 1) + '</h1>' +
      '<div class="stats"><div class="stat"><b>' + ac + '/' + lista.length + '</b>acertos (' + pct + '%)</div><div class="stat"><b>' + er + '</b>erradas</div><div class="stat"><b>' + br + '</b>em branco</div><div class="stat"><b>' + fmt(S.usado) + '</b>tempo gasto</div></div>' +
      '<h2>Por disciplina</h2>' +
      Object.keys(porD).map(function (d) { var x = porD[d], p = Math.round(x.a / x.t * 100); return '<div class="disc-linha"><span class="chip ' + d + '">' + d + '</span><div class="barra"><i style="width:' + p + '%"></i></div><span>' + x.a + '/' + x.t + '</span></div>'; }).join('');
    h.appendChild(c);
    var cr = el('div', { class: 'card' });
    cr.innerHTML = '<h2>Revisar questões</h2><p class="mut">Verde = certa, vermelha = errada, cinza = em branco. Clique para ver a explicação.</p>';
    var g = el('div', { class: 'navgrid' });
    lista.forEach(function (q, i) {
      var r = S.resp[q.n], cls = 'nav-n ' + (!r ? 'vazia' : r === q.gab ? 'certa' : 'errada');
      var b = el('button', { class: cls, type: 'button', 'aria-label': 'Revisar questão ' + q.n }, String(q.n));
      b.addEventListener('click', function () { S.revisao = true; S.atual = i; telaQuestao(); });
      g.appendChild(b);
    });
    cr.appendChild(g);
    var l = el('div', { class: 'linha', style: 'margin-top:16px' });
    var re = el('button', { class: 'btn pri', type: 'button' }, 'Refazer este bloco'); re.addEventListener('click', iniciar);
    var vi = el('button', { class: 'btn', type: 'button' }, 'Voltar ao início'); vi.addEventListener('click', telaInicio);
    var er2 = el('button', { class: 'btn', type: 'button' }, 'Rever só as erradas');
    er2.addEventListener('click', function () { var i = lista.findIndex(function (q) { return S.resp[q.n] && S.resp[q.n] !== q.gab; }); if (i < 0) { alert('Nenhuma questão errada neste bloco.'); return; } S.revisao = true; S.atual = i; telaQuestao(); });
    l.appendChild(re); l.appendChild(er2); l.appendChild(vi); cr.appendChild(l);
    h.appendChild(cr);
    app.innerHTML = ''; app.appendChild(h); window.scrollTo({ top: 0 });
  }

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', function (e) {
    if (S.tela !== 'prova' || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if ('abcde'.indexOf(k) >= 0 && k.length === 1) { escolher(Q()[S.atual].n, k.toUpperCase()); }
    else if (e.key === 'ArrowRight') ir(S.atual + 1);
    else if (e.key === 'ArrowLeft') ir(S.atual - 1);
  });

  telaInicio();
})();
