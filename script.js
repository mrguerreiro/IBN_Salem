/* =========================================================
   IBN Salem — interações
   ========================================================= */
(function () {
    "use strict";

    /* ---- Menu mobile ---- */
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");

    if (toggle && links) {
        toggle.addEventListener("click", function () {
            const isOpen = links.classList.toggle("open");
            toggle.innerHTML = isOpen
                ? '<i class="fas fa-xmark"></i>'
                : '<i class="fas fa-bars"></i>';
            toggle.setAttribute("aria-expanded", String(isOpen));
        });

        // Fecha o menu ao clicar em um link
        links.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                links.classList.remove("open");
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }

    /* ---- Reveal on scroll ---- */
    const revealEls = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window && revealEls.length) {
        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        revealEls.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        revealEls.forEach(function (el) {
            el.classList.add("is-visible");
        });
    }

    /* ---- Ano dinâmico no rodapé ---- */
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /* ---- Versículo do dia ---- */
    const verseTextEl = document.getElementById("verseText");
    const verseRefEl = document.getElementById("verseRef");

    if (verseTextEl && verseRefEl) {
        // Referências (em inglês, sempre reconhecidas pela API).
        // A API devolve a referência e o texto em português (Almeida).
        const REFERENCES = [
            "psalms 23:1", "philippians 4:13", "john 3:16", "jeremiah 29:11",
            "proverbs 3:5", "isaiah 41:10", "romans 8:28", "psalms 46:1",
            "joshua 1:9", "matthew 11:28", "psalms 121:2", "1 corinthians 13:4",
            "galatians 5:22", "ephesians 2:8", "psalms 37:5", "proverbs 16:3",
            "psalms 91:1", "isaiah 40:31", "2 timothy 1:7", "hebrews 11:1",
            "james 1:5", "1 peter 5:7", "psalms 118:24", "matthew 6:33",
            "john 14:6", "romans 12:2", "philippians 4:6", "psalms 34:8",
            "lamentations 3:23", "psalms 27:1", "micah 6:8", "colossians 3:23"
        ];

        // Dia do ano (1–366) -> mesmo versículo para todos, muda a cada dia
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);
        const ref = REFERENCES[dayOfYear % REFERENCES.length];

        const url = "https://bible-api.com/" +
            encodeURIComponent(ref) + "?translation=almeida";

        // Texto/referência atuais, limpos (sem aspas)
        function currentVerse() {
            return {
                text: verseTextEl.textContent.replace(/[“”"]/g, "").trim(),
                ref: verseRefEl.textContent.trim()
            };
        }

        /* --- Botão Ouvir (Web Speech API) --- */
        const listenBtn = document.getElementById("verseListen");
        const synth = window.speechSynthesis;

        if (listenBtn && synth && "SpeechSynthesisUtterance" in window) {
            function resetListenBtn() {
                listenBtn.classList.remove("is-playing");
                listenBtn.innerHTML = '<i class="fas fa-volume-high"></i> Ouvir';
            }

            listenBtn.addEventListener("click", function () {
                if (synth.speaking) {
                    synth.cancel();
                    resetListenBtn();
                    return;
                }
                const v = currentVerse();
                const utter = new SpeechSynthesisUtterance(v.text + ". " + v.ref);
                utter.lang = "pt-BR";
                utter.rate = 0.95;
                utter.onend = resetListenBtn;
                utter.onerror = resetListenBtn;
                synth.speak(utter);
                listenBtn.classList.add("is-playing");
                listenBtn.innerHTML = '<i class="fas fa-stop"></i> Parar';
            });

            // Interrompe a leitura ao sair da página
            window.addEventListener("beforeunload", function () {
                synth.cancel();
            });
        } else if (listenBtn) {
            listenBtn.style.display = "none";
        }

        /* --- Botão Compartilhar (WhatsApp) --- */
        const shareBtn = document.getElementById("verseShare");
        if (shareBtn) {
            shareBtn.addEventListener("click", function () {
                const v = currentVerse();
                const pageUrl = location.origin + location.pathname;
                const msg = "“" + v.text + "” — " + v.ref +
                    "\n\nIgreja Batista Nacional Salem\n" + pageUrl;
                window.open(
                    "https://wa.me/?text=" + encodeURIComponent(msg),
                    "_blank",
                    "noopener"
                );
            });
        }

        verseTextEl.classList.add("is-loading");

        fetch(url)
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(function (data) {
                if (data && data.text && data.reference) {
                    verseTextEl.textContent = "“" + data.text.trim() + "”";
                    verseRefEl.textContent = data.reference;
                }
            })
            .catch(function () {
                // Mantém o versículo de fallback já presente no HTML
            })
            .finally(function () {
                verseTextEl.classList.remove("is-loading");
            });
    }
})();
