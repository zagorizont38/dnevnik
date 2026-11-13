/* ==========================================================
   Дневник спортсмена — клуб карате «Союз»
   Всё хранится прямо в телефоне (localStorage), интернет не нужен.
   ========================================================== */
'use strict';
(function () {

  /* ---------- Настройки, которые легко поменять ---------- */

  const COACH_NAME = 'Эдуард Борисович';
  const COACH_PHRASE = 'Я тобой горжусь! Продолжаем тренировки!';
  const DEFAULT_COACH_PHOTO = 'assets/coach.jpg';
  const LOGO = 'assets/logo.png';

  // Пояса по порядку. Последний — цель.
  const BELTS = [
    { id: 'white', name: 'белый', color: '#FFFFFF' },
    { id: 'yellow', name: 'жёлтый', color: '#F7D417' },
    { id: 'orange', name: 'оранжевый', color: '#F47B20' },
    { id: 'green', name: 'зелёный', color: '#22A05A' },
    { id: 'blue', name: 'синий', color: '#1F6FD6' },
    { id: 'brown', name: 'коричневый', color: '#7B4A24' },
    { id: 'black', name: 'чёрный', color: '#111111' }
  ];

  // Спортивный год: сентябрь — июнь. Июль и август относим к новому сезону.
  const SEASON_FIRST_MONTH = 7;

  const KEY = 'soyuz-diary-v1';
  const COACH_KEY = 'soyuz-diary-coach-photo';
  const HINT_KEY = 'soyuz-diary-install-hidden';

  /* ---------- Значки ---------- */

  const svg = (d) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    home: svg('<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    book: svg('<path d="M5 4h11a3 3 0 0 1 3 3v13H7a2 2 0 0 1-2-2zM9 9h6M9 13h6"/>'),
    chart: svg('<path d="M5 20v-8M12 20V5M19 20v-5M2.5 20h19"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>'),
    next: svg('<path d="M9 5l7 7-7 7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    trash: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>'),
    pencil: svg('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>')
  };

  const AVATAR = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#E9E4E4"/>' +
    '<circle cx="100" cy="78" r="36" fill="#B9AFAF"/><path d="M30 200c0-44 31-70 70-70s70 26 70 70z" fill="#FFFFFF" stroke="#B9AFAF" stroke-width="4"/>' +
    '<path d="M76 134l24 34 24-34" fill="none" stroke="#B9AFAF" stroke-width="4"/><rect x="52" y="176" width="96" height="12" fill="#1B1717"/></svg>');

  /* ---------- Мелкие помощники ---------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pl = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return f[2]; if (b > 1 && b < 5) return f[1]; if (b === 1) return f[0]; return f[2]; };

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtDate(s, opts) {
    if (!s) return '';
    const p = s.split('-').map(Number);
    const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('ru-RU', opts || { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s?г\.$/, '');
  }

  function seasonOf(dateStr) {
    const p = (dateStr || todayStr()).split('-').map(Number);
    return p[1] >= SEASON_FIRST_MONTH ? p[0] : p[0] - 1;
  }
  const seasonLabel = (s) => s + '–' + (s + 1);
  const seasonFinished = (s) => todayStr() > (s + 1) + '-06-30';

  function beltSvg(color, stroke) {
    return '<svg viewBox="0 0 44 32" aria-hidden="true"><g fill="' + color + '" stroke="' + stroke + '" stroke-width="1.5" stroke-linejoin="round">' +
      '<rect x="1.5" y="7" width="41" height="10" rx="3"/><path d="M19 16 13 29.5h6l3-8 3 8h6L25 16z"/><rect x="17" y="5" width="10" height="14" rx="3"/></g></svg>';
  }
  const beltOnLight = (b) => beltSvg(b.color, b.id === 'white' ? '#9A8F8F' : 'rgba(0,0,0,.28)');
  const beltOnDark = (b) => beltSvg(b.color, b.id === 'black' ? '#F2B01E' : 'rgba(255,255,255,.4)');

  /* ---------- Данные ---------- */

  function emptyDb() {
    return { version: 1, onboarded: false, profile: { name: '', belt: 'white' }, comps: [] };
  }

  function normalize(d) {
    const out = emptyDb();
    if (!d || typeof d !== 'object') return out;
    out.onboarded = !!d.onboarded;
    if (d.profile) {
      out.profile.name = String(d.profile.name || '').slice(0, 40);
      out.profile.belt = BELTS.some((b) => b.id === d.profile.belt) ? d.profile.belt : 'white';
    }
    out.comps = (Array.isArray(d.comps) ? d.comps : []).map((c) => ({
      id: String(c.id || uid()),
      name: String(c.name || ''),
      date: /^\d{4}-\d{2}-\d{2}$/.test(c.date) ? c.date : todayStr(),
      place: String(c.place || ''),
      rank: [0, 1, 2, 3].includes(c.rank) ? c.rank : null,
      done: !!c.done,
      fights: (Array.isArray(c.fights) ? c.fights : []).map((f) => ({
        id: String(f.id || uid()),
        task: String(f.task || ''),
        my: Math.max(0, Math.min(99, parseInt(f.my, 10) || 0)),
        opp: Math.max(0, Math.min(99, parseInt(f.opp, 10) || 0)),
        result: ['win', 'loss', 'draw'].includes(f.result) ? f.result : null,
        good: String(f.good || ''),
        bad: String(f.bad || '')
      })),
      drills: (Array.isArray(c.drills) ? c.drills : []).map((x) => ({ id: String(x.id || uid()), text: String(x.text || ''), done: !!x.done }))
    }));
    return out;
  }

  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return emptyDb(); }
  }

  let db = load();
  let saveTimer = null;

  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Не получилось сохранить. Проверь память телефона.'); }
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }

  const getComp = (id) => db.comps.find((c) => c.id === id);
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const byDateAsc = (a, b) => -byDateDesc(a, b);
  const compsOf = (season) => db.comps.filter((c) => seasonOf(c.date) === season);
  const beltIndex = () => Math.max(0, BELTS.findIndex((b) => b.id === db.profile.belt));

  function calc(comps) {
    const r = { comps: comps.length, fights: 0, wins: 0, losses: 0, draws: 0, my: 0, opp: 0, medals: { 1: 0, 2: 0, 3: 0 }, drills: 0, drillsDone: 0 };
    comps.forEach((c) => {
      c.fights.forEach((f) => {
        r.fights++;
        if (f.result === 'win') r.wins++; else if (f.result === 'loss') r.losses++; else if (f.result === 'draw') r.draws++;
        r.my += f.my; r.opp += f.opp;
      });
      if (r.medals[c.rank] !== undefined) r.medals[c.rank]++;
      c.drills.forEach((d) => { r.drills++; if (d.done) r.drillsDone++; });
    });
    return r;
  }

  function coachSrc() {
    try { return localStorage.getItem(COACH_KEY) || DEFAULT_COACH_PHOTO; } catch (e) { return DEFAULT_COACH_PHOTO; }
  }

  /* ---------- Состояние экрана ---------- */

  const ui = { tab: 'home', season: null, stack: [], closing: false, installEvt: null };

  const top = () => ui.stack[ui.stack.length - 1];

  function push(o) {
    o.fresh = true;
    ui.stack.push(o);
    try { history.pushState({ depth: ui.stack.length }, ''); } catch (e) { /* не страшно */ }
    render();
  }

  function replaceTop(o) {
    o.fresh = true;
    ui.stack[ui.stack.length - 1] = o;
    render();
  }

  function closeTop() {
    if (!ui.stack.length || ui.closing) return;
    ui.closing = true;
    let moved = false;
    try { if (history.state && history.state.depth) { history.back(); moved = true; } } catch (e) { /* ниже закроем сами */ }
    if (!moved) doPop();
    else setTimeout(() => { if (ui.closing) doPop(); }, 400);
  }

  function doPop() {
    ui.closing = false;
    const o = ui.stack.pop();
    if (o) onClosed(o);
    render();
  }

  window.addEventListener('popstate', () => {
    const d = document.querySelector('.dialog-wrap');
    if (d) d.remove();
    if (ui.stack.length) doPop();
  });

  function onClosed(o) {
    if (o.type === 'editor') {
      const c = getComp(o.compId);
      if (c && !c.done && !c.name.trim() && !c.place.trim() && !c.fights.length && !c.drills.length) {
        db.comps = db.comps.filter((x) => x.id !== c.id);
        saveNow();
      } else if (c && !c.done && !o.finished) {
        toast('Сохранено. Можно продолжить позже.');
      }
    }
  }

  /* ---------- Подсказки и вопросы ---------- */

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function ask(o) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'dialog-wrap';
      el.innerHTML = '<div class="dialog" role="alertdialog" aria-modal="true"><h3>' + esc(o.title) + '</h3>' +
        (o.text ? '<p>' + esc(o.text) + '</p>' : '') +
        '<div class="dialog-btns"><button class="btn ' + (o.danger ? 'btn-dark' : 'btn-red') + '" data-d="yes">' + esc(o.yes || 'Да') + '</button>' +
        '<button class="btn btn-ghost" data-d="no">' + esc(o.no || 'Нет') + '</button></div></div>';
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-d]');
        if (!b) return;
        el.remove();
        resolve(b.dataset.d === 'yes');
      });
      document.body.appendChild(el);
    });
  }

  /* ==========================================================
     ЭКРАНЫ
     ========================================================== */

  function medal(rank, cls) {
    if (rank >= 1 && rank <= 3) return '<span class="medal m' + rank + ' ' + (cls || '') + '" role="img" aria-label="' + rank + ' место">' + rank + '</span>';
    return '<span class="medal m0 ' + (cls || '') + '" aria-hidden="true">🥋</span>';
  }

  const RES = { win: 'Победа', loss: 'Поражение', draw: 'Ничья' };
  const resTag = (r) => '<span class="res ' + (r || 'none') + '">' + (RES[r] || 'Не отмечено') + '</span>';

  function compLine(c) {
    const s = calc([c]);
    if (!s.fights) return 'Боёв пока нет';
    return s.fights + ' ' + pl(s.fights, ['бой', 'боя', 'боёв']) + ' · ' + s.wins + ' ' + pl(s.wins, ['победа', 'победы', 'побед']) + ' · баллы ' + s.my + ':' + s.opp;
  }

  function compCard(c) {
    return '<button class="comp" data-act="open" data-id="' + c.id + '">' + medal(c.rank) +
      '<span class="comp-main">' + (c.done ? '' : '<span class="tag">Не закончено</span><br>') +
      '<span class="comp-name">' + esc(c.name || 'Без названия') + '</span>' +
      '<span class="comp-meta" style="display:block">' + esc(fmtDate(c.date)) + (c.place ? ' · ' + esc(c.place) : '') + '</span>' +
      '<span class="comp-stats" style="display:block">' + compLine(c) + '</span></span>' + I.next + '</button>';
  }

  function todoRow(c, d, withComp) {
    return '<button class="todo' + (d.done ? ' done' : '') + '" data-act="toggle-drill" data-id="' + c.id + '" data-did="' + d.id + '" aria-pressed="' + d.done + '">' +
      '<span class="todo-box">' + I.check + '</span><span class="todo-txt">' + esc(d.text) +
      (withComp ? '<small>' + esc(c.name || 'Соревнование') + '</small>' : '') + '</span></button>';
  }

  function goalCard() {
    const cur = beltIndex();
    const last = BELTS.length - 1;
    const belts = BELTS.map((b, i) => {
      const cls = i === last ? 'target' : i === cur ? 'here' : i > cur ? 'future' : '';
      const tag = i === cur && i === last ? 'это ты!' : i === cur ? 'ты здесь' : i === last ? 'цель' : '';
      return '<div class="belt ' + cls + '">' + beltOnDark(b) + '<span class="belt-tag">' + tag + '</span></div>';
    }).join('');
    const left = last - cur;
    const note = left === 0
      ? '<b>Цель достигнута!</b> Чёрный пояс — это только начало пути.'
      : 'Сейчас у тебя <b>' + BELTS[cur].name + ' пояс</b>. До чёрного — <b>' + left + ' ' + pl(left, ['шаг', 'шага', 'шагов']) + '</b>.';
    return '<section class="goal" aria-label="Моя цель — чёрный пояс"><div class="goal-kicker">Моя цель</div><div class="goal-title">ЧЁРНЫЙ ПОЯС</div>' +
      '<div class="belts">' + belts + '</div><div class="goal-note">' + note + '</div></section>';
  }

  function installHint() {
    let hidden = false;
    try { hidden = !!localStorage.getItem(HINT_KEY); } catch (e) { /* покажем */ }
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (hidden || standalone) return '';
    const ua = navigator.userAgent || '';
    const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let how;
    if (ui.installEvt) how = 'Нажмите кнопку — и дневник появится на экране телефона, как обычное приложение.';
    else if (ios) how = 'В Safari нажмите кнопку «Поделиться» (квадрат со стрелкой), затем — «На экран „Домой“».';
    else how = 'Откройте меню браузера (три точки) и выберите «Установить приложение» или «Добавить на главный экран».';
    return '<div class="section-h">Для родителей</div><div class="hint"><b>Установите дневник на телефон</b><p>' + how + '</p><div class="hint-btns">' +
      (ui.installEvt ? '<button class="btn btn-dark btn-small" data-act="install">Установить</button>' : '') +
      '<button class="btn btn-ghost btn-small" data-act="hide-hint">Понятно</button></div></div>';
  }

  function viewHome() {
    const season = seasonOf(todayStr());
    const s = calc(compsOf(season));
    const draft = db.comps.filter((c) => !c.done).sort(byDateDesc)[0];
    const todo = [];
    db.comps.slice().sort(byDateDesc).forEach((c) => c.drills.forEach((d) => { if (!d.done) todo.push([c, d]); }));
    const name = db.profile.name.trim();

    return '<div class="screen" data-screen="home">' +
      '<header class="hero"><div class="hero-top"><div class="brand"><img src="' + LOGO + '" alt="" data-hide-on-error>' +
      '<div><b>СОЮЗ</b><span>клуб карате · Иркутск</span></div></div>' +
      '<button class="icon-btn" data-act="settings" aria-label="Настройки">' + I.gear + '</button></div>' +
      '<h1>' + (name ? 'Привет, ' + esc(name) + '!' : 'Привет!') + '</h1><p class="hero-sub">Это твой дневник спортсмена</p></header>' +
      goalCard() +
      '<div class="pad" style="margin-top:20px"><div class="stack">' +
      (draft ? '<button class="draft" data-act="continue" data-id="' + draft.id + '"><span class="draft-txt"><span class="draft-k">Продолжить запись</span><br><span class="draft-n">' + esc(draft.name || 'Соревнование') + '</span></span><span class="draft-go">' + I.next + '</span></button>' : '') +
      '<button class="btn btn-red" data-act="new-comp">' + I.plus + '<span>Записать соревнование</span></button></div>' +
      '<div class="section-h">Сезон ' + seasonLabel(season) + '</div>' +
      '<button class="tiles" data-act="tab" data-tab="stats" style="width:100%" aria-label="Итоги сезона">' +
      '<span class="tile"><b>' + s.comps + '</b><span>' + pl(s.comps, ['турнир', 'турнира', 'турниров']) + '</span></span>' +
      '<span class="tile"><b>' + s.fights + '</b><span>' + pl(s.fights, ['бой', 'боя', 'боёв']) + '</span></span>' +
      '<span class="tile accent"><b>' + s.wins + '</b><span>' + pl(s.wins, ['победа', 'победы', 'побед']) + '</span></span></button>' +
      (todo.length ? '<div class="section-h">Отработка: что тренировать</div><div class="card">' +
        todo.slice(0, 5).map((t) => todoRow(t[0], t[1], true)).join('') +
        (todo.length > 5 ? '<p class="note">И ещё ' + (todo.length - 5) + ' — смотри в дневнике.</p>' : '') + '</div>' : '') +
      installHint() + '</div></div>';
  }

  function viewDiary() {
    const comps = db.comps.slice().sort(byDateDesc);
    let body;
    if (!comps.length) {
      body = '<div class="card empty"><div class="empty-ico">🥋</div><h3>Дневник пока пустой</h3><p>Запиши своё первое соревнование — это просто!</p>' +
        '<button class="btn btn-red" data-act="new-comp">' + I.plus + '<span>Записать соревнование</span></button></div>';
    } else {
      const groups = [];
      comps.forEach((c) => {
        const s = seasonOf(c.date);
        let g = groups.find((x) => x.s === s);
        if (!g) { g = { s: s, list: [] }; groups.push(g); }
        g.list.push(c);
      });
      body = '<button class="btn btn-red" data-act="new-comp" style="margin-top:4px">' + I.plus + '<span>Записать соревнование</span></button>' +
        groups.map((g) => '<div class="section-h">Сезон ' + seasonLabel(g.s) + '</div><div class="stack">' + g.list.map(compCard).join('') + '</div>').join('');
    }
    return '<div class="topbar"><h1>Дневник</h1><p>Все твои соревнования</p></div><div class="screen" data-screen="diary"><div class="pad" style="padding-top:16px">' + body + '</div></div>';
  }

  function viewStats() {
    const cur = seasonOf(todayStr());
    const seasons = Array.from(new Set(db.comps.map((c) => seasonOf(c.date)).concat([cur]))).sort((a, b) => b - a);
    if (ui.season == null || !seasons.includes(ui.season)) ui.season = cur;
    const season = ui.season;
    const comps = compsOf(season).sort(byDateAsc);
    const s = calc(comps);
    const pct = s.fights ? Math.round((s.wins / s.fights) * 100) : 0;
    const C = 2 * Math.PI * 52;

    const chips = '<div class="chips" role="tablist" aria-label="Спортивный год">' + seasons.map((x) =>
      '<button class="chip' + (x === season ? ' on' : '') + '" data-act="season" data-val="' + x + '" role="tab" aria-selected="' + (x === season) + '">Сезон ' + seasonLabel(x) + '</button>').join('') + '</div>';

    let body;
    if (!comps.length) {
      body = '<div class="card empty"><div class="empty-ico">📊</div><h3>Пока нет записей</h3><p>Спортивный год идёт с сентября по июнь. Запиши соревнование — и здесь появятся твои итоги.</p>' +
        '<button class="btn btn-red" data-act="new-comp">' + I.plus + '<span>Записать соревнование</span></button></div>';
    } else {
      const finished = seasonFinished(season);
      const banner = '<div class="banner"><div class="banner-k">' + (finished ? 'Итоги спортивного года' : 'Сезон идёт · сентябрь — июнь') + '</div>' +
        '<div class="banner-t">' + s.fights + ' ' + pl(s.fights, ['бой', 'боя', 'боёв']) + ' — ' + s.wins + ' ' + pl(s.wins, ['победа', 'победы', 'побед']) + '</div>' +
        '<p>' + (finished ? 'Отличная работа за год! Впереди новый сезон и новый шаг к чёрному поясу.' : 'Каждый бой — это шаг к чёрному поясу. Так держать!') + '</p></div>';

      const ring = '<div class="card score-card"><div class="ring" role="img" aria-label="Побед: ' + pct + ' процентов">' +
        '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#ECE8E8" stroke-width="13"/>' +
        '<circle cx="60" cy="60" r="52" fill="none" stroke="#DD1212" stroke-width="13" stroke-linecap="round" stroke-dasharray="' + (C * pct / 100).toFixed(1) + ' ' + C.toFixed(1) + '"' + (pct ? '' : ' opacity="0"') + '/></svg>' +
        '<div class="ring-c"><b>' + pct + '%</b><span>побед</span></div></div>' +
        '<div class="score-nums"><div class="score-row"><span>Боёв</span><b>' + s.fights + '</b></div>' +
        '<div class="score-row win"><span>Побед</span><b>' + s.wins + '</b></div>' +
        '<div class="score-row"><span>Поражений</span><b>' + s.losses + '</b></div>' +
        (s.draws ? '<div class="score-row"><span>Ничьих</span><b>' + s.draws + '</b></div>' : '') + '</div></div>';

      const medals = '<div class="card"><div class="card-h">Медали · ' + s.comps + ' ' + pl(s.comps, ['соревнование', 'соревнования', 'соревнований']) + '</div><div class="medal-row">' +
        [1, 2, 3].map((r) => '<div>' + medal(r) + '<b>' + s.medals[r] + '</b><span>' + r + ' место</span></div>').join('') + '</div></div>';

      const points = '<div class="card"><div class="card-h">Баллы за сезон</div><div class="duel">' +
        '<div class="plus"><b>' + s.my + '</b><span>набрано</span></div><div class="minus"><b>' + s.opp + '</b><span>пропущено</span></div></div></div>';

      const bars = '<div class="card"><div class="card-h">Победы на каждом соревновании</div>' + comps.map((c) => {
        const x = calc([c]);
        const w = x.fights ? Math.round((x.wins / x.fights) * 100) : 0;
        return '<div class="bar-row"><div class="bar-top"><span class="bar-name">' + esc(c.name || 'Без названия') + '</span>' +
          '<span class="bar-val">' + x.wins + ' из ' + x.fights + '</span></div>' +
          '<div class="bar-date">' + esc(fmtDate(c.date, { day: 'numeric', month: 'long' })) + (c.rank ? ' · ' + c.rank + ' место' : '') + '</div>' +
          '<div class="bar-track"><i style="width:' + w + '%"></i></div></div>';
      }).join('') + '</div>';

      const drills = s.drills ? '<div class="card"><div class="card-h">Отработка</div><div class="bar-top"><span class="bar-name">Выполнено заданий</span>' +
        '<span class="bar-val">' + s.drillsDone + ' из ' + s.drills + '</span></div><div class="bar-track"><i style="width:' + Math.round((s.drillsDone / s.drills) * 100) + '%;background:#1C9A52"></i></div></div>' : '';

      body = '<div class="stack">' + banner + ring + medals + points + bars + drills + '</div>';
    }
    return '<div class="topbar"><h1>Итоги</h1><p>Спортивный год: сентябрь — июнь</p></div><div class="screen" data-screen="stats">' + chips +
      '<div class="pad" style="padding-top:12px">' + body + '</div></div>';
  }

  function navBar() {
    const item = (id, ico, label) => '<button class="' + (ui.tab === id ? 'on' : '') + '" data-act="tab" data-tab="' + id + '"' + (ui.tab === id ? ' aria-current="page"' : '') + '>' + ico + '<span>' + label + '</span></button>';
    return '<nav class="nav" aria-label="Разделы">' + item('home', I.home, 'Главная') + item('diary', I.book, 'Дневник') + item('stats', I.chart, 'Итоги') + '</nav>';
  }

  /* ---------- Запись соревнования: 4 шага ---------- */

  const STEPS = ['Турнир', 'Бои', 'Место', 'Отработка'];

  function viewEditor(o) {
    const c = getComp(o.compId);
    if (!c) return '';
    const stepsBar = '<div class="steps">' + STEPS.map((t, i) =>
      '<button class="step' + (i === o.step ? ' on' : i < o.step ? ' ok' : '') + '" data-act="step" data-step="' + i + '"' + (i === o.step ? ' aria-current="step"' : '') + '>' +
      '<span class="step-n">' + (i < o.step ? I.check : i + 1) + '</span><span>' + t + '</span></button>').join('') + '</div>';

    let body = '';
    if (o.step === 0) {
      body = '<h3 class="step-title">Соревнование</h3><p class="step-sub">Расскажи, где ты выступаешь.</p>' +
        '<label class="field"><span class="lbl">Как называются соревнования?</span><input class="inp" type="text" data-bind="comp.name" value="' + esc(c.name) + '" placeholder="Например: Baikal Open" maxlength="120" autocomplete="off" enterkeyhint="next"></label>' +
        '<label class="field"><span class="lbl">Когда?</span><input class="inp" type="date" data-bind="comp.date" value="' + esc(c.date) + '" max="2099-12-31"></label>' +
        '<label class="field"><span class="lbl">Где проходят?</span><input class="inp" type="text" data-bind="comp.place" value="' + esc(c.place) + '" placeholder="Город и зал" maxlength="120" autocomplete="off" enterkeyhint="done"></label>';
    } else if (o.step === 1) {
      const s = calc([c]);
      body = '<h3 class="step-title">Мои бои</h3><p class="step-sub">После каждого боя нажми «Добавить бой».</p>' +
        '<div class="sum"><div><b>' + s.fights + '</b><span>' + pl(s.fights, ['бой', 'боя', 'боёв']) + '</span></div><div><b>' + s.my + '</b><span>набрано</span></div><div><b>' + s.opp + '</b><span>пропущено</span></div></div>' +
        '<div class="stack">' + c.fights.map((f, i) =>
          '<button class="fight" data-act="edit-fight" data-fid="' + f.id + '"><span class="fight-main"><span class="fight-n">Бой ' + (i + 1) + '</span>' +
          '<span class="fight-r"><span class="fight-score">' + f.my + ' : ' + f.opp + '</span>' + resTag(f.result) + '</span></span>' + I.pencil + '</button>').join('') +
        '<button class="btn btn-dashed" data-act="add-fight">' + I.plus + '<span>Добавить бой</span></button></div>';
    } else if (o.step === 2) {
      const tile = (r, label, wide) => '<button class="rank' + (c.rank === r ? ' on' : '') + (wide ? ' wide' : '') + '" data-act="rank" data-val="' + r + '" aria-pressed="' + (c.rank === r) + '">' + medal(r, wide ? '' : 'big') + '<span>' + label + '</span></button>';
      body = '<h3 class="step-title">Какое место?</h3><p class="step-sub">Если ещё не знаешь — пропусти, отметишь потом.</p>' +
        '<div class="ranks">' + tile(1, '1 место') + tile(2, '2 место') + tile(3, '3 место') + tile(0, 'Без медали', true) + '</div>';
    } else {
      body = '<h3 class="step-title">Отработка</h3><p class="step-sub">Что сказал тренер на разборе? Запиши задания и упражнения.</p>' +
        '<div class="stack">' + c.drills.map((d, i) =>
          '<div class="drill"><span class="drill-n">' + (i + 1) + '</span><span class="drill-t">' + esc(d.text) + '</span>' +
          '<button data-act="del-drill" data-did="' + d.id + '" aria-label="Удалить задание">' + I.close + '</button></div>').join('') + '</div>' +
        '<div class="add-row"><label class="field" style="margin:0"><span class="lbl">Новое задание</span>' +
        '<textarea class="inp" data-bind="drill.new" rows="2" placeholder="Например: 50 ударов гяку-цуки каждый день" maxlength="300">' + esc(o.newDrill || '') + '</textarea></label>' +
        '<button class="btn btn-dashed" data-act="add-drill">' + I.plus + '<span>Добавить задание</span></button></div>';
    }

    const foot = '<div class="sheet-foot">' +
      (o.step > 0 ? '<button class="btn btn-ghost" data-act="prev">Назад</button>' : '') +
      (o.step < 3 ? '<button class="btn btn-red" data-act="next"><span>Дальше</span>' + I.next + '</button>'
        : '<button class="btn btn-red" data-act="finish">' + I.check + '<span>Готово</span></button>') + '</div>';

    return '<div class="overlay' + (o.fresh ? ' fresh' : '') + '"><div class="sheet" role="dialog" aria-label="Запись соревнования">' +
      '<div class="sheet-top"><button class="icon-btn" data-act="close" aria-label="Закрыть">' + I.close + '</button><h2>' + esc(c.name.trim() || 'Новое соревнование') + '</h2><span class="spacer"></span></div>' +
      stepsBar + '<div class="sheet-body">' + body + '</div>' + foot + '</div></div>';
  }

  /* ---------- Один бой ---------- */

  function viewFight(o) {
    const f = o.draft;
    const score = (key, label, me) => '<div class="sb' + (me ? ' me' : '') + '"><div class="sb-l">' + label + '</div><div class="sb-n" data-num="' + key + '" aria-live="polite">' + f[key] + '</div>' +
      '<div class="sb-btns"><button data-act="dec" data-field="' + key + '" aria-label="Убрать балл">' + I.minus + '</button>' +
      '<button class="plus" data-act="inc" data-field="' + key + '" aria-label="Добавить балл">' + I.plus + '</button></div></div>';
    const ch = (v, label, wide) => '<button class="' + (f.result === v ? 'on' : '') + (wide ? ' wide' : '') + '" data-act="result" data-val="' + v + '" aria-pressed="' + (f.result === v) + '">' + label + '</button>';

    return '<div class="overlay' + (o.fresh ? ' fresh' : '') + '"><div class="sheet" role="dialog" aria-label="Бой">' +
      '<div class="sheet-top"><button class="icon-btn" data-act="close" aria-label="Назад">' + I.back + '</button><h2>Бой ' + o.num + '</h2><span class="spacer"></span></div>' +
      '<div class="sheet-body">' +
      '<label class="field"><span class="lbl">Задание тренера на этот бой</span><textarea class="inp" data-bind="fight.task" rows="2" placeholder="Что тренер просил сделать?" maxlength="400">' + esc(f.task) + '</textarea></label>' +
      '<span class="lbl">Счёт</span><div class="scoreboard">' + score('my', 'Мои баллы', true) + score('opp', 'Баллы соперника', false) + '</div>' +
      '<span class="lbl">Чем закончился бой?</span><div class="choice" id="fight-result">' + ch('win', 'Победа') + ch('loss', 'Поражение') + ch('draw', 'Ничья', true) + '</div>' +
      '<label class="field good"><span class="lbl">👍 Что получилось</span><textarea class="inp" data-bind="fight.good" rows="2" placeholder="Что удалось сделать хорошо?" maxlength="600">' + esc(f.good) + '</textarea></label>' +
      '<label class="field bad"><span class="lbl">👎 Что не получилось</span><textarea class="inp" data-bind="fight.bad" rows="2" placeholder="Над чем нужно поработать?" maxlength="600">' + esc(f.bad) + '</textarea></label>' +
      (o.fightId ? '<button class="link-danger" data-act="del-fight">' + I.trash + '<span>Удалить этот бой</span></button>' : '') +
      '</div><div class="sheet-foot"><button class="btn btn-red" data-act="save-fight">' + I.check + '<span>Сохранить бой</span></button></div></div></div>';
  }

  /* ---------- Просмотр соревнования ---------- */

  function viewDetail(o) {
    const c = getComp(o.compId);
    if (!c) return '';
    const s = calc([c]);
    const block = (cls, k, v) => '<div class="f-block ' + cls + '"><div class="f-k">' + k + '</div><div class="f-v' + (v.trim() ? '' : ' none') + '">' + (v.trim() ? esc(v) : 'Не записано') + '</div></div>';
    const rankText = c.rank >= 1 ? c.rank + ' место' : c.rank === 0 ? 'Без медали' : 'Место ещё не отмечено';

    return '<div class="overlay' + (o.fresh ? ' fresh' : '') + '"><div class="sheet" role="dialog" aria-label="Соревнование">' +
      '<div class="sheet-top"><button class="icon-btn" data-act="close" aria-label="Назад">' + I.back + '</button><h2>Соревнование</h2>' +
      '<button class="icon-btn" data-act="edit-comp" aria-label="Изменить">' + I.pencil + '</button></div>' +
      '<div class="sheet-body" style="padding:0">' +
      '<div class="d-head">' + medal(c.rank, 'big') + '<div class="d-name">' + esc(c.name || 'Без названия') + '</div>' +
      '<div class="d-meta">' + esc(fmtDate(c.date)) + (c.place ? '<br>' + esc(c.place) : '') + '</div><div class="d-rank">' + rankText + '</div></div>' +
      '<div class="d-body"><div class="d-sum"><div><b>' + s.fights + '</b><span>' + pl(s.fights, ['бой', 'боя', 'боёв']) + '</span></div><div><b>' + s.wins + '</b><span>' + pl(s.wins, ['победа', 'победы', 'побед']) + '</span></div>' +
      '<div><b>' + s.my + '</b><span>набрано</span></div><div><b>' + s.opp + '</b><span>пропущено</span></div></div>' +
      (c.done ? '' : '<button class="btn btn-red" data-act="edit-comp" style="margin-top:16px">' + I.pencil + '<span>Продолжить запись</span></button>') +
      '<div class="section-h">Бои</div>' +
      (c.fights.length ? '<div class="stack">' + c.fights.map((f, i) =>
        '<div class="f-card"><div class="f-head"><span class="fight-n">Бой ' + (i + 1) + '</span><span class="fight-r" style="margin:0"><span class="fight-score">' + f.my + ' : ' + f.opp + '</span>' + resTag(f.result) + '</span></div>' +
        block('', 'Задание тренера', f.task) + block('good', '👍 Что получилось', f.good) + block('bad', '👎 Что не получилось', f.bad) + '</div>').join('') + '</div>'
        : '<div class="card"><p class="note" style="margin:0">Боёв пока нет.</p></div>') +
      '<div class="section-h">Отработка</div>' +
      (c.drills.length ? '<div class="card">' + c.drills.map((d) => todoRow(c, d, false)).join('') + '<p class="note">Когда выполнишь задание — поставь галочку.</p></div>'
        : '<div class="card"><p class="note" style="margin:0">Заданий пока нет. Добавь их после разбора с тренером.</p></div>') +
      '<div style="margin-top:22px" class="stack">' + (c.done ? '<button class="btn btn-ghost" data-act="edit-comp">' + I.pencil + '<span>Изменить запись</span></button>' : '') +
      '<button class="link-danger" data-act="del-comp">' + I.trash + '<span>Удалить соревнование</span></button></div>' +
      '</div></div></div></div>';
  }

  /* ---------- Тренер гордится ---------- */

  function confetti() {
    const colors = ['#FFFFFF', '#F2B01E', '#F47B20', '#1B1717', '#FFD9A8'];
    let out = '';
    for (let i = 0; i < 46; i++) {
      out += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + colors[i % colors.length] +
        ';animation-duration:' + (2.6 + Math.random() * 2.6).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.6).toFixed(2) +
        's;transform:rotate(' + Math.round(Math.random() * 360) + 'deg)"></i>';
    }
    return '<div class="confetti" aria-hidden="true">' + out + '</div>';
  }

  function viewCoach(o) {
    return '<div class="overlay coach' + (o.fresh ? ' fresh' : '') + '"><div class="sheet" role="dialog" aria-label="Слова тренера">' +
      '<div class="coach-rings"></div>' + (o.fresh ? confetti() : '') +
      '<div class="coach-k">' + (o.preview ? 'Слова тренера' : 'Соревнование записано!') + '</div>' +
      '<div class="coach-photo"><img src="' + esc(coachSrc()) + '" alt="Тренер ' + COACH_NAME + '" data-avatar></div>' +
      '<div class="bubble"><span>' + esc(COACH_PHRASE.replace('! ', '!\n')).replace('\n', '<br>') + '</span><small>' + COACH_NAME + ', твой тренер</small></div>' +
      '<div class="coach-goal">' + beltSvg('#111111', '#F2B01E') + '<div><span>Помни о цели</span><b>ЧЁРНЫЙ ПОЯС</b></div></div>' +
      '<button class="btn btn-white" data-act="close">Осс! Продолжаем</button></div></div>';
  }

  /* ---------- Настройки и знакомство ---------- */

  function beltGrid() {
    return '<div class="belt-grid">' + BELTS.map((b) =>
      '<button class="belt-pick' + (db.profile.belt === b.id ? ' on' : '') + '" data-act="belt" data-val="' + b.id + '" aria-pressed="' + (db.profile.belt === b.id) + '">' + beltOnLight(b) + b.name + '</button>').join('') + '</div>';
  }

  function viewSettings(o) {
    let custom = false;
    try { custom = !!localStorage.getItem(COACH_KEY); } catch (e) { /* нет своего фото */ }
    return '<div class="overlay' + (o.fresh ? ' fresh' : '') + '"><div class="sheet" role="dialog" aria-label="Настройки">' +
      '<div class="sheet-top"><button class="icon-btn" data-act="close" aria-label="Назад">' + I.back + '</button><h2>Настройки</h2><span class="spacer"></span></div>' +
      '<div class="sheet-body">' +
      '<label class="field"><span class="lbl">Как тебя зовут?</span><input class="inp" type="text" data-bind="profile.name" value="' + esc(db.profile.name) + '" placeholder="Имя" maxlength="40" autocomplete="off"></label>' +
      '<span class="lbl">Какой у тебя сейчас пояс?</span>' + beltGrid() +
      '<div class="section-h">Тренер</div><div class="card"><div class="coach-set"><img src="' + esc(coachSrc()) + '" alt="Фото тренера" data-avatar>' +
      '<div class="coach-set-btns"><span class="btn btn-ghost btn-small file-btn">Выбрать фото<input type="file" accept="image/*" data-file="coach" aria-label="Выбрать фото тренера"></span>' +
      (custom ? '<button class="btn btn-ghost btn-small" data-act="coach-reset">Вернуть обычное</button>' : '') + '</div></div>' +
      '<button class="btn btn-dark" data-act="coach-preview" style="margin-top:16px">Что скажет тренер?</button></div>' +
      '<div class="section-h">Для родителей: копия дневника</div><div class="card"><div class="stack">' +
      '<button class="btn btn-ghost" data-act="export">Сохранить копию</button>' +
      '<span class="btn btn-ghost file-btn">Загрузить копию<input type="file" accept="application/json,.json" data-file="import" aria-label="Загрузить копию дневника"></span></div>' +
      '<p class="note">Записи хранятся только в этом телефоне. Время от времени сохраняйте копию — она пригодится при смене телефона.</p></div>' +
      '</div></div></div>';
  }

  function viewOnboarding() {
    return '<div class="overlay onb"><div class="sheet">' +
      '<img class="onb-logo" src="' + LOGO + '" alt="" data-hide-on-error><div class="onb-club">СОЮЗ · КАРАТЕ</div>' +
      '<h1>Дневник спортсмена</h1><p class="onb-sub">Записывай свои соревнования и иди к чёрному поясу!</p>' +
      '<label class="field"><span class="lbl">Как тебя зовут?</span><input class="inp" type="text" data-bind="profile.name" value="' + esc(db.profile.name) + '" placeholder="Напиши своё имя" maxlength="40" autocomplete="off" enterkeyhint="done"></label>' +
      '<span class="lbl">Какой у тебя сейчас пояс?</span>' + beltGrid() +
      '<button class="btn btn-white" data-act="onboard-done">Начать</button></div></div>';
  }

  /* ==========================================================
     ОТРИСОВКА
     ========================================================== */

  function autoGrow(root) {
    $$('textarea.inp', root).forEach((t) => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 4, 92) + 'px'; });
  }

  let lastTab = null;
  let lastOverlay = null;

  function render() {
    // Основной экран
    const app = $('#app');
    const scr = $('.screen', app);
    const keep = scr && lastTab === ui.tab ? scr.scrollTop : 0;
    app.innerHTML = (ui.tab === 'diary' ? viewDiary() : ui.tab === 'stats' ? viewStats() : viewHome()) + navBar();
    const scr2 = $('.screen', app);
    if (scr2) scr2.scrollTop = keep;
    lastTab = ui.tab;

    // Окно поверх
    const root = $('#overlay-root');
    const o = db.onboarded ? top() : { type: 'onboarding' };
    const body = $('.sheet-body', root) || $('.overlay', root);
    const keepO = body && o && lastOverlay === o && !o.resetScroll ? body.scrollTop : 0;
    let html = '';
    if (o) {
      if (o.type === 'onboarding') html = viewOnboarding();
      else if (o.type === 'editor') html = viewEditor(o);
      else if (o.type === 'fight') html = viewFight(o);
      else if (o.type === 'detail') html = viewDetail(o);
      else if (o.type === 'coach') html = viewCoach(o);
      else if (o.type === 'settings') html = viewSettings(o);
    }
    root.innerHTML = html;
    const body2 = $('.sheet-body', root) || $('.overlay', root);
    if (body2) body2.scrollTop = keepO;
    if (o) { o.fresh = false; o.resetScroll = false; }
    lastOverlay = o || null;
    app.inert = !!html;
    autoGrow(root);
  }

  /* ==========================================================
     ДЕЙСТВИЯ
     ========================================================== */

  function shake(sel, msg) {
    const el = $(sel);
    if (el) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); }
    }
    if (msg) toast(msg);
  }

  function newComp() {
    const c = { id: uid(), name: '', date: todayStr(), place: '', rank: null, done: false, fights: [], drills: [] };
    db.comps.push(c);
    saveNow();
    push({ type: 'editor', compId: c.id, step: 0 });
  }

  function goStep(o, step) {
    const c = getComp(o.compId);
    if (!c) return;
    if (step > 0 && !c.name.trim()) {
      o.step = 0; o.resetScroll = true; render();
      shake('[data-bind="comp.name"]', 'Сначала напиши название соревнований');
      return;
    }
    if (o.step === 3) commitDrill(o);
    o.step = Math.max(0, Math.min(3, step));
    o.resetScroll = true;
    render();
  }

  function commitDrill(o) {
    const c = getComp(o.compId);
    const text = (o.newDrill || '').trim();
    if (!c || !text) return false;
    c.drills.push({ id: uid(), text: text, done: false });
    o.newDrill = '';
    saveNow();
    return true;
  }

  async function finish(o) {
    const c = getComp(o.compId);
    if (!c) return;
    commitDrill(o);
    if (!c.name.trim()) { goStep(o, 1); return; }
    if (!c.fights.length) {
      const addFight = await ask({ title: 'Боёв пока нет', text: 'Добавить бой или сохранить так?', yes: 'Добавить бой', no: 'Сохранить так' });
      if (top() !== o) return;
      if (addFight) { goStep(o, 1); return; }
    }
    c.done = true;
    o.finished = true;
    saveNow();
    replaceTop({ type: 'coach' });
  }

  function openFight(o, fightId) {
    const c = getComp(o.compId);
    if (!c) return;
    const idx = c.fights.findIndex((f) => f.id === fightId);
    const src = idx >= 0 ? c.fights[idx] : { task: '', my: 0, opp: 0, result: null, good: '', bad: '' };
    push({
      type: 'fight', compId: c.id, fightId: idx >= 0 ? fightId : null, num: idx >= 0 ? idx + 1 : c.fights.length + 1,
      touched: idx >= 0 && !!src.result,
      draft: { task: src.task, my: src.my, opp: src.opp, result: src.result, good: src.good, bad: src.bad }
    });
  }

  function syncFightUi(o) {
    $$('[data-num]').forEach((el) => { el.textContent = o.draft[el.dataset.num]; });
    $$('#fight-result button').forEach((b) => {
      const on = b.dataset.val === o.draft.result;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  }

  function saveFight(o) {
    const c = getComp(o.compId);
    if (!c) return;
    const d = o.draft;
    if (!d.result) {
      const box = $('#fight-result');
      if (box) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast('Отметь, чем закончился бой');
      return;
    }
    const data = { task: d.task.trim(), my: d.my, opp: d.opp, result: d.result, good: d.good.trim(), bad: d.bad.trim() };
    const f = o.fightId && c.fights.find((x) => x.id === o.fightId);
    if (f) Object.assign(f, data); else c.fights.push(Object.assign({ id: uid() }, data));
    saveNow();
    closeTop();
  }

  function exportData() {
    saveNow();
    const payload = JSON.stringify({ app: 'soyuz-diary', version: 1, exportedAt: new Date().toISOString(), db: db }, null, 2);
    const name = 'dnevnik-soyuz-' + todayStr() + '.json';
    let file = null;
    try { file = new File([payload], name, { type: 'application/json' }); } catch (e) { /* старый браузер */ }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Дневник спортсмена' }).catch(() => {});
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Копия сохранена в «Загрузки»');
  }

  function importData(file) {
    const r = new FileReader();
    r.onload = async () => {
      let parsed = null;
      try { parsed = JSON.parse(String(r.result)); } catch (e) { /* не тот файл */ }
      const src = parsed && (parsed.db || parsed);
      if (!src || !Array.isArray(src.comps)) { toast('Это не файл дневника'); return; }
      const n = src.comps.length;
      const ok = await ask({ title: 'Загрузить копию?', text: 'В копии ' + n + ' ' + pl(n, ['соревнование', 'соревнования', 'соревнований']) + '. Записи в телефоне будут заменены.', yes: 'Загрузить', no: 'Отмена' });
      if (!ok) return;
      db = normalize(src);
      db.onboarded = true;
      saveNow();
      render();
      toast('Дневник загружен');
    };
    r.readAsText(file);
  }

  function setCoachPhoto(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 640;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k);
      cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      try {
        localStorage.setItem(COACH_KEY, cv.toDataURL('image/jpeg', 0.86));
        toast('Фото тренера обновлено');
      } catch (e) { toast('Фото слишком большое'); }
      render();
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Не получилось открыть фото'); };
    img.src = url;
  }

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const o = top();

    switch (act) {
      case 'tab':
        ui.tab = el.dataset.tab; render(); break;
      case 'season':
        ui.season = Number(el.dataset.val); render(); break;
      case 'new-comp':
        newComp(); break;
      case 'continue':
        push({ type: 'editor', compId: el.dataset.id, step: getComp(el.dataset.id) && getComp(el.dataset.id).name.trim() ? 1 : 0 }); break;
      case 'open':
        push({ type: 'detail', compId: el.dataset.id }); break;
      case 'settings':
        push({ type: 'settings' }); break;
      case 'close':
        closeTop(); break;

      case 'step':
        if (o && o.type === 'editor') goStep(o, Number(el.dataset.step)); break;
      case 'next':
        if (o && o.type === 'editor') goStep(o, o.step + 1); break;
      case 'prev':
        if (o && o.type === 'editor') goStep(o, o.step - 1); break;
      case 'finish':
        if (o && o.type === 'editor') finish(o); break;

      case 'add-fight':
        if (o && o.type === 'editor') openFight(o, null); break;
      case 'edit-fight':
        if (o && o.type === 'editor') openFight(o, el.dataset.fid); break;
      case 'inc':
      case 'dec':
        if (o && o.type === 'fight') {
          const k = el.dataset.field;
          o.draft[k] = Math.max(0, Math.min(99, o.draft[k] + (act === 'inc' ? 1 : -1)));
          if (!o.touched) o.draft.result = o.draft.my > o.draft.opp ? 'win' : o.draft.my < o.draft.opp ? 'loss' : null;
          syncFightUi(o);
        }
        break;
      case 'result':
        if (o && o.type === 'fight') { o.draft.result = el.dataset.val; o.touched = true; syncFightUi(o); }
        break;
      case 'save-fight':
        if (o && o.type === 'fight') saveFight(o); break;
      case 'del-fight':
        if (o && o.type === 'fight' && await ask({ title: 'Удалить этот бой?', yes: 'Удалить', no: 'Оставить', danger: true })) {
          const c = getComp(o.compId);
          if (c && top() === o) { c.fights = c.fights.filter((f) => f.id !== o.fightId); saveNow(); closeTop(); }
        }
        break;

      case 'rank':
        if (o && o.type === 'editor') {
          const c = getComp(o.compId);
          const v = Number(el.dataset.val);
          c.rank = c.rank === v ? null : v;
          saveNow(); render();
        }
        break;

      case 'add-drill':
        if (o && o.type === 'editor') {
          if (commitDrill(o)) { render(); const t = $('[data-bind="drill.new"]'); if (t) t.focus(); }
          else shake('[data-bind="drill.new"]', 'Сначала напиши задание');
        }
        break;
      case 'del-drill':
        if (o && o.type === 'editor') {
          const c = getComp(o.compId);
          c.drills = c.drills.filter((d) => d.id !== el.dataset.did);
          saveNow(); render();
        }
        break;
      case 'toggle-drill': {
        const c = getComp(el.dataset.id);
        const d = c && c.drills.find((x) => x.id === el.dataset.did);
        if (d) { d.done = !d.done; saveNow(); render(); if (d.done) toast('Молодец! Задание выполнено'); }
        break;
      }

      case 'edit-comp':
        if (o && o.type === 'detail') {
          const c = getComp(o.compId);
          push({ type: 'editor', compId: o.compId, step: c && !c.done && c.name.trim() ? 1 : 0 });
        }
        break;
      case 'del-comp':
        if (o && o.type === 'detail' && await ask({ title: 'Удалить соревнование?', text: 'Запись исчезнет из дневника навсегда.', yes: 'Удалить', no: 'Оставить', danger: true })) {
          if (top() === o) { db.comps = db.comps.filter((c) => c.id !== o.compId); saveNow(); closeTop(); toast('Запись удалена'); }
        }
        break;

      case 'belt':
        db.profile.belt = el.dataset.val; saveNow(); render(); break;
      case 'onboard-done':
        if (!db.profile.name.trim()) { shake('[data-bind="profile.name"]', 'Напиши своё имя'); break; }
        db.profile.name = db.profile.name.trim();
        db.onboarded = true; saveNow(); render(); break;

      case 'coach-preview':
        push({ type: 'coach', preview: true }); break;
      case 'coach-reset':
        try { localStorage.removeItem(COACH_KEY); } catch (err) { /* нечего удалять */ }
        render(); break;
      case 'export':
        exportData(); break;

      case 'install':
        if (ui.installEvt) { ui.installEvt.prompt(); ui.installEvt = null; render(); }
        break;
      case 'hide-hint':
        try { localStorage.setItem(HINT_KEY, '1'); } catch (err) { /* скроем до перезапуска */ }
        render(); break;
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    const bind = el.dataset && el.dataset.bind;
    if (!bind) return;
    const o = top();
    const v = el.value;
    if (bind === 'profile.name') { db.profile.name = v; saveSoon(); }
    else if (bind.indexOf('comp.') === 0 && o && o.type === 'editor') {
      const c = getComp(o.compId);
      const k = bind.slice(5);
      if (k === 'date') { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) c.date = v; }
      else c[k] = v;
      if (k === 'name') { const h = $('.sheet-top h2'); if (h) h.textContent = v.trim() || 'Новое соревнование'; }
      saveSoon();
    }
    else if (bind.indexOf('fight.') === 0 && o && o.type === 'fight') o.draft[bind.slice(6)] = v;
    else if (bind === 'drill.new' && o && o.type === 'editor') o.newDrill = v;
    if (el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight + 4, 92) + 'px'; }
  });

  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.file || !el.files || !el.files[0]) return;
    if (el.dataset.file === 'coach') setCoachPhoto(el.files[0]);
    else if (el.dataset.file === 'import') importData(el.files[0]);
    el.value = '';
  });

  // Enter в однострочных полях убирает клавиатуру, а не отправляет форму
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur();
  });

  // Если картинки нет (логотип или фото тренера) — аккуратно заменяем
  document.addEventListener('error', (e) => {
    const el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    if (el.hasAttribute('data-hide-on-error')) el.style.display = 'none';
    else if (el.hasAttribute('data-avatar') && el.src !== AVATAR) el.src = AVATAR;
  }, true);

  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ui.installEvt = e;
    if (!ui.stack.length) render();
  });

  // Работа без интернета
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (!local || /[?&]sw=1/.test(location.search)) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
      // Сохраняем уже загруженные файлы шрифтов, чтобы без интернета всё выглядело так же
      navigator.serviceWorker.ready.then(() => {
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        return fontsReady.then(() => new Promise((r) => setTimeout(r, 1200)));
      }).then(() => {
        if (!window.caches || !window.performance || !performance.getEntriesByType) return;
        const urls = performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.indexOf('https://fonts.gstatic.com/') === 0);
        if (!urls.length) return;
        return caches.open('soyuz-diary-fonts').then((c) => Promise.all(urls.map((u) => c.match(u).then((hit) => hit || c.add(u)))));
      }).catch(() => {});
    }
  }

  render();
})();
