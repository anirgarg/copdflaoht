(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Active nav link highlighting by current file (also works for action-plan/copd-v2.html)
  const current = (location.pathname.replace(/\\/g,"/").toLowerCase());
  $$("nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (!href) return;
    // match end-of-path so "action-plan/copd-v2.html" can be active
    if (current.endsWith("/"+href) || current.endsWith(href)) a.classList.add("active");
  });

  // Back to top
  const btt = $("#backToTop");
  if (btt) {
    const onScroll = () => {
      if (window.scrollY > 350) btt.classList.add("show");
      else btt.classList.remove("show");
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    btt.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
    onScroll();
  }

  // Simple search: highlights matches in headings + list items + paragraphs inside main
  const input = $("#searchInput");
  const clearBtn = $("#searchClear");

  const clearMarks = () => {
    $$("mark").forEach(m => {
      const txt = document.createTextNode(m.textContent);
      m.replaceWith(txt);
    });
  };

  const markMatches = (term) => {
    const t = term.trim();
    if (!t) return;

    // Only search within main content
    const nodes = $$("main h2, main h3, main h4, main p, main li, main .node, main .row");
    const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");

    nodes.forEach(el => {
      // Avoid marking buttons/links
      if (el.closest("button") || el.closest("a")) return;

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(n => {
        const s = n.nodeValue;
        if (!s || !re.test(s)) return;
        const frag = document.createDocumentFragment();
        let last = 0;
        s.replace(re, (match, p1, offset) => {
          frag.appendChild(document.createTextNode(s.slice(last, offset)));
          const mk = document.createElement("mark");
          mk.textContent = match;
          frag.appendChild(mk);
          last = offset + match.length;
          return match;
        });
        frag.appendChild(document.createTextNode(s.slice(last)));
        n.parentNode.replaceChild(frag, n);
      });
    });

    // Jump to first highlight
    const first = $("mark");
    if (first) first.scrollIntoView({behavior:"smooth", block:"center"});
  };

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        clearMarks();
        markMatches(input.value);
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (input) input.value = "";
      clearMarks();
    });
  }
})();
