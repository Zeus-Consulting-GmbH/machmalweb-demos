(function () {
    'use strict';

    var mqDesktop = window.matchMedia('(min-width: 861px)');
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    var nav = document.getElementById('siteNav');
    var toggle = document.getElementById('navToggle');

    function currentId() {
        var id = (location.hash || '#start').replace('#', '');
        return document.getElementById(id) ? id : 'start';
    }

    function markNav(id) {
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
    }

    function showPage(id) {
        sections.forEach(function (section) {
            section.classList.toggle('active', section.id === id);
        });
        markNav(id);
        document.title = 'ICT Baden GmbH – ' +
            (document.getElementById(id).dataset.title || 'Softwareentwicklung');
    }

    function route() {
        var id = currentId();
        if (mqDesktop.matches) {
            showPage(id);
            window.scrollTo(0, 0);
        } else {
            markNav(id);
        }
        closeMenu();
    }

    window.addEventListener('hashchange', route);

    // Beim Umschalten Desktop <-> Mobil den passenden Zustand herstellen
    var onMq = function () {
        if (mqDesktop.matches) {
            showPage(currentId());
            window.scrollTo(0, 0);
        } else {
            sections.forEach(function (s) { s.classList.remove('active'); });
            markNav(currentId());
        }
    };
    if (mqDesktop.addEventListener) { mqDesktop.addEventListener('change', onMq); }
    else { mqDesktop.addListener(onMq); }

    // Mobil: Scrollspy markiert den sichtbaren Abschnitt im Menü
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            if (mqDesktop.matches) { return; }
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    markNav(entry.target.id);
                    history.replaceState(null, '', '#' + entry.target.id);
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(function (section) { spy.observe(section); });
    }

    // Burger-Menü
    function closeMenu() {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });

    // Pulswertigkeits-Rechner
    var calcIds = ['impulses', 'factor', 'MwImpulses', 'MwVolts', 'MwVoltsDiv', 'MwAmps', 'MwAmpsDiv'];

    function num(id) {
        var value = parseFloat(document.getElementById(id).value.replace(',', '.'));
        return isFinite(value) ? value : NaN;
    }

    function fmt(value) {
        if (!isFinite(value)) { return '–'; }
        return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 }).format(value);
    }

    function calc() {
        var pulse = (num('factor') * 1000) / num('impulses');
        document.getElementById('pulse').textContent = fmt(pulse);

        var mwFactor = (num('MwVolts') / num('MwVoltsDiv')) * (num('MwAmps') / num('MwAmpsDiv'));
        var mwPulse = (mwFactor * 1000) / num('MwImpulses');
        document.getElementById('MwPulse').textContent = fmt(mwPulse);
    }

    calcIds.forEach(function (id) {
        var input = document.getElementById(id);
        if (input) { input.addEventListener('input', calc); }
    });
    if (document.getElementById('pulse')) { calc(); }

    document.getElementById('year').textContent = String(new Date().getFullYear());

    route();
})();
