'use strict';

/* ==========================================================
   LAUNCH SETTINGS - edit this block only.
   Before the launch date every buy button reads "Pre-order";
   from the launch date onwards it switches to "Buy" by itself.
   Replace each url with the book's direct product page as
   soon as the listings are live.
   ========================================================== */
const LAUNCH = {
    date: '2026-11-24T00:00:00+05:30',
    retailers: [{
        name: 'Amazon',
        meta: 'amazon.in',
        url: 'https://www.amazon.in/s?k=A+Life+You+Recognise+Pooja+Prakash'
    }, {
        name: 'Flipkart',
        meta: 'flipkart.com',
        url: 'https://www.flipkart.com/search?q=A+Life+You+Recognise+Pooja+Prakash'
    }]
};

const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)],
    scenes = $$('.scene'),
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0,
    busy = false,
    lastWheel = 0;
document.body.dataset.scene = '0';

/* ---------- scroll wheel: one drum that turns with every scroll, swipe and scene change ---------- */
const wheel = $('#wheel'),
    cyl = $('.wheel-cyl'),
    RIB_STEP = 45;
for (let i = 0; i < 24; i++) {
    const f = document.createElement('i');
    f.style.setProperty('--i', i);
    if (i === 0) f.className = 'idx';
    cyl.append(f)
}
let roll = 0,
    lastInteract = Date.now();

/* roll is in degrees; positive = the front of the drum moves down (scrolling forward) */
function rollWheel(deg, dur) {
    roll += deg;
    cyl.style.transitionDuration = (reduce ? 0 : dur) + 's';
    cyl.style.transform = 'rotateX(' + (-roll) + 'deg)'
}

function syncWheel() {
    const last = current === scenes.length - 1;
    wheel.setAttribute('aria-label', last ? 'Back to the start' : 'Next scene');
    wheel.classList.toggle('at-end', last)
}
wheel.onclick = () => go(current === scenes.length - 1 ? 0 : current + 1);
setInterval(() => {
    if (reduce || busy || document.hidden || $('dialog[open]')) return;
    if (current === scenes.length - 1 || Date.now() - lastInteract < 3000) return;
    rollWheel(22.5, 1.1)
}, 3400);

function swapTo(index) {
    current = index;
    document.body.dataset.scene = String(current);
    scenes.forEach((s, i) => {
        s.classList.toggle('active', i === current);
        s.inert = i !== current;
        if (i === current) s.scrollTop = 0
    });
    $$('.route-dots button').forEach((b, i) => {
        if (i === current) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current')
    });
    $('#position').textContent = String(current).padStart(2, '0') + ' / 06';
    $('#previous').disabled = current === 0;
    $('#next').disabled = current === 6;
    $('#next').setAttribute('aria-label', current === 6 ? 'End of journey' : 'Next scene');
    syncWheel()
}

function go(index) {
    index = Math.max(0, Math.min(scenes.length - 1, index));
    if (busy) return;
    $$('dialog[open]').forEach(d => d.close());
    if (index === current) return;
    busy = true;
    lastInteract = Date.now();
    const dir = index > current ? 1 : -1,
        jump = Math.abs(index - current),
        from = scenes[current],
        to = scenes[index];
    document.body.style.setProperty('--dir', dir);
    rollWheel(dir * RIB_STEP * Math.min(jump, 4), jump > 2 ? 1.4 : .95);
    playTone();
    if (reduce) {
        swapTo(index);
        busy = false;
        return
    }
    from.classList.add('leaving');
    setTimeout(() => {
        from.classList.remove('leaving');
        to.classList.add('entering');
        swapTo(index);
        setTimeout(() => to.classList.remove('entering'), 950);
        setTimeout(() => {
            busy = false
        }, 650)
    }, 440)
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.go))));
$('#previous').onclick = () => go(current - 1);
$('#next').onclick = () => go(current + 1);
$('#previous').disabled = true;
addEventListener('wheel', e => {
    if ($('dialog[open]')) return;
    lastInteract = Date.now();
    rollWheel(Math.max(-30, Math.min(30, e.deltaY * .25)), .35);
    if (busy) return;
    const s = scenes[current];
    if (s.scrollHeight > s.clientHeight + 5) {
        if (e.deltaY > 0 && s.scrollTop + s.clientHeight < s.scrollHeight - 4) return;
        if (e.deltaY < 0 && s.scrollTop > 4) return
    }
    if (Math.abs(e.deltaY) < 25 || Date.now() - lastWheel < 1200) return;
    lastWheel = Date.now();
    go(current + Math.sign(e.deltaY))
}, {
    passive: true
});
addEventListener('keydown', e => {
    if ($('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        go(current + 1)
    }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        go(current - 1)
    }
    if (e.key === 'Home') {
        e.preventDefault();
        go(0)
    }
});
let touchY = 0,
    touchLastY = 0;
addEventListener('touchstart', e => {
    touchY = touchLastY = e.touches[0].clientY
}, {
    passive: true
});
addEventListener('touchmove', e => {
    const y = e.touches[0].clientY;
    rollWheel(Math.max(-20, Math.min(20, (touchLastY - y) * .5)), .2);
    touchLastY = y;
    lastInteract = Date.now()
}, {
    passive: true
});
addEventListener('touchend', e => {
    if ($('dialog[open]')) return;
    const s = scenes[current];
    if (s.scrollHeight > s.clientHeight + 5) return;
    const d = touchY - e.changedTouches[0].clientY;
    if (Math.abs(d) > 75) go(current + Math.sign(d))
}, {
    passive: true
});
const tests = {
    work: ['If you take the promotion, what does your Tuesday become?', 'Picture the commute, the hours, the responsibilities and the energy you have left after work. Do you want the ordinary life that comes with the title?'],
    love: ['Do you want the everyday life you would build together?', 'Think about a tired evening, shared responsibilities, disagreement and the room you have to remain yourself. Look beyond the feeling of being chosen.'],
    change: ['What would an ordinary Tuesday look like after the change?', 'Imagine the practical routine, the costs, the people and the trade-offs. What are you moving towards - and what are you hoping to leave behind?']
};
$$('[data-test]').forEach(b => b.onclick = () => {
    $$('[data-test]').forEach(x => x.classList.toggle('selected', x === b));
    const t = tests[b.dataset.test];
    $('#test-question').textContent = t[0];
    $('#test-detail').textContent = t[1];
    $('#test-result').classList.add('answered');
    playTone(330)
});
$('#voice-button').onclick = () => {
    const el = $('.voices'),
        clear = el.classList.toggle('cleared');
    $('#voice-button .lbl').textContent = clear ? 'LISTEN AGAIN' : 'MAKE ROOM FOR YOUR VOICE';
    playTone(440)
};
const themes = [{
    chapter: 'CHAPTERS FIVE & SIX',
    title: 'LOVE WITHOUT<br><em>DISAPPEARING.</em>',
    lead: 'How someone makes you feel matters. So does the everyday life you build together.',
    body: 'Explore the difference between intensity and a relationship you can live inside. Make room for love, mutual respect and a self that remains your own.',
    num: 5,
    read: 6
}, {
    chapter: 'CHAPTER EIGHT',
    title: 'WHAT IS YOUR<br><em>MONEY BUILDING?</em>',
    lead: 'Money is part of the architecture of your life. It is worth knowing what kind of life it is building.',
    body: 'Look at what comes in, what goes out and what you avoid looking at. The chapter asks what you want your money to make possible.',
    num: 8,
    read: 8
}, {
    chapter: 'CHAPTER NINE',
    title: 'MORE THAN<br><em>WHAT YOU DO.</em>',
    lead: 'Work can give you purpose, structure and pride. It can also take over the room.',
    body: 'Consider what work gives you, what makes it less sustainable, and which parts of your life you refuse to sacrifice indefinitely for it.',
    num: 9,
    read: 9
}, {
    chapter: 'CHAPTER FIFTEEN',
    title: 'LOVE THEM.<br><em>BE YOURSELF.</em>',
    lead: 'You can love your family and still become yourself.',
    body: 'Notice the expectations you have inherited. Which do you want to keep, question or release? This chapter makes room for gratitude without confusing it with obligation.',
    num: 15,
    read: 15
}, {
    chapter: 'CHAPTER SIXTEEN',
    title: 'WHOSE<br><em>SCOREBOARD?</em>',
    lead: 'A life can look impressive and still not feel right for the person living it.',
    body: 'Question the measures you have borrowed from other people. Look at the meaning of success, the cost of comparison and the everyday experience behind the photograph.',
    num: 16,
    read: 16
}];
let theme = 0;
$$('[data-theme]').forEach(b => b.onclick = () => {
    theme = +b.dataset.theme;
    const t = themes[theme];
    $$('[data-theme]').forEach(x => {
        x.classList.toggle('selected', x === b);
        x.setAttribute('aria-pressed', String(x === b))
    });
    $('#theme-chapter').textContent = t.chapter;
    $('#theme-title').innerHTML = t.title;
    $('#theme-lead').textContent = t.lead;
    $('#theme-body').textContent = t.body;
    $('.theme-number').innerHTML = String(t.num).padStart(2, '0') + '<span>/ 21 CHAPTERS</span>';
    const c = $('.theme-content');
    c.classList.remove('changing');
    void c.offsetWidth;
    c.classList.add('changing');
    playTone(260 + theme * 30)
});

function read(title, paras, label) {
    $$('dialog[open]').forEach(d => d.close());
    $('#reader-title').textContent = title;
    $('#reader-label').textContent = label;
    $('#reader-text').replaceChildren(...paras.map(t => {
        let p = document.createElement('p');
        p.textContent = t;
        return p
    }));
    $('#reader').showModal();
    $('#reader').scrollTop = 0;
    playTone(300)
}

function readChapter(n) {
    const c = BOOK_CHAPTERS[n - 1];
    read(c.title, c.paragraphs, 'CHAPTER ' + String(c.n).padStart(2, '0') + ' / EXCERPT')
}
$('#theme-read').onclick = () => readChapter(themes[theme].read);
$('#sample').onclick = () => readChapter(1);
$('#author-read').onclick = () => read('A note to my daughter', AUTHOR_NOTE, 'POOJA PRAKASH / AUTHOR’S NOTE');

function icon(name) {
    const NS = 'http://www.w3.org/2000/svg',
        svg = document.createElementNS(NS, 'svg'),
        use = document.createElementNS(NS, 'use');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg
}

function contents() {
    $$('dialog[open]').forEach(d => d.close());
    $('#chapter-dialog').showModal();
    $('#chapter-dialog').scrollTop = 0
}
$('#contents').onclick = contents;
$('#contents-two').onclick = contents;
$('#menu-chapters').onclick = contents;
BOOK_CHAPTERS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chapter-row';
    const num = document.createElement('span');
    num.textContent = String(c.n).padStart(2, '0');
    const t = document.createElement('b');
    t.textContent = c.title;
    b.append(num, t, icon('ur'));
    b.onclick = () => readChapter(c.n);
    $('#chapter-list').append(b)
});
$('#menu').onclick = () => {
    $('#menu-dialog').showModal();
    $('#menu').setAttribute('aria-expanded', 'true')
};
$('#menu-dialog').addEventListener('close', () => $('#menu').setAttribute('aria-expanded', 'false'));

/* ---------- pre-order / buy ---------- */
const launchAt = new Date(LAUNCH.date),
    released = Date.now() >= launchAt.getTime(),
    daysLeft = Math.ceil((launchAt.getTime() - Date.now()) / 864e5),
    longDate = launchAt.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
const BUY_TEXT = released ? {
    short: 'BUY NOW',
    long: 'BUY THE BOOK',
    cta: 'BUY THE BOOK',
    menu: 'BUY THE BOOK',
    header: 'BUY / A LIFE YOU RECOGNISE'
} : {
    short: 'PRE-ORDER',
    long: 'PRE-ORDER',
    cta: 'PRE-ORDER NOW',
    menu: 'PRE-ORDER THE BOOK',
    header: 'PRE-ORDER / A LIFE YOU RECOGNISE'
};
const RELEASE_TEXT = {
    tag: released ? 'OUT NOW' : 'OUT ' + longDate.toUpperCase(),
    key: released ? 'PUBLISHED' : 'RELEASE DATE',
    long: longDate,
    status: released ? 'OUT NOW' : 'PRE-ORDER NOW',
    count: released ? '' : daysLeft <= 1 ? 'OUT TOMORROW' : daysLeft + ' DAYS TO GO',
    reader: released ? 'Out now. Enjoyed this passage? Get the whole book.' : 'Out ' + longDate + '. Enjoyed this passage? Pre-order your copy.'
};
$$('[data-buy-label]').forEach(el => el.textContent = BUY_TEXT[el.dataset.buyLabel]);
$$('[data-release]').forEach(el => el.textContent = RELEASE_TEXT[el.dataset.release]);
LAUNCH.retailers.forEach(r => {
    const a = document.createElement('a');
    a.className = 'retailer';
    a.href = r.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', (released ? 'Buy' : 'Pre-order') + ' on ' + r.name + ' (opens in a new tab)');
    const n = document.createElement('span');
    n.className = 'lbl r-name';
    n.textContent = r.name.toUpperCase();
    const m = document.createElement('span');
    m.className = 'lbl r-meta';
    m.textContent = r.meta;
    a.append(n, m, icon('ur'));
    $('#retailer-list').append(a)
});

function openBuy() {
    $$('dialog[open]').forEach(d => d.close());
    $('#buy-dialog').showModal();
    $('#buy-dialog').scrollTop = 0;
    playTone(360)
}
$$('[data-buy]').forEach(b => b.addEventListener('click', openBuy));
function closeDialog(d) {
    if (!d.open || d.classList.contains('closing')) return;
    if (reduce) {
        d.close();
        return
    }
    d.classList.add('closing');
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        d.classList.remove('closing');
        d.close()
    };
    d.addEventListener('animationend', finish, {
        once: true
    });
    setTimeout(finish, 420)
}
$$('.close').forEach(b => b.onclick = () => closeDialog(b.closest('dialog')));
$$('dialog').forEach(d => d.addEventListener('cancel', e => {
    if (reduce) return;
    e.preventDefault();
    closeDialog(d)
}));
$$('dialog').forEach(d => d.addEventListener('click', e => {
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(d)
}));
let ac, gain, sound = false;

function playTone(freq = 220) {
    if (!sound || !ac) return;
    let o = ac.createOscillator(),
        g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * .6, ac.currentTime + .2);
    g.gain.setValueAtTime(.035, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .3);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + .3)
}
$('#sound').onclick = () => {
    if (!ac) {
        ac = new(window.AudioContext || window.webkitAudioContext)();
        gain = ac.createGain();
        gain.gain.value = .009;
        gain.connect(ac.destination);
        [82.41, 123.47, 164.81].forEach(f => {
            const o = ac.createOscillator();
            o.frequency.value = f;
            o.connect(gain);
            o.start()
        })
    }
    sound = !sound;
    sound ? ac.resume() : ac.suspend();
    $('#sound .lbl').textContent = sound ? 'SOUND ON' : 'SOUND OFF';
    $('#sound use').setAttribute('href', sound ? '#i-sound-on' : '#i-sound-off');
    $('#sound').setAttribute('aria-pressed', String(sound));
    $('#sound').setAttribute('aria-label', sound ? 'Turn sound off' : 'Turn sound on')
};
const paper = $('#paper'),
    ctx = paper.getContext('2d');
let w = 0,
    h = 0,
    px = 0,
    py = 0,
    tx = 0,
    ty = 0,
    tick = 0;
const particles = Array.from({
    length: 13
}, (_, i) => ({
    x: Math.sin(i * 75) * .5 + .5,
    y: Math.cos(i * 23) * .5 + .5,
    z: .4 + (i % 4) * .22,
    r: i * 1.3
}));

function resize() {
    w = innerWidth;
    h = innerHeight;
    const d = Math.min(devicePixelRatio, 1.5);
    paper.width = w * d;
    paper.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0)
}
resize();
addEventListener('resize', resize);
addEventListener('pointermove', e => {
    tx = (e.clientX / w - .5) * 2;
    ty = (e.clientY / h - .5) * 2
});

function render() {
    tick += reduce ? 0 : .003;
    px += (tx - px) * .04;
    py += (ty - py) * .04;
    ctx.clearRect(0, 0, w, h);
    if (!reduce) {
        for (const p of particles) {
            let x = p.x * w + Math.sin(tick + p.r) * 30 - px * 25 * p.z,
                y = p.y * h + Math.cos(tick * .6 + p.r) * 30 - py * 20 * p.z;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(p.r + Math.sin(tick) * .2);
            ctx.scale(p.z, p.z * .8);
            ctx.globalAlpha = current === 0 ? .2 : .1;
            ctx.fillStyle = '#dfd8bd';
            ctx.beginPath();
            ctx.moveTo(-15, -21);
            ctx.quadraticCurveTo(5, -28, 17, -19);
            ctx.lineTo(20, 23);
            ctx.quadraticCurveTo(0, 18, -14, 24);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#726955';
            ctx.filter = 'blur(1px)';
            for (let j = 0; j < 7; j++) ctx.fillRect(-9, -12 + j * 4, 18, 1);
            ctx.restore()
        }
    }
    requestAnimationFrame(render)
}
render();
const intro = $('.intro');

function revealHero() {
    intro.classList.add('revealed')
}

function armHeroReveal() {
    if (reduce || matchMedia('(hover: none)').matches) {
        setTimeout(revealHero, reduce ? 0 : 400);
        return
    }
    addEventListener('pointermove', revealHero, {
        once: true
    });
    addEventListener('keydown', revealHero, {
        once: true
    });
    addEventListener('touchstart', revealHero, {
        once: true
    })
}

function dismissLoader() {
    const l = $('#loader');
    if (l.classList.contains('done')) return;
    l.classList.add('done');
    armHeroReveal()
}
Promise.all(['hero.webp', 'journey.webp', 'cover.jpg'].map(src => new Promise(resolve => {
    const i = new Image();
    i.onload = i.onerror = resolve;
    i.src = src
}))).then(() => {
    setTimeout(dismissLoader, reduce ? 0 : 1200)
});
setTimeout(dismissLoader, 5000);