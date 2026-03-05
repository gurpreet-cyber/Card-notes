const { useState, useRef, useEffect, useCallback } = React;
const _jsxFileName = "/home/claude/jsx-src/app.jsx"; function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
const MAX_CHARS = 250;
let uid = 0;
const mkNote = (index) => ({ id: ++uid, text: "", index });
let stackUid = 0;
const mkStack = () => ({ id: ++stackUid, notes: [mkNote(0)], createdAt: Date.now(), themeId: 'white' });

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ── Radial counter ── */
function RadialCounter({ used, max, metaColor }) {
  const R = 14, C = 2 * Math.PI * R;
  const pct = used / max;
  const fill = metaColor
    ? (pct >= 0.96 ? metaColor : pct >= 0.84 ? metaColor + "cc" : metaColor + "88")
    : (pct >= 0.96 ? "#111" : pct >= 0.84 ? "#555" : "#999");
  return (
    React.createElement('div', { style: { position: "relative", width: 34, height: 34, flexShrink: 0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 24}}
      , React.createElement('svg', { width: "34", height: "34", style: { transform: "rotate(-90deg)" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 25}}
        , React.createElement('circle', { cx: "17", cy: "17", r: R, fill: "none", stroke: "#e5e5e5", strokeWidth: "2.5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 26}} )
        , React.createElement('circle', { cx: "17", cy: "17", r: R, fill: "none", stroke: fill, strokeWidth: "2.5",
          strokeDasharray: C, strokeDashoffset: C - pct * C, strokeLinecap: "round",
          style: { transition: "stroke-dashoffset .2s, stroke .2s" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 27}} )
      )
      , React.createElement('span', { style: {
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 8, fontWeight: 600,
        color: fill, fontFamily: "'Inter', sans-serif",
      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 31}}, max - used)
    )
  );
}

/* ── Line parser ── */
function getLineType(raw) {
  if (raw.startsWith("### ")) return { type: "h3", prefix: "### " };
  if (raw.startsWith("## "))  return { type: "h2", prefix: "## " };
  if (raw.startsWith("# "))   return { type: "h1", prefix: "# " };
  if (raw.startsWith("* "))   return { type: "li", prefix: "* " };
  // Ordered list: "1. ", "12. " etc.
  const olMatch = raw.match(/^(\d+)\. /);
  if (olMatch) return { type: "ol", prefix: olMatch[0], num: parseInt(olMatch[1], 10) };
  return { type: "p", prefix: "" };
}

// LINE_STYLE is now derived per-theme in NoteCard and passed to LineBlock via props
const DEFAULT_TYPO = {
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.4 },
  h2: { fontSize: 17, fontWeight: 700, letterSpacing: -0.2 },
  h3: { fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" },
  li: { fontSize: 14, fontWeight: 400, letterSpacing: 0 },
  ol: { fontSize: 14, fontWeight: 400, letterSpacing: 0 },
  p:  { fontSize: 14, fontWeight: 400, letterSpacing: 0 },
};
const LINE_HEIGHTS = { h1: "1.35em", h2: "1.4em", h3: "1.5em", li: "1.6em", ol: "1.6em", p: "1.6em" };

/* ── Single editable line ── */
const LineBlock = React.forwardRef(function LineBlock({ raw, onChange, onEnter, onBackspace, isActive, showPlaceholder, textColor, metaColor, typo, fontScale, headingFont, bodyFont }, ref) {
  const divRef = useRef(null);
  React.useImperativeHandle(ref, () => divRef.current);

  const { type, prefix } = getLineType(raw);
  const content = raw.slice(prefix.length);
  const baseTypo = (typo && typo[type]) || DEFAULT_TYPO[type];
  const s = { ...DEFAULT_TYPO[type], ...baseTypo, lineHeight: LINE_HEIGHTS[type] };
  const isHeading = type === "h1" || type === "h2" || type === "h3";
  const isOl = type === "ol";
  const olNum = raw.match(/^(\d+)\. /) ? parseInt(raw.match(/^(\d+)\. /)[1], 10) : 1;
  const fontFamily = isHeading
    ? (headingFont ? `'${headingFont}', serif` : "'Inter', sans-serif")
    : (bodyFont ? `'${bodyFont}', sans-serif` : "'Inter', sans-serif");

  // Sync DOM content (not prefix) without disrupting cursor
  useEffect(() => {
    const el = divRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerText !== content) el.innerText = content;
  }, [content]);

  // Initial paint + force font re-apply when fontFamily changes
  useEffect(() => {
    if (divRef.current) divRef.current.innerText = content;
  }, []);
  
  // Re-apply styles when font/theme changes (contentEditable doesn't re-render naturally)
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    el.style.fontFamily = fontFamily;
    el.style.fontSize = Math.round(s.fontSize * (fontScale || 1)) + "px";
    el.style.fontWeight = s.fontWeight;
    el.style.letterSpacing = (s.letterSpacing || 0) + (typeof s.letterSpacing === 'number' ? 'px' : '');
    el.style.textTransform = s.textTransform || "none";
    el.style.fontStyle = s.fontStyle || "normal";
  }, [fontFamily, s.fontSize, s.fontWeight, s.letterSpacing, s.textTransform, s.fontStyle, fontScale]);

  const handleInput = () => {
    const el = divRef.current;
    if (!el) return;
    const typed = el.innerText;
    const fullText = prefix + typed;
    // Enforce 250 char limit — trim excess and restore caret
    if (fullText.length > MAX_CHARS) {
      const allowed = MAX_CHARS - prefix.length;
      const trimmed = typed.slice(0, allowed);
      el.innerText = trimmed;
      // Restore caret to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      onChange(prefix + trimmed);
      return;
    }
    onChange(fullText);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onEnter(raw); }
    if (e.key === "Backspace" && content === "") { e.preventDefault(); onBackspace(raw); }
    // Block any key that would exceed limit (except control keys)
    const el = divRef.current;
    if (!el) return;
    const currentFull = prefix + el.innerText;
    const isControlKey = e.key.length > 1 || e.ctrlKey || e.metaKey;
    if (!isControlKey && currentFull.length >= MAX_CHARS) {
      e.preventDefault();
    }
  };

  const isEmpty = !content;

  // Placeholder text per line type
  const placeholderText = (() => {
    if (!isEmpty) return null;
    if (!showPlaceholder && type === "p") return null;
    if (type === "h1") return "Heading 1";
    if (type === "h2") return "Heading 2";
    if (type === "h3") return "Heading 3";
    if (type === "li") return null; // bullet has its own dot
    if (type === "ol") return null; // number has its own prefix
    if (showPlaceholder) return "Type something...";
    return null;
  })();

  return (
    React.createElement('div', { style: { display: "flex", alignItems: "flex-start", position: "relative" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 155}}
      /* Bullet dot / number */
      , type === "li" && (
        React.createElement('span', { style: { color: metaColor || "#aaa", fontSize: 14, lineHeight: "1.6em", marginRight: 6, flexShrink: 0, userSelect: "none", pointerEvents: "none" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 158}}, "•")
      )
      , type === "ol" && (
        React.createElement('span', { style: { color: metaColor || "#aaa", fontSize: 14, lineHeight: "1.6em", marginRight: 5, flexShrink: 0, userSelect: "none", pointerEvents: "none", minWidth: 16, textAlign: "right" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 161}}, olNum, ".")
      )
      , React.createElement('div', { style: { flex: 1, position: "relative" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 163}}
        /* Placeholder overlay — sits behind the text, same font+size */
        , placeholderText && (
          React.createElement('span', { style: {
            position: "absolute", top: 0, left: 0,
            fontFamily: fontFamily,
            fontSize: Math.round(s.fontSize * (fontScale || 1)),
            fontWeight: s.fontWeight,
            lineHeight: s.lineHeight,
            letterSpacing: s.letterSpacing || "normal",
            textTransform: s.textTransform || "none",
            fontStyle: "italic",
            color: metaColor || "#ccc",
            opacity: 0.55,
            pointerEvents: "none", userSelect: "none",
            whiteSpace: "nowrap",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 166}}, placeholderText)
        )
        , React.createElement('div', {
          ref: divRef,
          contentEditable: isActive,
          suppressContentEditableWarning: true,
          onInput: handleInput,
          onKeyDown: handleKeyDown,
          onPointerDown: e => {
          if (!isActive) return;
          // Store start so we can detect swipe vs tap on move
          e.currentTarget._swipeStartX = e.clientX;
          e.currentTarget._swipeStartY = e.clientY;
          e.currentTarget._isSwiping = false;
          // Stop propagation immediately — prevent carousel stealing this tap.
          // Horizontal swipe is re-enabled in onPointerMove below.
          e.stopPropagation();
        },
        onPointerMove: e => {
          if (!isActive) return;
          const startX = _nullishCoalesce(e.currentTarget._swipeStartX, () => ( e.clientX));
          const startY = _nullishCoalesce(e.currentTarget._swipeStartY, () => ( e.clientY));
          const dx = Math.abs(e.clientX - startX);
          const dy = Math.abs(e.clientY - startY);
          // If clearly a horizontal swipe, let carousel take over
          if (dx > 8 && dx > dy * 1.5) {
            e.currentTarget._isSwiping = true;
            // Re-dispatch a new pointerdown on the parent so carousel picks it up
            const carousel = e.currentTarget.closest("[data-carousel]");
            if (carousel) {
              const synth = new PointerEvent("pointermove", { clientX: e.clientX, clientY: e.clientY, bubbles: true, pointerId: e.pointerId });
              carousel.dispatchEvent(synth);
            }
          }
        },
          style: {
            outline: "none",
            minHeight: s.lineHeight,
            fontFamily: fontFamily,
            caretColor: textColor || "#000",
            fontSize: Math.round(s.fontSize * (fontScale || 1)),
            fontWeight: s.fontWeight,
            lineHeight: s.lineHeight,
            letterSpacing: s.letterSpacing || "normal",
            textTransform: s.textTransform || "none",
            fontStyle: s.fontStyle || "normal",
            color: textColor || s.color,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 181}}
        )
      )
    )
  );
});

/* ── Colour contrast helper ── */
function hexLuminance(hex) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16)/255;
  const g = parseInt(h.slice(2,4),16)/255;
  const b = parseInt(h.slice(4,6),16)/255;
  const lin = x => x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
function contrastRatio(hex1, hex2) {
  const l1 = hexLuminance(hex1), l2 = hexLuminance(hex2);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}
// Given a bg colour and a theme, pick the best text/meta colours
function adaptColours(cardBg, theme) {
  if (!cardBg || !cardBg.startsWith('#') || cardBg.length < 7) {
    return { text: theme.text, meta: theme.meta };
  }
  const onDark = { text: theme.text.startsWith('#') && hexLuminance(theme.text) > 0.5 ? theme.text : "#f0f0f0", meta: theme.meta };
  const onLight = { text: theme.text.startsWith('#') && hexLuminance(theme.text) < 0.3 ? theme.text : "#111111", meta: theme.meta };
  const lum = hexLuminance(cardBg);
  return lum < 0.35 ? onDark : onLight;
}

/* ── Note card ── */
function NoteCard({ note, onChange, onDelete, isActive, count, active, onGoTo, theme, cardIndex, colorSeed }) {
  const T = theme || { card: "#fff", text: "#000", meta: "#aaa", border: "rgba(0,0,0,0.07)", palette: [] };
  const palette = T.palette && T.palette.length > 0 ? T.palette : [T.card];
  const safeIdx = (typeof cardIndex === 'number' && !isNaN(cardIndex)) ? cardIndex : 0;
  // Pick card colour: seeded random so it's stable per (themeId, cardIndex),
  // but guaranteed different from the previous card's colour.
  const cardBg = (() => {
    if (palette.length === 1) return palette[0];
    // Use note's own stable colorSeed so colour never changes on reorder
    const stableSeed = (colorSeed != null ? colorSeed : (note.colorSeed != null ? note.colorSeed : safeIdx * 7919));
    const pick = ((stableSeed * 1664525 + 1013904223) >>> 0) % palette.length;
    return palette[pick];
  })();
  const { text: cardTextColor, meta: cardMeta } = adaptColours(cardBg, T);
  const lineRefs = useRef([]);
  const textAreaRef = useRef(null);
  // autoFontScale is computed below — no state needed
  const rawLines = note.text ? note.text.split("\n") : [""];

  // Auto-focus first line when card becomes active (including initial mount)
  useEffect(() => {
    if (!isActive) return;
    const focusLine = () => {
      const el = lineRefs.current[0];
      if (!el) return;
      el.focus();
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch(_) {}
    };
    // First attempt immediately
    requestAnimationFrame(focusLine);
    // Second attempt after short delay — catches cases where DOM isn't ready
    const t = setTimeout(focusLine, 120);
    return () => clearTimeout(t);
  }, [isActive]);

  // Pre-calculate font scale so 250 chars always fits without scrolling or flash.
  // Available text height: card 380px - padding(32) - header(30) - footer(44) = 274px
  // Available width: card 300px - padding(40) = 260px
  // We estimate lines needed and scale down if necessary.
  const autoFontScale = (() => {
    const text = note.text || "";
    if (text.length === 0) return 1.0;
    const cardH = 292; // available px: 380 - 14 - 10 - 24 - 40
    const cardW = 264; // usable text width px: 300 - 36
    const baseFontSize = (T.typo && T.typo.p && T.typo.p.fontSize) || 14;
    const baseLineH = baseFontSize * 1.6;
    // Estimate chars per line: average char width ≈ fontSize * 0.52
    const charsPerLine = Math.floor(cardW / (baseFontSize * 0.52));
    // Count actual lines (respecting \n breaks)
    const rawLines = text.split("\n");
    let totalLines = 0;
    for (const line of rawLines) {
      totalLines += Math.max(1, Math.ceil((line.length || 1) / charsPerLine));
    }
    const neededH = totalLines * baseLineH;
    if (neededH <= cardH) return 1.0;
    // Scale down: ratio of available to needed, floored to 0.62
    return Math.max(0.62, cardH / neededH);
  })();

  const updateLine = (i, val) => {
    const prevType = getLineType(rawLines[i] || "").type;
    const newType = getLineType(val).type;
    const next = [...rawLines];
    next[i] = val;
    onChange(note.id, next.join("\n"));
    // If line type changed (e.g. "p" → "h1"), the LineBlock remounts due to key change.
    // Re-focus and place caret at end so user can keep typing without clicking again.
    if (prevType !== newType) {
      requestAnimationFrame(() => {
        const el = lineRefs.current[i];
        if (el) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  };

  const insertAfter = (i, currentRaw) => {
    const { type, prefix } = getLineType(currentRaw);
    const next = [...rawLines];
    if (type === "li" && currentRaw === prefix) {
      next[i] = "";
      onChange(note.id, next.join("\n"));
      requestAnimationFrame(() => { const el = lineRefs.current[i]; if (el) el.focus(); });
      return;
    }
    let newLine = "";
    if (type === "li") newLine = prefix;
    else if (type === "ol") {
      // If current ol line is empty (just the prefix, no content), exit list
      if (currentRaw === prefix) {
        next[i] = "";
        onChange(note.id, next.join("\n"));
        requestAnimationFrame(() => { const el = lineRefs.current[i]; if (el) el.focus(); });
        return;
      }
      const num = parseInt(prefix.match(/^(\d+)/)[1], 10);
      newLine = `${num + 1}. `;
    }
    next.splice(i + 1, 0, newLine);
    onChange(note.id, next.join("\n"));
    requestAnimationFrame(() => {
      const el = lineRefs.current[i + 1];
      if (el) { el.focus(); const r = document.createRange(); const s = window.getSelection(); r.setStart(el, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); }
    });
  };

  const backspaceAt = (i, currentRaw) => {
    const { type, prefix } = getLineType(currentRaw);
    const content = currentRaw.slice(prefix.length);
    if ((type !== "p") && content === "") {
      const next = [...rawLines]; next[i] = "";
      onChange(note.id, next.join("\n"));
      requestAnimationFrame(() => { const el = lineRefs.current[i]; if (el) { el.focus(); const r = document.createRange(); const s = window.getSelection(); r.setStart(el, 0); r.collapse(true); s.removeAllRanges(); s.addRange(r); } });
      return;
    }
    if (rawLines.length === 1) { onChange(note.id, ""); return; }
    const next = [...rawLines]; next.splice(i, 1);
    onChange(note.id, next.join("\n"));
    requestAnimationFrame(() => {
      const el = lineRefs.current[Math.max(0, i - 1)];
      if (el) { el.focus(); const r = document.createRange(); const s = window.getSelection(); r.selectNodeContents(el); r.collapse(false); s.removeAllRanges(); s.addRange(r); }
    });
  };

  return (
    React.createElement('div', { 'data-card-active': isActive ? "true" : "false", 'data-card-id': note.id, style: {
      width: "100%", height: "100%", background: cardBg,
      borderRadius: 16,
      boxShadow: isActive
        ? `0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px ${T.border}`
        : `0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px ${T.border}`,
      display: "flex", flexDirection: "column",
      padding: "14px 18px 10px", boxSizing: "border-box",
      overflow: "hidden", position: "relative",
      transition: "background 0.3s ease, box-shadow 0.3s ease",
    }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 401}}
      , ((active > 0 && active < count - 1) || (count === 2 && active === 1)) && (
        React.createElement('div', { style: { position: "absolute", top: 16, left: 20, fontSize: 11, fontWeight: 500, color: cardMeta, fontFamily: "'Inter', sans-serif", userSelect: "none" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 413}}
          , active + 1, React.createElement('span', { style: { color: T.border }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 414}}, "/"), count
        )
      )

      , isActive && (
        React.createElement('button', { onPointerDown: e => e.stopPropagation(),
          onClick: e => { e.stopPropagation(); onDelete(note.id); },
          style: { position: "absolute", top: 12, right: 14, background: "none", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: cardMeta, transition: "color .15s, background .15s", touchAction: "manipulation", padding: 0 },
          onMouseEnter: e => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = `${T.meta}22`; },
          onMouseLeave: e => { e.currentTarget.style.color = T.meta; e.currentTarget.style.background = "none"; }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 419}}
          , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 424}}
            , React.createElement('polyline', { points: "3 6 5 6 21 6"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 425}}), React.createElement('path', { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"            , __self: this, __source: {fileName: _jsxFileName, lineNumber: 425}})
            , React.createElement('path', { d: "M10 11v6M14 11v6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 426}}), React.createElement('path', { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"            , __self: this, __source: {fileName: _jsxFileName, lineNumber: 426}})
          )
        )
      )






      , React.createElement('div', { ref: textAreaRef, style: { flex: 1, marginTop: 24, overflowY: "hidden", display: "flex", flexDirection: "column", gap: 1, minHeight: 0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 436}}
        , rawLines.map((raw, i) => {
          const { type } = getLineType(raw);
          return (
            React.createElement(LineBlock, {
              key: `${i}-${type}-${T.id || "default"}`,
              ref: el => { lineRefs.current[i] = el; },
              raw: raw,
              isActive: isActive,
              showPlaceholder: i === 0 && rawLines.length === 1 || (getLineType(raw).type !== "p" && getLineType(raw).type !== "li"),
              textColor: cardTextColor || T.text,
              metaColor: cardMeta,
              typo: T.typo,
              fontScale: autoFontScale,
              headingFont: T.fonts && T.fonts.heading,
              bodyFont: T.fonts && T.fonts.body,
              onChange: val => updateLine(i, val),
              onEnter: (raw) => insertAfter(i, raw),
              onBackspace: (raw) => backspaceAt(i, raw), __self: this, __source: {fileName: _jsxFileName, lineNumber: 440}}
            )
          );
        })
      )





      , React.createElement('div', { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 464}}
        , React.createElement(RadialCounter, { used: note.text.length, max: MAX_CHARS, metaColor: cardMeta, 'data-ui-only': "1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 465}} )
        , React.createElement('div', { 'data-dots': "1", style: { display: "flex", gap: 4, alignItems: "center" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 466}}
          , (() => {
            const total = Math.min(count, 3);
            let start = active - 1;
            if (start < 0) start = 0;
            if (start + 2 >= count) start = Math.max(0, count - 3);
            return Array.from({ length: total }).map((_, j) => {
              const idx = start + j;
              const isAct = idx === active;
              return (
                React.createElement('button', { key: idx, onPointerDown: e => e.stopPropagation(),
                  onClick: e => { e.stopPropagation(); onGoTo(idx); },
                  style: { width: isAct ? 16 : 5, height: 5, borderRadius: 3, border: "none", padding: 0, background: isAct ? cardTextColor : cardMeta, cursor: "pointer", transition: "all .2s ease", touchAction: "manipulation", opacity: isAct ? 1 : 0.4 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 476}} )
              );
            });
          })()
        )
      )


    )
  );
}

/* ── Home screen card thumbnail ── */
function StackCard({ stack, theme }) {
  const firstNote = stack.notes.find(n => n.text.trim()) || stack.notes[0];
  const preview = firstNote.text.trim();
  const count = stack.notes.length;

  const T = theme || { card: "#fff", text: "#000", meta: "#aaaaaa", border: "rgba(0,0,0,0.07)", palette: [] };
  const palette = T.palette && T.palette.length > 0 ? T.palette : [T.card];
  const cardBg = palette[0] || T.card;
  const headingFont = T.fonts && T.fonts.heading ? `'${T.fonts.heading}', serif` : "'Inter', sans-serif";

  return (
    React.createElement('div', { style: {
      background: cardBg, borderRadius: 14,
      border: `1px solid ${T.border}`,
      overflow: "hidden", cursor: "pointer",
      transition: "box-shadow .15s, border-color .15s",
      display: "flex", flexDirection: "column",
      aspectRatio: "1 / 1",
      position: "relative",
    },
      onMouseEnter: e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; },
      onMouseLeave: e => { e.currentTarget.style.boxShadow = "none"; }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 502}}

      /* Card count badge */
      , count > 1 && (
        React.createElement('div', { style: {
          position: "absolute", top: 10, right: 10,
          background: `${T.meta}33`, borderRadius: 6,
          padding: "2px 7px", fontSize: 10, fontWeight: 600,
          color: T.meta, fontFamily: "'Inter', sans-serif",
          display: "flex", alignItems: "center", gap: 3,
        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 516}}
          , React.createElement('svg', { width: "10", height: "10", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 523}}
            , React.createElement('rect', { x: "2", y: "7", width: "16", height: "14", rx: "2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 524}}), React.createElement('path', { d: "M6 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"                 , __self: this, __source: {fileName: _jsxFileName, lineNumber: 524}})
          )
          , count
        )
      )

      /* Preview text */
      , React.createElement('div', { style: {
        flex: 1, padding: "14px 14px 10px",
        display: "flex", alignItems: preview ? "flex-start" : "center",
        justifyContent: preview ? "flex-start" : "center",
      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 531}}
        , preview ? (
          React.createElement('p', { style: {
            fontFamily: headingFont, fontSize: 13, fontWeight: 500,
            color: T.text, lineHeight: 1.5, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 6,
            WebkitBoxOrient: "vertical", overflow: "hidden",
            paddingTop: count > 1 ? 18 : 0,
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 537}}, preview)
        ) : (
          React.createElement('p', { style: { fontFamily: "'Inter', sans-serif", fontSize: 12, color: T.meta, margin: 0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 545}}, "Empty")
        )
      )
    )
  );
}

/* ── Theme groups ── */
/*
  Each theme has:
    card/bg/text/meta/border  — base card colours
    palette   — array of card bg colours (one per card, cycling), all from the art tradition
    fonts     — { heading, body }  Google Font names
    typo      — per-line-type overrides: { h1, h2, h3, li, p }
                fields: fontFamily, fontSize, fontWeight, letterSpacing, textTransform, fontStyle
*/
const THEME_GROUPS = [
  {
    group: "Base",
    desc: "",
    themes: [
      {
        id: "white", label: "White", desc: "Clean page",
        card: "#ffffff", bg: "#f7f7f5", text: "#000000", meta: "#aaaaaa", border: "rgba(0,0,0,0.07)",
        palette: ["#ffffff","#fafafa","#f5f5f5","#f0f0f0","#ebebeb","#e6e6e6"],
        fonts: { heading: "Inter", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: -0.2 },
          h3: { fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "black", label: "Black", desc: "Pure void",
        card: "#111111", bg: "#000000", text: "#ffffff", meta: "#666666", border: "rgba(255,255,255,0.08)",
        palette: ["#111111","#1a1a1a","#222222","#0d0d0d","#181818","#141414"],
        fonts: { heading: "Inter", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: -0.2 },
          h3: { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "cream", label: "Cream", desc: "Warm paper",
        card: "#fdf6e3", bg: "#f0e6c8", text: "#3b2f1e", meta: "#a0896a", border: "rgba(0,0,0,0.06)",
        palette: ["#fdf6e3","#f9eed0","#f5e8c0","#f2e4b8","#eee0b0","#ebd9a4"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.3, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: -0.1 },
          h3: { fontSize: 11, fontWeight: 400, letterSpacing: 1.4, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "slate", label: "Slate", desc: "Cool evening",
        card: "#1e2530", bg: "#151b24", text: "#e8eaf0", meta: "#556677", border: "rgba(255,255,255,0.06)",
        palette: ["#1e2530","#222c3a","#1a2138","#202840","#1c2234","#18202e"],
        fonts: { heading: "DM Sans", body: "Inter" },
        typo: {
          h1: { fontSize: 21, fontWeight: 700, letterSpacing: -0.4 },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "rose", label: "Rose", desc: "Soft blush",
        card: "#fff0f0", bg: "#fde0e0", text: "#5c1a1a", meta: "#c07070", border: "rgba(0,0,0,0.05)",
        palette: ["#fff0f0","#ffe8e8","#ffdfdf","#ffd8d8","#ffd0d0","#ffcaca"],
        fonts: { heading: "Cormorant Garamond", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 600, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.6, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "sage", label: "Sage", desc: "Quiet green",
        card: "#f0f7f0", bg: "#ddeedd", text: "#1a3a1a", meta: "#6a9a6a", border: "rgba(0,0,0,0.05)",
        palette: ["#f0f7f0","#e8f2e8","#e0ede0","#d8e8d8","#d0e4d0","#c8dfca"],
        fonts: { heading: "DM Serif Display", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 400, letterSpacing: -0.3, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 400, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "European Classical",
    desc: "Sacred gold, candlelit drama, luminous fresco.",
    themes: [
      {
        id: "byzantine", label: "Byzantine", desc: "Sacred gold mosaic — divine light made surface",
        card: "#f5e6b0", bg: "#e8d490", text: "#1a0d00", meta: "#8b6914", border: "rgba(0,0,0,0.08)",
        palette: ["#f5e6b0","#e8c870","#d4a830","#c49020","#b07810","#f0da80"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 1.0, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.6 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "scriptorium", label: "Scriptorium", desc: "Vellum and lapis — the illuminated page as sacred act",
        card: "#f0e8d0", bg: "#e4d8b8", text: "#1a1008", meta: "#8a6020", border: "rgba(0,0,0,0.07)",
        palette: ["#f0e8d0","#e8ddc0","#e0d0a8","#dac898","#d4c088","#f5edda"],
        fonts: { heading: "Cinzel Decorative", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 20, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" },
          h2: { fontSize: 15, fontWeight: 700, letterSpacing: 0.4 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400, fontStyle: "italic" },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "gesso", label: "Gesso", desc: "Renaissance ivory ground — light trapped in paint layers",
        card: "#f7f0e0", bg: "#ede3ce", text: "#2a1a0a", meta: "#8a6a3a", border: "rgba(0,0,0,0.06)",
        palette: ["#f7f0e0","#f0e8d0","#e8dec0","#e0d4b0","#d8caa0","#f2ead8"],
        fonts: { heading: "Cormorant Garamond", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 25, fontWeight: 600, letterSpacing: -0.3, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "tenebrism", label: "Tenebrism", desc: "Baroque chiaroscuro — candlelit warmth from deep shadow",
        card: "#1a1208", bg: "#0e0a04", text: "#f2e8d0", meta: "#8a7040", border: "rgba(242,232,208,0.08)",
        palette: ["#1a1208","#221808","#2a1e08","#1e1408","#160e04","#240e04"],
        fonts: { heading: "Cormorant Garamond", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 25, fontWeight: 700, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "rococo", label: "Rococo", desc: "Powder-blue plaster, blush gold — featherlight ornament",
        card: "#fdf0f5", bg: "#f5e4ed", text: "#3a1a2a", meta: "#c090a0", border: "rgba(0,0,0,0.05)",
        palette: ["#fdf0f5","#f8e8f0","#f0e0f0","#e8d8ec","#f0e8fa","#faeaf4"],
        fonts: { heading: "Cormorant Garamond", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 400, letterSpacing: 0.2, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 400, letterSpacing: 0.1, fontStyle: "italic" },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "atelier", label: "Impressionist", desc: "Broken colour on canvas — light as subject, not object",
        card: "#f5f0ec", bg: "#ede8e2", text: "#2a2018", meta: "#9a8880", border: "rgba(0,0,0,0.05)",
        palette: ["#f5f0ec","#f0ece4","#eae4dc","#e4ded4","#dfd8cc","#f8f4f0"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.4, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "Modern Art",
    desc: "The 20th century reinvents the surface.",
    themes: [
      {
        id: "art-nouveau", label: "Art Nouveau", desc: "Sage and champagne — organic curves, nature as ornament",
        card: "#f5f0e8", bg: "#ede6d8", text: "#2a2010", meta: "#8a7848", border: "rgba(0,0,0,0.06)",
        palette: ["#f5f0e8","#eee8d8","#e8dfcc","#e2d8c0","#e8f0e0","#f0e8e0"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.1, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "expressionism", label: "Expressionist", desc: "Acid yellow, blood red — emotion distorts the surface",
        card: "#f5f0d8", bg: "#ebe4c4", text: "#1a0800", meta: "#8a6020", border: "rgba(0,0,0,0.08)",
        palette: ["#f5f0d8","#f8e840","#e83020","#2a3888","#e8a820","#eeeacc"],
        fonts: { heading: "Bebas Neue", body: "Inter" },
        typo: {
          h1: { fontSize: 28, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          h2: { fontSize: 20, fontWeight: 400, letterSpacing: 0.8, textTransform: "uppercase" },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "werkstatt", label: "Bauhaus", desc: "White workshop wall — every element earns its place",
        card: "#f5f5f2", bg: "#e8e8e4", text: "#0a0a0a", meta: "#888884", border: "rgba(0,0,0,0.12)",
        palette: ["#f5f5f2","#e8e8e4","#dcdcd8","#1a4a8a","#e8311a","#f5c800"],
        fonts: { heading: "DM Sans", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: -0.2 },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "joost", label: "Bauhaus Dark", desc: "Moholy-Nagy photogram — signal yellow in darkness",
        card: "#0d0d0d", bg: "#060606", text: "#f5c800", meta: "#666660", border: "rgba(245,200,0,0.12)",
        palette: ["#0d0d0d","#1a0000","#001a00","#00001a","#1a1a00","#0d0d0d"],
        fonts: { heading: "DM Sans", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: -0.2 },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "primary-signal", label: "Bauhaus Red", desc: "Flat poster red — the Bauhaus declaration",
        card: "#d42010", bg: "#b81808", text: "#ffffff", meta: "#ff8070", border: "rgba(255,255,255,0.15)",
        palette: ["#d42010","#1a4a8a","#f5c800","#000000","#ffffff","#b81808"],
        fonts: { heading: "Bebas Neue", body: "DM Sans" },
        typo: {
          h1: { fontSize: 30, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          h2: { fontSize: 20, fontWeight: 400, letterSpacing: 1.0, textTransform: "uppercase" },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "color-field", label: "Rothko", desc: "Color field — writing inside an emotion, not on a page",
        card: "#6a1a0a", bg: "#4a1006", text: "#f5ddd0", meta: "#c07060", border: "rgba(245,221,208,0.08)",
        palette: ["#6a1a0a","#8b1a0a","#c84a00","#3a0808","#1a1208","#9a3000"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 26, fontWeight: 700, letterSpacing: -0.3, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 700, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 15, fontWeight: 400 },
          p:  { fontSize: 15, fontWeight: 400 },
        },
      },
      {
        id: "surrealism", label: "Surrealist", desc: "Desert ochre and deep indigo — logic untethered",
        card: "#f0e8d8", bg: "#e4d8c4", text: "#1a1028", meta: "#7a6070", border: "rgba(0,0,0,0.06)",
        palette: ["#f0e8d8","#1a1028","#c84a00","#d4b860","#4a3060","#e8d8c0"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 700, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.6, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "Ancient Mediterranean",
    desc: "Fired clay, carved marble, fused pigment.",
    themes: [
      {
        id: "red-figure", label: "Red Figure", desc: "Clay glowing through black slip — myth drawn from fire",
        card: "#c85820", bg: "#a84010", text: "#f5e0c8", meta: "#e8a060", border: "rgba(245,224,200,0.10)",
        palette: ["#c85820","#b84818","#a83808","#d46828","#e07830","#982808"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 1.0, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.5 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "agora", label: "Agora", desc: "Sun-bleached marble — the civic inscription surface",
        card: "#f0ece0", bg: "#e4dfcc", text: "#1e1a0e", meta: "#9a9070", border: "rgba(0,0,0,0.07)",
        palette: ["#f0ece0","#e8e4d4","#e0dcc8","#d8d4bc","#e4e8f0","#ece8dc"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 1.0, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.5 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "black-figure", label: "Black Figure", desc: "Iron slip darkness — figures live in silhouette",
        card: "#1a1008", bg: "#0e0804", text: "#d4a870", meta: "#6a4820", border: "rgba(212,168,112,0.10)",
        palette: ["#1a1008","#221408","#2a1808","#160c04","#1e1208","#120a04"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 1.0, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.5 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "pompeii", label: "Pompeii", desc: "Iron oxide in wet plaster — colour fused into the wall",
        card: "#8b2018", bg: "#6e1610", text: "#f5e8d0", meta: "#c07858", border: "rgba(245,232,208,0.08)",
        palette: ["#8b2018","#a02820","#7a1810","#601208","#c84030","#6e1610"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.3 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "tesserae", label: "Tesserae", desc: "Ivory mosaic floor — image assembled piece by piece",
        card: "#f0e8d4", bg: "#e4d8c0", text: "#1e1608", meta: "#9a8868", border: "rgba(0,0,0,0.08)",
        palette: ["#f0e8d4","#e8dfc4","#e0d4b4","#d8caa4","#d0c090","#ece4cc"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 21, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" },
          h2: { fontSize: 15, fontWeight: 700, letterSpacing: 0.3 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "herculaneum", label: "Herculaneum", desc: "Ochre lamplight on plaster — the private room",
        card: "#c8960a", bg: "#a87c06", text: "#1a1000", meta: "#6a4c04", border: "rgba(0,0,0,0.10)",
        palette: ["#c8960a","#d4a010","#b88008","#a87006","#e0b020","#bc8c08"],
        fonts: { heading: "Cinzel", body: "EB Garamond" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 700, letterSpacing: 0.3 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "East Asian",
    desc: "Ink, woodblock, and the art of the considered mark.",
    themes: [
      {
        id: "shuimo", label: "Ink Wash", desc: "Brush on rice paper — black as presence, white as participant",
        card: "#f8f6f0", bg: "#eeeae0", text: "#0a0a08", meta: "#7a7870", border: "rgba(0,0,0,0.06)",
        palette: ["#f8f6f0","#f0eee8","#e8e6de","#e0ddd4","#d8d5ca","#f4f2ec"],
        fonts: { heading: "Noto Serif SC", body: "Noto Serif SC" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.5 },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: 0.3 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "washi", label: "Ukiyo-e", desc: "Woodblock on washi — indigo and vermillion, flat and precise",
        card: "#f8f2e4", bg: "#eee6d4", text: "#1a1208", meta: "#7a6040", border: "rgba(0,0,0,0.06)",
        palette: ["#f8f2e4","#c8381a","#1a3a60","#e8a820","#4a6820","#e8e0cc"],
        fonts: { heading: "Noto Serif SC", body: "Noto Serif SC" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.4 },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: 0.2 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.6, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "wabi", label: "Wabi-Sabi", desc: "Weathered and asymmetric — the beauty of incompleteness",
        card: "#f0ede8", bg: "#e4e0d8", text: "#2a2820", meta: "#8a8878", border: "rgba(0,0,0,0.05)",
        palette: ["#f0ede8","#e8e4de","#dedad2","#d6d0c8","#cec8be","#ece9e4"],
        fonts: { heading: "Noto Serif SC", body: "Noto Serif SC" },
        typo: {
          h1: { fontSize: 21, fontWeight: 400, letterSpacing: 0.3 },
          h2: { fontSize: 15, fontWeight: 400, letterSpacing: 0.2 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "japandi", label: "Japandi", desc: "Warm off-white and charcoal — two minimalisms meeting",
        card: "#f5f0ea", bg: "#ede8e0", text: "#1e1e18", meta: "#8a8a78", border: "rgba(0,0,0,0.06)",
        palette: ["#f5f0ea","#edeae2","#e5e0d8","#ddd8ce","#d4d0c4","#f1eee8"],
        fonts: { heading: "DM Sans", body: "Noto Serif SC" },
        typo: {
          h1: { fontSize: 20, fontWeight: 700, letterSpacing: -0.3 },
          h2: { fontSize: 15, fontWeight: 600, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "Sacred & Folk",
    desc: "Ritual surfaces made by hand, for devotion.",
    themes: [
      {
        id: "muqarnas", label: "Islamic", desc: "Jewel ground — mathematical infinity made visible in tile",
        card: "#f5f0e0", bg: "#ece6d0", text: "#1a1408", meta: "#5a7a7a", border: "rgba(0,0,0,0.07)",
        palette: ["#f5f0e0","#1a4a6a","#c84820","#2a6a3a","#8a1a2a","#d4a830"],
        fonts: { heading: "Scheherazade New", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 700, letterSpacing: 0.2 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "mughal", label: "Mughal", desc: "Saffron and lapis — the miniature page as jewelled world",
        card: "#fdf4e0", bg: "#f5eacc", text: "#2a1800", meta: "#8a6020", border: "rgba(0,0,0,0.06)",
        palette: ["#fdf4e0","#1a3060","#c84820","#2a7040","#8b1a30","#d4a000"],
        fonts: { heading: "Scheherazade New", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 700, letterSpacing: 0.2 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "thangka", label: "Thangka", desc: "Lapis and gold — the thangka as window into awakened mind",
        card: "#1a1e48", bg: "#101228", text: "#f5d878", meta: "#8060a0", border: "rgba(245,216,120,0.12)",
        palette: ["#1a1e48","#481a1a","#1a3a18","#382808","#280a38","#1e2848"],
        fonts: { heading: "Cinzel", body: "Lora" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: 0.2 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "yantra", label: "Yantra", desc: "Vermillion fire — white geometry maps the cosmos inward",
        card: "#c84010", bg: "#a02e08", text: "#fff8e0", meta: "#f0a050", border: "rgba(255,248,224,0.10)",
        palette: ["#c84010","#a02e08","#d86020","#901808","#e08030","#b83408"],
        fonts: { heading: "Cinzel", body: "Lora" },
        typo: {
          h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: 0.3 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "lotus-field", label: "Lotus", desc: "Pale inner petal — the prepared surface before the sacred",
        card: "#faf0e8", bg: "#f0e4d8", text: "#2a1810", meta: "#b08060", border: "rgba(0,0,0,0.05)",
        palette: ["#faf0e8","#f5e8e0","#f0dfd6","#ead8cc","#f0f5e8","#f8f0f0"],
        fonts: { heading: "Cormorant Garamond", body: "Lora" },
        typo: {
          h1: { fontSize: 24, fontWeight: 600, letterSpacing: -0.1, fontStyle: "italic" },
          h2: { fontSize: 18, fontWeight: 600, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "mud-wall", label: "Mud Wall", desc: "Maithili clay plaster — every surface filled before festival",
        card: "#e8d8c0", bg: "#dcc8ac", text: "#1e1008", meta: "#8a6840", border: "rgba(0,0,0,0.07)",
        palette: ["#e8d8c0","#d8c8a8","#c8b890","#b8a878","#e0c8a8","#d0b890"],
        fonts: { heading: "Tiro Devanagari Hindi", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: 0.1 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "lac-red", label: "Lac Red", desc: "Maithili ritual red — organic dye, the colour of ceremony",
        card: "#b83020", bg: "#941e10", text: "#faecd0", meta: "#e09060", border: "rgba(250,236,208,0.10)",
        palette: ["#b83020","#d04030","#981810","#801008","#c83828","#a02818"],
        fonts: { heading: "Tiro Devanagari Hindi", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: 0.1 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "turmeric", label: "Turmeric", desc: "Maithili auspicious yellow — ground spice, the threshold",
        card: "#e8c428", bg: "#d4b018", text: "#1a1000", meta: "#6a4c00", border: "rgba(0,0,0,0.10)",
        palette: ["#e8c428","#d4a810","#c09008","#e0b820","#f0d040","#c8a018"],
        fonts: { heading: "Tiro Devanagari Hindi", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: 0.1 },
          h2: { fontSize: 17, fontWeight: 600, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "kente", label: "Kente", desc: "Woven gold and green — bold geometry as cultural inscription",
        card: "#fde880", bg: "#f5d840", text: "#1a0800", meta: "#8a4800", border: "rgba(0,0,0,0.10)",
        palette: ["#fde880","#1a6a20","#c83010","#1a1a80","#f5d840","#e8b820"],
        fonts: { heading: "Bebas Neue", body: "Inter" },
        typo: {
          h1: { fontSize: 26, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          h2: { fontSize: 18, fontWeight: 400, letterSpacing: 1.0, textTransform: "uppercase" },
          h3: { fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "Cartography",
    desc: "Cold War scientific print. Data encoded as authority.",
    themes: [
      {
        id: "chart-room", label: "Chart Room", desc: "Coated map stock — the field survey surface",
        card: "#f2f4f0", bg: "#e6e9e3", text: "#1a1e16", meta: "#7a8a7a", border: "rgba(0,0,0,0.08)",
        palette: ["#f2f4f0","#eaecea","#e2e4e2","#dadcda","#d2d4d2","#eef0ec"],
        fonts: { heading: "DM Mono", body: "DM Mono" },
        typo: {
          h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" },
          h2: { fontSize: 14, fontWeight: 700, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.2, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
      {
        id: "void-field", label: "Void Field", desc: "Scientific negative space — absence makes data legible",
        card: "#12140f", bg: "#080a06", text: "#e8ede0", meta: "#4a5a48", border: "rgba(232,237,224,0.08)",
        palette: ["#12140f","#181a14","#1e201a","#141610","#0e100c","#1a1c16"],
        fonts: { heading: "DM Mono", body: "DM Mono" },
        typo: {
          h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" },
          h2: { fontSize: 14, fontWeight: 700, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.2, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
      {
        id: "survey-mark", label: "Survey", desc: "Coordinate paper — the grid and annotation layer",
        card: "#dde4d8", bg: "#cdd6c6", text: "#1e281a", meta: "#6a7a66", border: "rgba(0,0,0,0.07)",
        palette: ["#dde4d8","#d4ddd0","#cbd5c5","#c2ccbc","#b9c4b2","#e5ecdf"],
        fonts: { heading: "DM Mono", body: "DM Mono" },
        typo: {
          h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2, textTransform: "uppercase" },
          h2: { fontSize: 14, fontWeight: 700, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.2, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
      {
        id: "blueprint", label: "Blueprint", desc: "Cyanotype negative — white lines drawn in light, cold",
        card: "#0d2a4a", bg: "#081a32", text: "#c8e0f8", meta: "#4878a8", border: "rgba(200,224,248,0.10)",
        palette: ["#0d2a4a","#102e52","#14325a","#183662","#0a2440","#0e2e50"],
        fonts: { heading: "DM Mono", body: "DM Mono" },
        typo: {
          h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },
          h2: { fontSize: 14, fontWeight: 700, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.2, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
    ],
  },
  {
    group: "Contemporary",
    desc: "Digital culture, subculture, and the aesthetics of now.",
    themes: [
      {
        id: "reading-room", label: "Dark Academia", desc: "Parchment and mahogany — the worn reading room at midnight",
        card: "#e8dfc8", bg: "#dcd0b4", text: "#1a1408", meta: "#7a6a40", border: "rgba(0,0,0,0.07)",
        palette: ["#e8dfc8","#e0d4b8","#d4c8a4","#c8bc90","#ddd4b0","#ecdfc0"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.6, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "linen", label: "Cottagecore", desc: "Butter linen — a letter written to someone you love",
        card: "#fdf6e0", bg: "#f5eccc", text: "#2a1e10", meta: "#8a7a4a", border: "rgba(0,0,0,0.05)",
        palette: ["#fdf6e0","#f5ecd0","#ede2c0","#e5d8b0","#ddd0a0","#f9f0d8"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.1, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: 0 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.6, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "tape-hiss", label: "Lo-fi", desc: "Warm magnetic compression — loved into slow deterioration",
        card: "#e8e0f0", bg: "#ddd5e8", text: "#2a1a3a", meta: "#8a7a9a", border: "rgba(0,0,0,0.06)",
        palette: ["#e8e0f0","#dfd6ea","#d6cce4","#cdc2de","#c4b8d8","#ece4f4"],
        fonts: { heading: "DM Serif Display", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 400, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 16, fontWeight: 400, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "lobby", label: "Vaporwave", desc: "Corporate lobby in dream logic — aspiration turned uncanny",
        card: "#180828", bg: "#100018", text: "#ff80d0", meta: "#8040a0", border: "rgba(255,128,208,0.12)",
        palette: ["#180828","#200830","#281040","#200038","#180028","#1c0c34"],
        fonts: { heading: "Bebas Neue", body: "DM Sans" },
        typo: {
          h1: { fontSize: 28, fontWeight: 400, letterSpacing: 3.0, textTransform: "uppercase" },
          h2: { fontSize: 18, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "neon-rain", label: "Cyberpunk", desc: "Wet asphalt and neon — the city as hostile infrastructure",
        card: "#0a0a12", bg: "#060608", text: "#00ffe8", meta: "#006a62", border: "rgba(0,255,232,0.12)",
        palette: ["#0a0a12","#120a18","#0a1218","#12180a","#180a12","#0c0c1a"],
        fonts: { heading: "Bebas Neue", body: "DM Mono" },
        typo: {
          h1: { fontSize: 26, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          h2: { fontSize: 17, fontWeight: 400, letterSpacing: 1.0, textTransform: "uppercase" },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 2.0, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
      {
        id: "canopy", label: "Solarpunk", desc: "Gold-green canopy — the optimism of constructed ecology",
        card: "#f0f8e0", bg: "#e4f0cc", text: "#1a2808", meta: "#5a8840", border: "rgba(0,0,0,0.06)",
        palette: ["#f0f8e0","#e8f4d4","#e0efca","#d8eabe","#d0e5b0","#eef6da"],
        fonts: { heading: "DM Serif Display", body: "Inter" },
        typo: {
          h1: { fontSize: 22, fontWeight: 400, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 16, fontWeight: 400, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "golden-hour", label: "Golden Hour", desc: "Amber at twenty minutes — warmth just before it changes",
        card: "#fdf0d8", bg: "#f5e4c0", text: "#2a1408", meta: "#9a6830", border: "rgba(0,0,0,0.06)",
        palette: ["#fdf0d8","#f8e4c0","#f4d8a8","#f0cc90","#ecc078","#faf4e0"],
        fonts: { heading: "Playfair Display", body: "Lora" },
        typo: {
          h1: { fontSize: 23, fontWeight: 700, letterSpacing: -0.2, fontStyle: "italic" },
          h2: { fontSize: 17, fontWeight: 700, letterSpacing: -0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
      {
        id: "abyssal", label: "Deep Ocean", desc: "Below the thermocline — pressure, silence, bioluminescence",
        card: "#0d1a2a", bg: "#081018", text: "#c0e8f0", meta: "#408090", border: "rgba(64,128,144,0.15)",
        palette: ["#0d1a2a","#0e2030","#0f2438","#102840","#0c1c28","#0e1e32"],
        fonts: { heading: "DM Mono", body: "DM Mono" },
        typo: {
          h1: { fontSize: 18, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" },
          h2: { fontSize: 14, fontWeight: 700, letterSpacing: 0.1 },
          h3: { fontSize: 10, fontWeight: 400, letterSpacing: 1.4, textTransform: "uppercase" },
          li: { fontSize: 13, fontWeight: 400 },
          p:  { fontSize: 13, fontWeight: 400 },
        },
      },
      {
        id: "hoarfrost", label: "Nordic Winter", desc: "Horizontal light on snow — cold, spacious, clarifying",
        card: "#f0f4f8", bg: "#e4eaf0", text: "#1a2030", meta: "#8a9aaa", border: "rgba(0,0,0,0.06)",
        palette: ["#f0f4f8","#e8eef4","#e0e8f0","#d8e2ec","#d0dce8","#eef2f8"],
        fonts: { heading: "DM Sans", body: "Inter" },
        typo: {
          h1: { fontSize: 21, fontWeight: 700, letterSpacing: -0.4 },
          h2: { fontSize: 16, fontWeight: 600, letterSpacing: -0.2 },
          h3: { fontSize: 10, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase" },
          li: { fontSize: 14, fontWeight: 400 },
          p:  { fontSize: 14, fontWeight: 400 },
        },
      },
    ],
  },
];

const THEMES = THEME_GROUPS.flatMap(g => g.themes);


/* ── Carousel screen ── */
function CarouselScreen({ stack, onBack, onUpdateStack }) {
  const [notes, setNotes] = useState(
    stack.notes.map(n => n.colorSeed != null ? n : { ...n, colorSeed: Math.floor(Math.random() * 999983) })
  );
  const [active, setActive] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ghostNote, setGhostNote] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const initTheme = THEMES.find(t => t.id === stack.themeId) || THEMES[0];
  const [theme, setTheme] = useState(initTheme);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [dragRowIdx, setDragRowIdx] = useState(null);
  const [dragRowY, setDragRowY] = useState(0);
  const [dropRowIdx, setDropRowIdx] = useState(null);
  const dragRowRef = useRef(null);      // { startY, idx }
  const reorderListRef = useRef(null);  // ref to the list DOM node
  const pointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDragRef = useRef(0);
  const directionLockedRef = useRef(null);
  const activeRef = useRef(0);
  const notesRef = useRef(notes);
  const ghostRef = useRef(null);
  const longPressTimerRef = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => {
    notesRef.current = notes;
    onUpdateStack({ ...stack, notes });
  }, [notes]);

  const CARD_W = 300, SIDE_OFFSET = 260, SWIPE_COMMIT = 60;

  // Visible notes = real notes + ghost (if dragging left on last card)
  const visibleNotes = ghostNote
    ? [...notes.map((n, i) => ({ ...n, index: i })), { ...ghostNote, index: notes.length, isGhost: true }]
    : notes.map((n, i) => ({ ...n, index: i }));
  const count = notes.length; // dots/counter use real count

  const onPointerDown = useCallback((e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    pointerDownRef.current = true;
    directionLockedRef.current = null;
    currentDragRef.current = 0;
    startXRef.current = _nullishCoalesce(e.clientX, () => ( _optionalChain([e, 'access', _2 => _2.touches, 'optionalAccess', _3 => _3[0], 'optionalAccess', _4 => _4.clientX])));
    startYRef.current = _nullishCoalesce(e.clientY, () => ( _optionalChain([e, 'access', _5 => _5.touches, 'optionalAccess', _6 => _6[0], 'optionalAccess', _7 => _7.clientY])));
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!pointerDownRef.current) return;
    const cx = _nullishCoalesce(e.clientX, () => ( _optionalChain([e, 'access', _8 => _8.touches, 'optionalAccess', _9 => _9[0], 'optionalAccess', _10 => _10.clientX])));
    const cy = _nullishCoalesce(e.clientY, () => ( _optionalChain([e, 'access', _11 => _11.touches, 'optionalAccess', _12 => _12[0], 'optionalAccess', _13 => _13.clientY])));
    const dx = cx - startXRef.current, dy = cy - startYRef.current;

    if (!directionLockedRef.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      directionLockedRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      // When horizontal swipe detected on a focused editable, release text cursor
      // so the swipe doesn't get interpreted as text selection
      if (directionLockedRef.current === "h" && document.activeElement && document.activeElement.contentEditable === "true") {
        document.activeElement.blur();
      }
    }
    if (directionLockedRef.current === "v") return;
    if (e.cancelable) e.preventDefault();

    currentDragRef.current = dx;
    setDragX(dx);
    setDragging(true);

    // Swiping left on the last card — spawn ghost so it's visible during drag
    const cur = activeRef.current;
    const ns = notesRef.current;
    if (dx < -10 && cur === ns.length - 1 && !ghostRef.current) {
      const g = mkNote(ns.length);
      ghostRef.current = g;
      setGhostNote(g);
    }
    // Swiping right — remove ghost if it exists
    if (dx > 0 && ghostRef.current) {
      ghostRef.current = null;
      setGhostNote(null);
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;
    setDragging(false);

    const d = currentDragRef.current;
    const cur = activeRef.current;
    const ns = notesRef.current;

    if (d < -SWIPE_COMMIT) {
      // Commit forward navigation
      if (cur === ns.length - 1 && ghostRef.current) {
        // Promote ghost to real note
        const g = ghostRef.current;
        notesRef.current = [...ns, g];
        setNotes([...notesRef.current]);
        setActive(ns.length);
        activeRef.current = ns.length;
        ghostRef.current = null;
        setGhostNote(null);
      } else {
        setActive(cur + 1); activeRef.current = cur + 1;
      }
    } else if (d > SWIPE_COMMIT) {
      const next = Math.max(0, cur - 1);
      setActive(next); activeRef.current = next;
      // Discard ghost if swiped right
      ghostRef.current = null;
      setGhostNote(null);
    } else {
      // Not enough drag — discard ghost
      ghostRef.current = null;
      setGhostNote(null);
    }

    currentDragRef.current = 0;
    setDragX(0);
    directionLockedRef.current = null;

    // Re-focus the new active card after swipe so keyboard comes back up
    setTimeout(() => {
      const activeCards = document.querySelectorAll('[data-card-active="true"]');
      if (activeCards.length > 0) {
        const editables = activeCards[0].querySelectorAll('[contenteditable="true"]');
        if (editables.length > 0) {
          editables[0].focus();
          try {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editables[0]);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          } catch(_) {}
        }
      }
    }, 80);
  }, []);

  const handleChange = (id, text) => setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  const handleDelete = (id) => {
    setNotes(prev => {
      if (prev.length === 1) { setActive(0); return [mkNote(0)]; }
      const idx = prev.findIndex(n => n.id === id);
      const next = prev.filter(n => n.id !== id);
      setActive(a => Math.min(a, next.length - 1));
      return next;
    });
  };

  const getTransform = (idx) => {
    const rel = idx - active;
    const absRel = Math.abs(rel);
    if (absRel > 2) return null;
    const dragInfluence = dragX * (1 - absRel * 0.35);
    return {
      tx: rel * SIDE_OFFSET + dragInfluence,
      rotateY: -rel * 38 + (dragX / CARD_W) * 38,
      tz: -absRel * 60,
      scale: 1 - absRel * 0.12,
      opacity: absRel === 0 ? 1 : absRel === 1 ? 0.5 : 0.2,
      zIndex: 10 - absRel,
    };
  };

  const handleDownload = (format) => {
    const filled = notes.filter(n => n.text.trim());
    const name = stack.name || `notes-${stack.id}`;
    if (format === "txt") {
      const content = filled.map((n, i) => `--- Note ${i + 1} ---\n${n.text}`).join("\n\n");
      const blob = new Blob([content], { type: "text/plain" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `${name}.txt`; a.click();
    } else if (format === "json") {
      const content = JSON.stringify(filled.map((n, i) => ({ index: i + 1, text: n.text })), null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `${name}.json`; a.click();
    } else if (format === "md") {
      const content = filled.map((n, i) => `## Note ${i + 1}\n\n${n.text}`).join("\n\n---\n\n");
      const blob = new Blob([content], { type: "text/markdown" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `${name}.md`; a.click();
    }
    setShowDownloadMenu(false);
  };


  // ── Reorder sheet ──
  const applyOrder = (ordered) => {
    const renumbered = ordered.map((n, i) => ({ ...n, index: i }));
    notesRef.current = renumbered;
    setNotes(renumbered);
    const newActive = renumbered.findIndex(n => n.id === _optionalChain([notesRef, 'access', _14 => _14.current, 'access', _15 => _15[activeRef.current], 'optionalAccess', _16 => _16.id]));
    if (newActive !== -1) { setActive(newActive); activeRef.current = newActive; }
    onUpdateStack({ ...stack, notes: renumbered });
  };

  // ── Reorder sheet pointer handlers ──
  const onRowPointerDown = (e, idx) => {
    const list = reorderListRef.current;
    if (list) try { list.setPointerCapture(e.pointerId); } catch(_) {}
    dragRowRef.current = { startY: e.clientY, idx };
    setDragRowIdx(idx);
    setDragRowY(0);
    setDropRowIdx(idx);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  const onRowPointerMove = (e) => {
    if (!dragRowRef.current) return;
    const dy = e.clientY - dragRowRef.current.startY;
    setDragRowY(dy);
    const ROW_H = 64;
    const rawDrop = dragRowRef.current.idx + Math.round(dy / ROW_H);
    const clamped = Math.max(0, Math.min(notes.length - 1, rawDrop));
    setDropRowIdx(clamped);
  };

  const onRowPointerUp = () => {
    if (!dragRowRef.current) return;
    const from = dragRowRef.current.idx;
    const to = _nullishCoalesce(dropRowIdx, () => ( from));
    dragRowRef.current = null;
    setDragRowIdx(null);
    setDragRowY(0);
    setDropRowIdx(null);
    if (from !== to) {
      const next = [...notes];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const renumbered = next.map((n, i) => ({ ...n, index: i }));
      notesRef.current = renumbered;
      setNotes(renumbered);
      setActive(to);
      activeRef.current = to;
      onUpdateStack({ ...stack, notes: renumbered });
      if (navigator.vibrate) navigator.vibrate(18);
    }
  };

  const ease = "cubic-bezier(0.34, 1.1, 0.64, 1)";

  return (
    React.createElement('div', { style: { width: "100%", maxWidth: 440, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, position: "relative" },
      onClick: () => { setShowDownloadMenu(false); setShowThemePicker(false); }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1531}}
      /* Back button */
      , React.createElement('div', { style: { position: "absolute", top: 16, left: 20 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1534}}
        , React.createElement('button', { onClick: onBack, style: {
          display: "flex", alignItems: "center", gap: 5,
          background: "#fff", border: "1px solid #e5e5e5",
          borderRadius: 999, padding: "7px 14px 7px 10px",
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
          fontSize: 12, fontWeight: 500, color: "#333",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          transition: "box-shadow .15s, border-color .15s", touchAction: "manipulation",
        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1535}}
          , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1544}}
            , React.createElement('polyline', { points: "15 18 9 12 15 6"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 1545}})
          ), "All notes"

        )
      )

      /* Theme picker — top center */
      , React.createElement('div', { style: { position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100000 }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1552}}
        , React.createElement('button', { onClick: () => { setShowThemePicker(v => !v); setShowDownloadMenu(false); },
          style: {
            display: "flex", alignItems: "center", gap: 6,
            background: "#fff", border: "1px solid #e5e5e5",
            borderRadius: 999, padding: "7px 14px",
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
            fontSize: 12, fontWeight: 500, color: "#333",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", whiteSpace: "nowrap",
            touchAction: "manipulation",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1553}}
          /* Mini card preview in button */
          , React.createElement('div', { style: {
            width: 18, height: 13, borderRadius: 3, background: theme.card,
            border: `1px solid ${theme.border}`, flexShrink: 0, position: "relative",
            display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "2px 2px", gap: 1, boxSizing: "border-box",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1564}}
            , React.createElement('div', { style: { height: 1.5, borderRadius: 1, background: theme.text, opacity: 0.8, width: "80%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1570}} )
            , React.createElement('div', { style: { height: 1, borderRadius: 1, background: theme.text, opacity: 0.35, width: "55%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1571}} )
          )
          , theme.label
        )

        , showThemePicker && (
          React.createElement('div', { style: {
            position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
            background: "#fff", borderRadius: 18,
            boxShadow: "0 16px 56px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.07)",
            zIndex: 100000, width: 340, maxHeight: "75vh", overflowY: "auto",
            paddingBottom: 8,
          },
            onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1577}}

            , THEME_GROUPS.map((group, gi) => (
              React.createElement('div', { key: group.group, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1587}}
                /* Group header */
                , React.createElement('div', { style: {
                  padding: gi === 0 ? "14px 16px 2px" : "12px 16px 2px",
                  display: "flex", flexDirection: "column", gap: 1,
                }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1589}}
                  , React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: "#111", fontFamily: "'Inter', sans-serif", letterSpacing: 0.3 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1593}}
                    , group.group.toUpperCase()
                  )
                  , group.desc && (
                    React.createElement('span', { style: { fontSize: 10.5, color: "#999", fontFamily: "'Inter', sans-serif", fontStyle: "italic" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1597}}
                      , group.desc
                    )
                  )
                )

                /* Theme rows — each is a full-width row with preview + name + desc */
                , React.createElement('div', { style: { padding: "4px 10px 6px", display: "flex", flexDirection: "column", gap: 2 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1604}}
                  , group.themes.map(t => {
                    const isActive = theme.id === t.id;
                    return (
                      React.createElement('button', {
                        key: t.id,
                        onClick: () => { setTheme(t); setShowThemePicker(false); onUpdateStack({ ...stack, themeId: t.id }); },
                        style: {
                          display: "flex", alignItems: "center", gap: 10,
                          background: isActive ? "#f5f5f5" : "none",
                          border: "none", borderRadius: 10,
                          cursor: "pointer", padding: "6px 8px",
                          textAlign: "left", width: "100%",
                          outline: "none", transition: "background .1s",
                        },
                        onMouseEnter: e => { if (!isActive) e.currentTarget.style.background = "#f8f8f8"; },
                        onMouseLeave: e => { if (!isActive) e.currentTarget.style.background = "none"; }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1608}}

                        /* Card preview swatch */
                        , React.createElement('div', { style: {
                          width: 46, height: 34, borderRadius: 7, flexShrink: 0,
                          background: t.card,
                          boxShadow: isActive
                            ? "0 0 0 2px #111, 0 2px 6px rgba(0,0,0,0.15)"
                            : "0 0 0 1px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)",
                          display: "flex", flexDirection: "column",
                          justifyContent: "center", padding: "5px 6px",
                          gap: 3, boxSizing: "border-box", position: "relative",
                        }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1623}}
                          , React.createElement('div', { style: { height: 2.5, borderRadius: 1.5, background: t.text, opacity: 0.85, width: "75%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1633}} )
                          , React.createElement('div', { style: { height: 1.5, borderRadius: 1, background: t.text, opacity: 0.35, width: "55%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1634}} )
                          , React.createElement('div', { style: { height: 1.5, borderRadius: 1, background: t.text, opacity: 0.35, width: "65%" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1635}} )
                          /* Meta dot */
                          , React.createElement('div', { style: {
                            position: "absolute", bottom: 4, right: 5,
                            width: 4, height: 4, borderRadius: "50%",
                            background: t.meta, opacity: 0.7,
                          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1637}} )
                        )

                        /* Text info */
                        , React.createElement('div', { style: { flex: 1, minWidth: 0 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1645}}
                          , React.createElement('div', { style: {
                            fontSize: 12, fontWeight: isActive ? 600 : 500,
                            color: "#111", fontFamily: "'Inter', sans-serif",
                            lineHeight: 1.3,
                          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1646}}, t.label)
                          , React.createElement('div', { style: {
                            fontSize: 10.5, color: "#888",
                            fontFamily: "'Inter', sans-serif",
                            lineHeight: 1.4, marginTop: 1,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1651}}, t.desc)
                        )

                        /* Active checkmark */
                        , isActive && (
                          React.createElement('div', { style: { flexShrink: 0, color: "#111", fontSize: 13, fontWeight: 600 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1661}}, "✓")
                        )
                      )
                    );
                  })
                )

                , gi < THEME_GROUPS.length - 1 && (
                  React.createElement('div', { style: { height: 1, background: "#f0f0f0", margin: "0 16px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1669}} )
                )
              )
            ))
          )
        )
      )

      /* Reorder button — only when >1 card */
      , notes.length > 1 && (
        React.createElement('div', { style: { position: "absolute", top: 16, right: 62 }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1679}}
          , React.createElement('button', { onClick: () => { setShowReorder(true); setShowThemePicker(false); setShowDownloadMenu(false); }, style: {
            width: 34, height: 34, borderRadius: "50%",
            border: "1px solid #e5e5e5", background: showReorder ? "#f0f0f0" : "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "background .15s",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1680}}
            , React.createElement('svg', { width: "15", height: "15", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1686}}
              , React.createElement('line', { x1: "3", y1: "6", x2: "21", y2: "6", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1687}}), React.createElement('line', { x1: "3", y1: "12", x2: "21", y2: "12", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1687}}), React.createElement('line', { x1: "3", y1: "18", x2: "21", y2: "18", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1687}})
            )
          )
        )
      )

      /* Reorder button */
      , notes.length > 1 && (
        React.createElement('div', { style: { position: "absolute", top: 16, right: 62 }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1695}}
          , React.createElement('button', { onClick: () => { setShowReorder(true); setShowThemePicker(false); setShowDownloadMenu(false); }, style: {
            width: 34, height: 34, borderRadius: "50%",
            border: "1px solid #e5e5e5", background: showReorder ? "#f0f0f0" : "#fff",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "background .15s",
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1696}}
            , React.createElement('svg', { width: "15", height: "15", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1702}}
              , React.createElement('line', { x1: "3", y1: "6", x2: "21", y2: "6", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1703}}), React.createElement('line', { x1: "3", y1: "12", x2: "21", y2: "12", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1703}}), React.createElement('line', { x1: "3", y1: "18", x2: "21", y2: "18", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1703}})
            )
          )
        )
      )

      /* Download button — top right */

      , React.createElement('div', { style: { position: "absolute", top: 16, right: 20 }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1711}}
        , React.createElement('button', { onClick: () => setShowDownloadMenu(v => !v), style: {
          display: "flex", alignItems: "center", gap: 5,
          background: "#fff", border: "1px solid #e5e5e5",
          borderRadius: 999, padding: "8px 10px",
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
          fontSize: 12, fontWeight: 500, color: "#333",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          transition: "box-shadow .15s, border-color .15s", touchAction: "manipulation",
        },
          onMouseEnter: e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "#bbb"; },
          onMouseLeave: e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#e5e5e5"; }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1712}}
          , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1723}}
            , React.createElement('path', { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"          , __self: this, __source: {fileName: _jsxFileName, lineNumber: 1724}})
            , React.createElement('polyline', { points: "7 10 12 15 17 10"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 1725}})
            , React.createElement('line', { x1: "12", y1: "15", x2: "12", y2: "3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1726}})
          )
        )

        /* Dropdown */
        , showDownloadMenu && (
          React.createElement('div', { style: {
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#fff", borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
            overflow: "hidden", minWidth: 200, zIndex: 999,
          }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1732}}
            /* Image section */
            , React.createElement('div', { style: { padding: "8px 16px 4px", fontSize: 10, fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", letterSpacing: 1, textTransform: "uppercase" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1739}}, "Image")
            , [
              { label: "Current card", scope: "current" },
              { label: "All cards",    scope: "all" },
            ].map(({ label, scope }) => (
              React.createElement('button', { key: scope, onClick: () => exportAsJpeg(scope), style: {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "10px 16px", border: "none",
                background: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#000",
                textAlign: "left", transition: "background .1s",
              },
                onMouseEnter: e => e.currentTarget.style.background = "#f7f7f5",
                onMouseLeave: e => e.currentTarget.style.background = "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1744}}
                , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 1753}}, label)
                , React.createElement('span', { style: { fontSize: 11, color: "#aaa" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1754}}, ".jpg")
              )
            ))

            /* Divider */
            , React.createElement('div', { style: { height: 1, background: "#f0f0f0", margin: "4px 0" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1759}} )

            /* Text section */
            , React.createElement('div', { style: { padding: "8px 16px 4px", fontSize: 10, fontWeight: 600, color: "#aaa", fontFamily: "'Inter', sans-serif", letterSpacing: 1, textTransform: "uppercase" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1762}}, "Text")
            , [
              { fmt: "txt",  label: "Plain text", ext: ".txt"  },
              { fmt: "md",   label: "Markdown",   ext: ".md"   },
              { fmt: "json", label: "JSON",        ext: ".json" },
            ].map(({ fmt, label, ext }) => (
              React.createElement('button', { key: fmt, onClick: () => handleDownload(fmt), style: {
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "10px 16px", border: "none",
                background: "none", cursor: "pointer",
                fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#000",
                textAlign: "left", transition: "background .1s",
              },
                onMouseEnter: e => e.currentTarget.style.background = "#f7f7f5",
                onMouseLeave: e => e.currentTarget.style.background = "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1768}}
                , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 1777}}, label)
                , React.createElement('span', { style: { fontSize: 11, color: "#aaa" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1778}}, ext)
              )
            ))
            , React.createElement('div', { style: { height: 8 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1781}} )
          )
        )
      )

      /* Carousel */
      , React.createElement('div', {
        id: "carousel-container",
        style: {
          width: "100%", height: 420, position: "relative", flexShrink: 0,
          overflow: "hidden", perspective: "900px", perspectiveOrigin: "50% 50%",
          touchAction: "pan-y", cursor: dragging ? "grabbing" : "grab",
        },
        'data-carousel': "1",
        'data-carousel': "1",
        onPointerDown: onPointerDown,
        onPointerMove: onPointerMove,
        onPointerUp: onPointerUp,
        onPointerCancel: onPointerUp, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1787}}

        , visibleNotes.map((note, i) => {
          const t = getTransform(i);
          if (!t) return null;
          const { tx, rotateY, tz, scale, opacity, zIndex } = t;
          const isAct = i === active;
          return (
            React.createElement('div', { key: `${note.id}-${theme && theme.id}`,
              onClick: () => { if (!isAct && Math.abs(dragX) < 8) setActive(i); },
              style: {
                position: "absolute", width: CARD_W, height: 380,
                left: "50%", top: "50%",
                marginLeft: -(CARD_W / 2), marginTop: -190,
                transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${rotateY}deg) scale(${scale})`,
                transformStyle: "preserve-3d",
                transition: dragging ? "none" : `transform 0.42s ${ease}, opacity 0.35s ease`,
                opacity, zIndex,
                cursor: isAct ? "default" : "pointer",
                pointerEvents: opacity < 0.1 ? "none" : "auto",
                willChange: "transform",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1807}}
              , React.createElement(NoteCard, { note: note, isActive: isAct && !note.isGhost,
                onChange: handleChange, onDelete: handleDelete,
                count: count, active: active, onGoTo: setActive,
                theme: theme, cardIndex: note.index, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1821}} )
            )
          );
        })
      )



      , React.createElement('div', { style: { height: 40 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1832}} )

      /* ── Reorder sheet ── */
      , showReorder && (
        React.createElement('div', {
          style: { position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)" },
          onClick: () => setShowReorder(false), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1836}}

          , React.createElement('div', {
            style: {
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#fff", borderRadius: "20px 20px 0 0",
              maxHeight: "70vh", overflowY: "auto",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
            },
            onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1840}}

            /* Handle */
            , React.createElement('div', { style: { display: "flex", justifyContent: "center", paddingTop: 12 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1850}}
              , React.createElement('div', { style: { width: 36, height: 4, borderRadius: 2, background: "#e0e0e0" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1851}} )
            )

            /* Header */
            , React.createElement('div', { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1855}}
              , React.createElement('span', { style: { fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 600, color: "#111" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1856}}, "Reorder Cards" )
              , React.createElement('button', { onClick: () => setShowReorder(false), style: {
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#888", padding: "4px 8px",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1857}}, "Done")
            )

            /* Drag list */
            , React.createElement('div', {
              ref: reorderListRef,
              style: { padding: "4px 16px 24px", touchAction: "none", userSelect: "none" },
              onPointerMove: onRowPointerMove,
              onPointerUp: onRowPointerUp,
              onPointerCancel: onRowPointerUp, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1864}}

              , notes.map((note, i) => {
                const isDragging = dragRowIdx === i;
                const isDropTarget = dropRowIdx === i && dragRowIdx !== null && dragRowIdx !== i;
                const preview = note.text.replace(/^[#*]+\s*/gm, '').trim().slice(0, 50) || 'Empty card';

                // Visual Y offset for non-dragged rows sliding to make room
                let rowTranslateY = 0;
                if (dragRowIdx !== null && dropRowIdx !== null && dragRowIdx !== dropRowIdx) {
                  const from = dragRowIdx, to = dropRowIdx;
                  if (from < to && i > from && i <= to) rowTranslateY = -64;
                  else if (from > to && i >= to && i < from) rowTranslateY = 64;
                }

                // Card colour chip
                const palette = _optionalChain([theme, 'access', _17 => _17.palette, 'optionalAccess', _18 => _18.length]) > 0 ? theme.palette : [theme.card];
                const stableSeed = note.colorSeed != null ? note.colorSeed : i * 7919;
                const cardBg = palette[((stableSeed * 1664525 + 1013904223) >>> 0) % palette.length];

                return (
                  React.createElement('div', { key: note.id, style: {
                    transform: isDragging ? `translateY(${dragRowY}px) scale(1.02)` : `translateY(${rowTranslateY}px)`,
                    transition: isDragging ? 'none' : 'transform 0.18s ease',
                    zIndex: isDragging ? 50 : 1,
                    position: 'relative',
                    marginBottom: 8,
                  }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1890}}
                    , React.createElement('div', {
                      onPointerDown: e => onRowPointerDown(e, i),
                      style: {
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px",
                        borderRadius: 14,
                        background: isDragging ? "#fff" : isDropTarget ? "#f5f5f5" : "#fafafa",
                        boxShadow: isDragging
                          ? "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)"
                          : "0 1px 3px rgba(0,0,0,0.06)",
                        border: `1.5px solid ${isDropTarget ? "#ddd" : "transparent"}`,
                        cursor: "grab", touchAction: "none",
                      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1897}}

                      /* Colour chip */
                      , React.createElement('div', { style: {
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: cardBg, border: "1px solid rgba(0,0,0,0.07)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1912}}
                        , React.createElement('span', { style: { fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700, color: theme.text, opacity: 0.5 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1917}}, i+1)
                      )

                      /* Text preview */
                      , React.createElement('span', { style: {
                        flex: 1, fontFamily: "'Inter',sans-serif", fontSize: 13,
                        color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1921}}, preview)

                      /* Grip */
                      , React.createElement('svg', { width: "18", height: "18", viewBox: "0 0 24 24"   , fill: "none", stroke: "#ccc", strokeWidth: "2", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1927}}
                        , React.createElement('circle', { cx: "8",  cy: "6",  r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1928}})
                        , React.createElement('circle', { cx: "16", cy: "6",  r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1929}})
                        , React.createElement('circle', { cx: "8",  cy: "12", r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1930}})
                        , React.createElement('circle', { cx: "16", cy: "12", r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1931}})
                        , React.createElement('circle', { cx: "8",  cy: "18", r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1932}})
                        , React.createElement('circle', { cx: "16", cy: "18", r: "1.2", fill: "#ccc", stroke: "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 1933}})
                      )
                    )
                  )
                );
              })
            )
          )
        )
      )


    )
  );
}

/* ── Home screen ── */
function HomeScreen({ stacks, onOpen, onNew, onDelete, onRename }) {
  const [menu, setMenu] = useState(null); // { id, x, y }
  const [renaming, setRenaming] = useState(null); // { id, value }
  const longPressRef = useRef(null);

  const startLongPress = (e, stackId) => {
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    longPressRef.current = setTimeout(() => {
      setMenu({ id: stackId, x, y });
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  const closeMenu = () => setMenu(null);

  const handleRenameStart = (id) => {
    const stack = stacks.find(s => s.id === id);
    setRenaming({ id, value: stack.name || "" });
    setMenu(null);
  };

  const handleRenameConfirm = () => {
    if (renaming) { onRename(renaming.id, renaming.value.trim()); setRenaming(null); }
  };

  return (
    React.createElement('div', { style: { width: "100%", maxWidth: 440, minHeight: "100vh", padding: "0 20px 40px", boxSizing: "border-box" },
      onClick: closeMenu, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1980}}

      /* Rename modal */
      , renaming && (
        React.createElement('div', { style: {
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }, onClick: e => { e.stopPropagation(); setRenaming(null); }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1985}}
          , React.createElement('div', { style: {
            background: "#fff", borderRadius: 16, padding: "24px 24px 20px",
            width: 280, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 1989}}
            , React.createElement('p', { style: { fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 14 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1993}}, "Rename note" )
            , React.createElement('input', {
              autoFocus: true,
              value: renaming.value,
              onChange: e => setRenaming(r => ({ ...r, value: e.target.value })),
              onKeyDown: e => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setRenaming(null); },
              placeholder: "Note name…" ,
              style: {
                width: "100%", border: "1px solid #e5e5e5", borderRadius: 8,
                padding: "9px 12px", fontFamily: "'Inter', sans-serif",
                fontSize: 14, color: "#000", outline: "none",
                boxSizing: "border-box", background: "#fafafa",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 1994}}
            )
            , React.createElement('div', { style: { display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2007}}
              , React.createElement('button', { onClick: () => setRenaming(null), style: {
                border: "1px solid #e5e5e5", borderRadius: 8, padding: "7px 16px",
                background: "#fff", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                fontSize: 13, color: "#666",
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2008}}, "Cancel")
              , React.createElement('button', { onClick: handleRenameConfirm, style: {
                border: "none", borderRadius: 8, padding: "7px 16px",
                background: "#111", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                fontSize: 13, color: "#fff", fontWeight: 500,
              }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2013}}, "Save")
            )
          )
        )
      )

      /* Context menu */
      , menu && (
        React.createElement('div', { style: {
          position: "fixed",
          top: Math.min(menu.y, window.innerHeight - 120),
          left: Math.min(menu.x, window.innerWidth - 160),
          background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)",
          zIndex: 999, overflow: "hidden", minWidth: 150,
        }, onClick: e => e.stopPropagation(), __self: this, __source: {fileName: _jsxFileName, lineNumber: 2025}}
          , React.createElement('button', { onClick: () => { handleRenameStart(menu.id); }, style: {
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "12px 16px", border: "none",
            background: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
            fontSize: 13, color: "#000", textAlign: "left",
            transition: "background .1s",
          },
            onMouseEnter: e => e.currentTarget.style.background = "#f7f7f5",
            onMouseLeave: e => e.currentTarget.style.background = "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2033}}
            , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2042}}
              , React.createElement('path', { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"                 , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2043}})
              , React.createElement('path', { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"           , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2044}})
            ), "Rename"

          )
          , React.createElement('div', { style: { height: 1, background: "#f0f0f0", margin: "0 12px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2048}} )
          , React.createElement('button', { onClick: () => { onDelete(menu.id); closeMenu(); }, style: {
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "12px 16px", border: "none",
            background: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
            fontSize: 13, color: "#e03131", textAlign: "left",
            transition: "background .1s",
          },
            onMouseEnter: e => e.currentTarget.style.background = "#fff5f5",
            onMouseLeave: e => e.currentTarget.style.background = "none", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2049}}
            , React.createElement('svg', { width: "14", height: "14", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2058}}
              , React.createElement('polyline', { points: "3 6 5 6 21 6"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2059}}), React.createElement('path', { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"            , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2059}})
              , React.createElement('path', { d: "M10 11v6M14 11v6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2060}}), React.createElement('path', { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"            , __self: this, __source: {fileName: _jsxFileName, lineNumber: 2060}})
            ), "Delete"

          )
        )
      )

      /* Header */
      , React.createElement('div', { style: { padding: "52px 0 28px" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2068}}
        , React.createElement('h1', { style: { fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 700, color: "#000", letterSpacing: -0.5 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2069}}, "Card Notes"

        )
      )

      /* Grid */
      , stacks.length === 0 ? (
        React.createElement('div', { style: { textAlign: "center", paddingTop: 80 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2076}}
          , React.createElement('p', { style: { fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#bbb" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2077}}, "No notes yet. Tap + to create one."       )
        )
      ) : (
        React.createElement('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2080}}
          , stacks.map(stack => (
            React.createElement('div', { key: stack.id, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2082}}
              , React.createElement('div', {
                onMouseDown: e => startLongPress(e, stack.id),
                onMouseUp: cancelLongPress,
                onMouseLeave: cancelLongPress,
                onTouchStart: e => startLongPress(e, stack.id),
                onTouchEnd: cancelLongPress,
                onTouchMove: cancelLongPress,
                onClick: () => { if (!menu) onOpen(stack.id); },
                style: { userSelect: "none", WebkitUserSelect: "none" }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2083}}

                , React.createElement(StackCard, { stack: stack, theme: THEMES.find(t => t.id === (stack.themeId || 'white')) || THEMES[0], __self: this, __source: {fileName: _jsxFileName, lineNumber: 2093}} )
              )
              , React.createElement('p', { style: { fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#aaa", marginTop: 6, paddingLeft: 2 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2095}}
                , stack.name && React.createElement('span', { style: { color: "#555", fontWeight: 500 }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2096}}, stack.name, " · "  ), "Edited "
                 , timeAgo(stack.createdAt)
              )
            )
          ))
        )
      )
      /* FAB — create new stack */
      , React.createElement('button', {
        onClick: onNew,
        style: {
          position: "fixed", bottom: 32, right: 24,
          width: 56, height: 56, borderRadius: "50%",
          background: "#111", border: "none",
          cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
          transition: "transform .15s, box-shadow .15s",
          touchAction: "manipulation", zIndex: 100,
        },
        onMouseEnter: e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.30)"; },
        onMouseLeave: e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)"; }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2104}}

        , React.createElement('svg', { width: "22", height: "22", viewBox: "0 0 24 24"   , fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2119}}
          , React.createElement('line', { x1: "12", y1: "5", x2: "12", y2: "19", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2120}}), React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12", __self: this, __source: {fileName: _jsxFileName, lineNumber: 2120}})
        )
      )
    )
  );
}

/* ── Root ── */
function App() {
  const firstStack = mkStack();
  const [stacks, setStacks] = useState([firstStack]);
  const [openId, setOpenId] = useState(firstStack.id);

  const handleNew = () => {
    const s = mkStack();
    setStacks(prev => [s, ...prev]);
    setOpenId(s.id);
  };

  const handleDelete = (id) => {
    setStacks(prev => prev.filter(s => s.id !== id));
  };

  const handleRename = (id, name) => {
    setStacks(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleOpen = (id) => setOpenId(id);
  const handleBack = () => setOpenId(null);

  const handleUpdateStack = (updated) => {
    setStacks(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated, createdAt: Date.now() } : s));
  };

  const activeStack = stacks.find(s => s.id === openId);

  return (
    React.createElement(React.Fragment, null
      , React.createElement('style', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 2158}}, `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;700&family=Scheherazade+New:wght@400;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f7f5; overflow-x: hidden; }
        ::-webkit-scrollbar { display: none; }
        textarea::placeholder { color: #ccc; }
        textarea { -webkit-user-select: text !important; user-select: text !important; outline: none !important; border: none !important; box-shadow: none !important; }
        textarea:focus { outline: none !important; border: none !important; box-shadow: none !important; }
      `)

      , React.createElement('div', { style: {
        minHeight: "100vh", width: "100%", background: "#f7f7f5",
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'Inter', sans-serif", overflowX: "hidden",
      }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2168}}
        , openId && activeStack ? (
          React.createElement(CarouselScreen, {
            key: openId,
            stack: activeStack,
            onBack: handleBack,
            onUpdateStack: handleUpdateStack, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2174}}
          )
        ) : (
          React.createElement(HomeScreen, { stacks: stacks, onOpen: handleOpen, onNew: handleNew, onDelete: handleDelete, onRename: handleRename, __self: this, __source: {fileName: _jsxFileName, lineNumber: 2181}} )
        )
      )
    )
  );
}
  exportAsJpeg = async (scope = "current") => {
    setShowDownloadMenu(false);
    const name = stack.name || "note";

    // Load html2canvas from CDN
    const loadH2C = () => new Promise((resolve, reject) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = () => resolve(window.html2canvas);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    const h2c = await loadH2C();

    const captureNote = async (note, noteIdx, filename) => {
      // Build an offscreen container that clones the card at EXACT same size
      const CARD_W = 300, CARD_H = 380;
      const T = theme || {};
      const palette = T.palette && T.palette.length > 0 ? T.palette : [T.card || "#fff"];
      const seed = note.colorSeed != null ? note.colorSeed : 0;
      const cardBg = palette.length === 1 ? palette[0] : palette[((seed * 1664525 + 1013904223) >>> 0) % palette.length];

      // Clone the actual card DOM element
      const cardEl = document.querySelector(`[data-card-id="${note.id}"]`);
      if (!cardEl) return;

      // Create offscreen wrapper at exact card size
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;border-radius:16px;`;
      
      // Clone the card
      const clone = cardEl.cloneNode(true);
      clone.style.cssText = `width:${CARD_W}px;height:${CARD_H}px;border-radius:16px;overflow:hidden;box-shadow:none;`;
      
      // Remove all interactive/UI-only elements from clone
      clone.querySelectorAll("button").forEach(el => el.remove());
      // Remove the dot navigation row (last child div with dots)
      const dots = clone.querySelector("[data-dots]");
      if (dots) dots.remove();
      // Remove RadialCounter (char count circle)
      clone.querySelectorAll("svg").forEach(el => {
        // keep nothing - remove all SVGs (delete btn, counter arc)
        const parent = el.parentElement;
        if (parent && parent !== clone) parent.style.display = "none";
      });
      // Remove contenteditable attrs so text renders cleanly
      clone.querySelectorAll("[contenteditable]").forEach(el => {
        el.removeAttribute("contenteditable");
        el.style.outline = "none";
        el.style.caretColor = "transparent";
      });

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Wait a frame for layout
      await new Promise(r => requestAnimationFrame(r));

      const canvas = await h2c(wrapper, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardBg,
        logging: false,
        width: CARD_W,
        height: CARD_H,
      });

      document.body.removeChild(wrapper);

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 0.96);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    if (scope === "current") {
      const note = notes[active];
      if (!note) return;
      await captureNote(note, active, `${name}-card-${active + 1}.jpg`);
    } else {
      const filled = notes.filter(n => n.text.trim());
      for (let i = 0; i < filled.length; i++) {
        const note = filled[i];
        const noteIdx = notes.indexOf(note);
        await captureNote(note, noteIdx, `${name}-card-${noteIdx + 1}.jpg`);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
