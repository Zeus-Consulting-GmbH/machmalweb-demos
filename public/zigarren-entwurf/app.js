// Erstentwurf Zigarrenhandel – Altersabfrage, Menü, Anfrageliste, Formulare
(function () {
    var ALTER_KEY = 'alter-18-bestaetigt';
    var LISTE_KEY = 'anfrageliste';

    function lesen(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function schreiben(key, wert) { try { localStorage.setItem(key, wert); } catch (e) { /* privat, egal */ } }

    // ---------- Altersabfrage ----------
    var abfrage = document.getElementById('altersabfrage');
    if (abfrage) {
        if (lesen(ALTER_KEY) !== 'ja') document.documentElement.classList.add('gesperrt');
        document.getElementById('alterJa').addEventListener('click', function () {
            schreiben(ALTER_KEY, 'ja');
            document.documentElement.classList.remove('gesperrt');
        });
        document.getElementById('alterNein').addEventListener('click', function () {
            abfrage.classList.add('abgelehnt');
        });
        var zurueck = document.getElementById('alterZurueck');
        if (zurueck) zurueck.addEventListener('click', function () { abfrage.classList.remove('abgelehnt'); });
    }

    // ---------- Menü ----------
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('siteNav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var offen = nav.classList.toggle('offen');
            toggle.setAttribute('aria-expanded', offen ? 'true' : 'false');
        });
    }

    // ---------- Anfrageliste ----------
    function liste() {
        try { return JSON.parse(lesen(LISTE_KEY)) || []; } catch (e) { return []; }
    }
    function speichern(eintraege) {
        schreiben(LISTE_KEY, JSON.stringify(eintraege));
        zaehlerAktualisieren();
        listeZeigen();
    }
    function zaehlerAktualisieren() {
        var summe = liste().length;
        document.querySelectorAll('.zaehler').forEach(function (z) {
            z.textContent = summe;
            if (summe) z.removeAttribute('data-leer'); else z.setAttribute('data-leer', '');
        });
    }
    function hinzufuegen(kat, titel, menge, einheit) {
        var eintraege = liste();
        var gleich = eintraege.find(function (e) { return e.kat === kat && e.titel === titel && e.einheit === einheit; });
        if (gleich) gleich.menge += menge;
        else eintraege.push({ id: Date.now() + '' + Math.random().toString(16).slice(2, 6), kat: kat, titel: titel, menge: menge, einheit: einheit });
        speichern(eintraege);
        toast('„' + titel + '“ ist auf der Anfrageliste.');
    }

    var toastEl, toastTimer;
    function toast(text) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.innerHTML = '';
        var span = document.createElement('span');
        span.textContent = text;
        var link = document.createElement('a');
        link.href = '/anfrage';
        link.textContent = 'Zur Anfrageliste →';
        toastEl.appendChild(span);
        toastEl.appendChild(link);
        toastEl.classList.add('zeigen');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('zeigen'); }, 4200);
    }

    // „Anfragen“ an Produkten
    document.querySelectorAll('[data-anfrage]').forEach(function (knopf) {
        knopf.addEventListener('click', function () {
            var karte = knopf.closest('.produkt') || knopf.closest('[data-karte]');
            var mengeFeld = karte && karte.querySelector('input[type=number]');
            var einheitFeld = karte && karte.querySelector('select');
            var menge = Math.max(1, parseInt(mengeFeld && mengeFeld.value, 10) || 1);
            hinzufuegen(knopf.dataset.kat, knopf.dataset.titel, menge, einheitFeld ? einheitFeld.value : 'Stück');
        });
    });

    // Freie Anfrage je Kategorie („Ich suche …“)
    document.querySelectorAll('form[data-freie-anfrage]').forEach(function (form) {
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var text = form.querySelector('[name=wunsch]').value.trim();
            if (!text) return;
            var menge = Math.max(1, parseInt(form.querySelector('[name=menge]').value, 10) || 1);
            hinzufuegen(form.dataset.kat, text, menge, 'Stück');
            form.reset();
        });
    });

    // Liste auf /anfrage
    var listeEl = document.getElementById('anfrageListe');
    function listeZeigen() {
        if (!listeEl) return;
        var eintraege = liste();
        listeEl.innerHTML = '';
        document.getElementById('listeLeer').hidden = eintraege.length > 0;
        eintraege.forEach(function (e) {
            var li = document.createElement('li');
            var text = document.createElement('div');
            var kat = document.createElement('span'); kat.className = 'kat-name'; kat.textContent = e.kat;
            var titel = document.createElement('span'); titel.className = 'titel'; titel.textContent = e.titel;
            text.appendChild(kat); text.appendChild(titel);

            var wrap = document.createElement('div'); wrap.className = 'menge-wrap';
            wrap.style.display = 'flex'; wrap.style.alignItems = 'center'; wrap.style.gap = '8px';
            var menge = document.createElement('div'); menge.className = 'menge';
            var minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', 'Weniger');
            var zahl = document.createElement('span'); zahl.textContent = e.menge;
            var plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Mehr');
            menge.appendChild(minus); menge.appendChild(zahl); menge.appendChild(plus);
            var einheit = document.createElement('span'); einheit.className = 'einheit'; einheit.textContent = einheitText(e);
            wrap.appendChild(menge); wrap.appendChild(einheit);

            var weg = document.createElement('button'); weg.type = 'button'; weg.className = 'entfernen'; weg.innerHTML = '&times;'; weg.setAttribute('aria-label', 'Entfernen');

            minus.addEventListener('click', function () { aendern(e.id, -1); });
            plus.addEventListener('click', function () { aendern(e.id, 1); });
            weg.addEventListener('click', function () { speichern(liste().filter(function (x) { return x.id !== e.id; })); });

            li.appendChild(text); li.appendChild(wrap); li.appendChild(weg);
            listeEl.appendChild(li);
        });
        var feld = document.getElementById('produkteFeld');
        if (feld && !feld.dataset.bearbeitet) feld.value = listeAlsText(eintraege);
    }
    function aendern(id, um) {
        var eintraege = liste();
        eintraege.forEach(function (e) { if (e.id === id) e.menge = Math.max(1, e.menge + um); });
        speichern(eintraege);
    }
    var MEHRZAHL = { 'Kiste': 'Kisten', 'Flasche': 'Flaschen', 'Packung': 'Packungen', 'Ausgabe': 'Ausgaben' };
    function einheitText(e) { return e.menge > 1 && MEHRZAHL[e.einheit] ? MEHRZAHL[e.einheit] : e.einheit; }
    function listeAlsText(eintraege) {
        return eintraege.map(function (e) { return '• ' + e.titel + ' – ' + e.menge + ' ' + einheitText(e) + ' (' + e.kat + ')'; }).join('\n');
    }
    var produkteFeld = document.getElementById('produkteFeld');
    if (produkteFeld) produkteFeld.addEventListener('input', function () { produkteFeld.dataset.bearbeitet = '1'; });
    var leeren = document.getElementById('listeLeeren');
    if (leeren) leeren.addEventListener('click', function () { if (produkteFeld) delete produkteFeld.dataset.bearbeitet; speichern([]); });

    // Mailto-Link mit der Liste im Text (Empfänger folgt)
    var mailto = document.getElementById('mailtoAnfrage');
    if (mailto) mailto.addEventListener('click', function () {
        var text = 'Guten Tag,\n\nich interessiere mich für folgende Artikel:\n\n' + (listeAlsText(liste()) || '…') + '\n\nViele Grüße';
        mailto.href = 'mailto:?subject=' + encodeURIComponent('Anfrage über die Website') + '&body=' + encodeURIComponent(text);
    });

    // ---------- Formulare (Entwurf: es wird nichts verschickt) ----------
    document.querySelectorAll('form[data-entwurf]').forEach(function (form) {
        form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            if (!form.reportValidity()) return;
            var meldung = form.querySelector('.form-meldung');
            meldung.className = 'form-meldung entwurf zeigen voll';
            meldung.textContent = form.dataset.entwurf;
            meldung.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    });

    // Event vorauswählen, wenn man über „Anmelden“ kommt
    document.querySelectorAll('[data-event]').forEach(function (a) {
        a.addEventListener('click', function () {
            var sel = document.getElementById('eventWahl');
            if (sel) sel.value = a.dataset.event;
        });
    });

    zaehlerAktualisieren();
    listeZeigen();
})();
