/* Color Convert — CSS color parsing and sRGB / HSL / HWB / OKLab / OKLCH / CMYK maths, all local. */
(function () {
  "use strict";
  var $ = S3.$, h = S3.h;

  var NAMED_SRC = "aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 " +
    "blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e " +
    "coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b " +
    "darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 " +
    "darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f " +
    "darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff " +
    "firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 " +
    "gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 " +
    "khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 " +
    "lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a " +
    "lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 " +
    "lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 " +
    "mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc " +
    "mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 " +
    "oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 " +
    "paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 " +
    "purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 " +
    "seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 " +
    "snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee " +
    "wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32";
  var NAMED = {};
  (function () { var a = NAMED_SRC.split(" "); for (var i = 0; i < a.length; i += 2) NAMED[a[i]] = a[i + 1]; })();

  // ---------- maths (r, g, b in 0..1 gamma-encoded sRGB; may exceed 0..1 for out-of-gamut OKLCH input) ----------
  function toLin(c) { var a = Math.abs(c); return (a <= 0.04045 ? a / 12.92 : Math.pow((a + 0.055) / 1.055, 2.4)) * (c < 0 ? -1 : 1); }
  function toGam(c) { var a = Math.abs(c); return (a <= 0.0031308 ? 12.92 * a : 1.055 * Math.pow(a, 1 / 2.4) - 0.055) * (c < 0 ? -1 : 1); }
  // Björn Ottosson's OKLab (2020) matrices
  function rgbToOklab(c) {
    var r = toLin(c.r), g = toLin(c.g), b = toLin(c.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return { L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s };
  }
  function oklabToRgb(o) {
    var l = Math.pow(o.L + 0.3963377774 * o.a + 0.2158037573 * o.b, 3);
    var m = Math.pow(o.L - 0.1055613458 * o.a - 0.0638541728 * o.b, 3);
    var s = Math.pow(o.L - 0.0894841775 * o.a - 1.2914855480 * o.b, 3);
    return { r: toGam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), g: toGam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), b: toGam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s) };
  }
  function oklabToOklch(o) { var C = Math.hypot(o.a, o.b), H = Math.atan2(o.b, o.a) * 180 / Math.PI; return { L: o.L, C: C, h: C < 1e-4 ? 0 : (H + 360) % 360 }; }
  function oklchToOklab(o) { var r = o.h * Math.PI / 180; return { L: o.L, a: o.C * Math.cos(r), b: o.C * Math.sin(r) }; }
  function rgbToHsl(c) {
    var r = c.r, g = c.g, b = c.b, max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2, hh = 0, s = 0;
    if (d > 1e-9) {
      s = d / (1 - Math.abs(2 * l - 1));
      hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh = (hh * 60 + 360) % 360;
    }
    return { h: hh, s: s, l: l };
  }
  function hslToRgb(hh, s, l) {
    function f(n) { var k = (n + hh / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
    return { r: f(0), g: f(8), b: f(4) };
  }
  function hwbToRgb(hh, w, bl) {
    if (w + bl >= 1) { var g = w / (w + bl); return { r: g, g: g, b: g }; }
    var c = hslToRgb(hh, 1, 0.5);
    return { r: c.r * (1 - w - bl) + w, g: c.g * (1 - w - bl) + w, b: c.b * (1 - w - bl) + w };
  }
  function clamp01(x) { return Math.min(1, Math.max(0, x)); }
  function clip(c) { return { r: clamp01(c.r), g: clamp01(c.g), b: clamp01(c.b), a: c.a }; }
  function inGamut(c) { var e = 1e-4; return [c.r, c.g, c.b].every(function (v) { return v >= -e && v <= 1 + e; }); }
  function luminance(c) { return 0.2126 * toLin(c.r) + 0.7152 * toLin(c.g) + 0.0722 * toLin(c.b); }
  function contrast(c1, c2) { var a = luminance(clip(c1)), b = luminance(clip(c2)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
  function over(c, bg) { return { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a), a: 1 }; }
  function cmyk(c) { c = clip(c); var k = 1 - Math.max(c.r, c.g, c.b); if (k >= 1) return [0, 0, 0, 1]; return [(1 - c.r - k) / (1 - k), (1 - c.g - k) / (1 - k), (1 - c.b - k) / (1 - k), k]; }

  // ---------- parsing ----------
  function num(tok, ref) { // "50%" -> .5*ref ; "0.5" -> 0.5
    if (tok == null) return NaN;
    if (/%$/.test(tok)) return parseFloat(tok) / 100 * ref;
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(tok) ? parseFloat(tok) : NaN;
  }
  function hue(tok) {
    var m = /^([-+]?(?:\d+\.?\d*|\.\d+))(deg|rad|grad|turn)?$/i.exec(tok || "");
    if (!m) return NaN;
    var v = parseFloat(m[1]), u = (m[2] || "deg").toLowerCase();
    v = u === "rad" ? v * 180 / Math.PI : u === "grad" ? v * 0.9 : u === "turn" ? v * 360 : v;
    return ((v % 360) + 360) % 360;
  }
  function alphaTok(t) { if (t == null) return 1; var a = num(t, 1); return isNaN(a) ? NaN : clamp01(a); }
  function parseColor(input) {
    var s = String(input || "").trim().toLowerCase();
    if (!s) return null;
    if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    if (NAMED[s]) s = "#" + NAMED[s];
    var hx = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
    if (hx) {
      var x = hx[1];
      if (x.length <= 4) x = x.split("").map(function (ch) { return ch + ch; }).join("");
      return { r: parseInt(x.slice(0, 2), 16) / 255, g: parseInt(x.slice(2, 4), 16) / 255, b: parseInt(x.slice(4, 6), 16) / 255, a: x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1 };
    }
    var fm = /^([a-z]+)\((.*)\)$/.exec(s);
    if (!fm) return null;
    var fn = fm[1], toks = fm[2].replace(/\//g, " / ").split(/[\s,]+/).filter(Boolean), al = 1, si = toks.indexOf("/");
    if (si >= 0) { al = alphaTok(toks[si + 1]); toks = toks.slice(0, si); }
    else if (toks.length === 4) { al = alphaTok(toks[3]); toks = toks.slice(0, 3); }
    if (toks.length !== 3 || isNaN(al)) return null;
    var c;
    if (fn === "rgb" || fn === "rgba") c = { r: num(toks[0], 255) / 255, g: num(toks[1], 255) / 255, b: num(toks[2], 255) / 255 };
    else if (fn === "hsl" || fn === "hsla") { var S = num(toks[1].replace(/%?$/, "%"), 1), L = num(toks[2].replace(/%?$/, "%"), 1); c = hslToRgb(hue(toks[0]), clamp01(S), clamp01(L)); }
    else if (fn === "hwb") c = hwbToRgb(hue(toks[0]), clamp01(num(toks[1].replace(/%?$/, "%"), 1)), clamp01(num(toks[2].replace(/%?$/, "%"), 1)));
    else if (fn === "oklch") c = oklabToRgb(oklchToOklab({ L: clamp01(num(toks[0], 1)), C: Math.max(0, num(toks[1], 0.4)), h: hue(toks[2]) }));
    else if (fn === "oklab") c = oklabToRgb({ L: clamp01(num(toks[0], 1)), a: num(toks[1], 0.4), b: num(toks[2], 0.4) });
    else return null;
    if ([c.r, c.g, c.b].some(isNaN)) return null;
    if (fn === "rgb" || fn === "rgba") c = clip(c);
    c.a = al;
    return c;
  }

  // ---------- formatting ----------
  function r(x, d) { var p = Math.pow(10, d); return String(Math.round(x * p) / p); }
  function b255(x) { return Math.round(clamp01(x) * 255); }
  function hex2(x) { return b255(x).toString(16).padStart(2, "0"); }
  function toHex(c) { return "#" + hex2(c.r) + hex2(c.g) + hex2(c.b) + (c.a < 1 ? hex2(c.a) : ""); }
  function formats(c) {
    var cc = clip(c), hs = rgbToHsl(cc), lab = rgbToOklab(c), lch = oklabToOklch(lab), a = c.a < 1, A = r(c.a, 3), k = cmyk(c);
    var hw = { h: hs.h, w: Math.min(cc.r, cc.g, cc.b), b: 1 - Math.max(cc.r, cc.g, cc.b) };
    return [
      ["HEX", toHex(c)],
      ["RGB", (a ? "rgba(" : "rgb(") + b255(c.r) + ", " + b255(c.g) + ", " + b255(c.b) + (a ? ", " + A : "") + ")"],
      ["HSL", (a ? "hsla(" : "hsl(") + r(hs.h, 1) + ", " + r(hs.s * 100, 1) + "%, " + r(hs.l * 100, 1) + "%" + (a ? ", " + A : "") + ")"],
      ["HWB", "hwb(" + r(hw.h, 1) + " " + r(hw.w * 100, 1) + "% " + r(hw.b * 100, 1) + "%" + (a ? " / " + A : "") + ")"],
      ["OKLCH", "oklch(" + r(lch.L * 100, 2) + "% " + r(lch.C, 4) + " " + r(lch.h, 2) + (a ? " / " + A : "") + ")"],
      ["OKLab", "oklab(" + r(lab.L * 100, 2) + "% " + r(lab.a, 4) + " " + r(lab.b, 4) + (a ? " / " + A : "") + ")"],
      ["CMYK", "cmyk(" + k.map(function (v) { return r(v * 100, 1) + "%"; }).join(", ") + ")"],
      ["Float", [cc.r, cc.g, cc.b].concat(a ? [c.a] : []).map(function (v) { return v.toFixed(4); }).join(", ")]
    ];
  }
  function nearestNamed(c) {
    var o = rgbToOklab(clip(c)), best = null, bd = Infinity;
    Object.keys(NAMED).forEach(function (n) {
      var p = rgbToOklab(parseColor("#" + NAMED[n])), d = Math.hypot(o.L - p.L, o.a - p.a, o.b - p.b);
      if (d < bd - 1e-12) { bd = d; best = n; }
    });
    return { name: best, dist: bd };
  }

  // ---------- UI ----------
  var input = $("#in"), cur = null;
  var WHITE = { r: 1, g: 1, b: 1, a: 1 }, BLACK = { r: 0, g: 0, b: 0, a: 1 };

  function stat(label, value, pass) {
    return h("div", { "class": "stat" }, [h("b", { text: value }), h("span", null, [label + " ", h("span", { "class": "chip " + (pass ? "ok" : "bad"), text: pass ? "AA ✓" : "AA ✗" })])]);
  }
  function render(c, opts) {
    opts = opts || {};
    cur = c;
    var css = toHex(clip(c)), onW = over(clip(c), WHITE), onB = over(clip(c), BLACK), lum = luminance(c.a < 1 ? onW : clip(c));
    $("#swatch").style.background = "rgba(" + b255(c.r) + "," + b255(c.g) + "," + b255(c.b) + "," + c.a + ")";
    $("#sw-label").textContent = css.toUpperCase();
    $("#sw-label").style.color = contrast(onW, BLACK) >= contrast(onW, WHITE) ? "#000" : "#fff";
    if (!opts.keepPicker) $("#picker").value = toHex({ r: c.r, g: c.g, b: c.b, a: 1 });
    if (!opts.keepAlpha) { $("#alpha").value = Math.round(c.a * 100); }
    $("#alpha-v").textContent = Math.round(c.a * 100) + "%";
    $("#gamut").hidden = inGamut(c);

    var box = $("#formats"); box.textContent = "";
    formats(c).forEach(function (f) {
      box.appendChild(h("div", { "class": "frow" }, [h("span", { "class": "fl", text: f[0] }), h("code", { "class": "fv", text: f[1] }),
        h("button", { "class": "btn small ghost icon", "data-copy": f[1], "aria-label": "Copy " + f[0], title: "Copy" }, [icon("copy")])]));
    });
    var ct = $("#contrast"); ct.textContent = "";
    var cw = contrast(onW, WHITE), cb = contrast(onB, BLACK);
    ct.appendChild(stat("vs white", r(cw, 2) + ":1", cw >= 4.5));
    ct.appendChild(stat("vs black", r(cb, 2) + ":1", cb >= 4.5));
    ct.appendChild(h("div", { "class": "stat" }, [h("b", { text: r(lum, 4) }), h("span", { text: "relative luminance" })]));
    var nn = nearestNamed(c), named = $("#named"); named.textContent = "";
    named.appendChild(h("span", { "class": "dot", style: "background:#" + NAMED[nn.name] }));
    named.appendChild(h("span", null, [nn.dist < 1e-6 ? "Exactly " : "Nearest named color: ", h("button", { "class": "linkish", "data-name": nn.name, text: nn.name }),
      nn.dist < 1e-6 ? "" : h("span", { "class": "faint", text: " (ΔE " + r(nn.dist * 100, 1) + ")" })]));
    renderScale(c);
    S3.store("cc.last", input.value);
  }
  function icon(n) { var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", "i"); var u = document.createElementNS("http://www.w3.org/2000/svg", "use"); u.setAttribute("href", "#i-" + n); s.appendChild(u); return s; }
  function renderScale(c) {
    var lch = oklabToOklch(rgbToOklab(c)), box = $("#scale"); box.textContent = "";
    [0.97, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2].forEach(function (L) {
      var rgb = clip(oklabToRgb(oklchToOklab({ L: L, C: lch.C * Math.min(1, 1.2 - Math.abs(L - 0.6)), h: lch.h }))); rgb.a = 1;
      var hx = toHex(rgb);
      box.appendChild(h("button", { "class": "step", "data-c": hx, style: "background:" + hx + ";color:" + (L > 0.62 ? "#000" : "#fff"), title: hx }, [h("b", { text: String(Math.round(L * 100)) }), h("span", { text: hx })]));
    });
  }
  function fromInput() {
    var c = parseColor(input.value);
    $("#err").textContent = c || !input.value.trim() ? "" : "Couldn't read that color. Try #ff8800, rgb(255 136 0), hsl(32 100% 50%), oklch(70% 0.18 55) or a name.";
    input.setAttribute("aria-invalid", c ? "false" : "true");
    if (c) render(c);
  }
  function setValue(str) { input.value = str; fromInput(); }

  input.addEventListener("input", S3.debounce(fromInput, 120));
  $("#picker").addEventListener("input", function () {
    var c = parseColor(this.value); c.a = +$("#alpha").value / 100;
    input.value = toHex(c); render(c, { keepPicker: true });
  });
  $("#alpha").addEventListener("input", function () {
    if (!cur) return;
    var c = { r: cur.r, g: cur.g, b: cur.b, a: +this.value / 100 };
    // keep the user's format: rgb(…) stays rgb(…), hex stays hex
    var idx = { rgb: 1, rgba: 1, hsl: 2, hsla: 2, hwb: 3, oklch: 4, oklab: 5 }[(/^([a-z]+)\(/.exec(input.value.trim().toLowerCase()) || [])[1]];
    input.value = formats(c)[idx || 0][1];
    render(c, { keepAlpha: true });
  });
  $("#random").addEventListener("click", function () {
    var lch = { L: 0.55 + Math.random() * 0.3, C: 0.08 + Math.random() * 0.12, h: Math.random() * 360 };
    var c = clip(oklabToRgb(oklchToOklab(lch))); c.a = 1; setValue(toHex(c));
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (b) { S3.copy(b.dataset.copy); S3.done(); return; }
    var n = e.target.closest("[data-name]"); if (n) { setValue(n.dataset.name); return; }
    var s = e.target.closest(".step"); if (s) setValue(s.dataset.c);
  });

  setValue(S3.store("cc.last") || "#3dd6d0");

  window.S3_DEMO = function () { setValue("oklch(72% 0.12 195 / 0.9)"); };

  // Known answers + cross-check against the browser's own CSS color parser (canvas).
  window.S3_SELFTEST = function () {
    function near(a, b, t) { return Math.abs(a - b) <= (t || 1e-4); }
    var red = oklabToOklch(rgbToOklab(parseColor("#ff0000")));
    var green = oklabToOklch(rgbToOklab(parseColor("lime")));
    var white = oklabToOklch(rgbToOklab(parseColor("white")));
    var lch = { L: 0.7, C: 0.1, h: 200 }, back = oklabToOklch(rgbToOklab(oklabToRgb(oklchToOklab(lch))));
    var hs = rgbToHsl(parseColor("#ff8000")), k = cmyk(parseColor("#ff8000"));
    var known = [
      near(red.L, 0.627955, 1e-5),
      near(red.C, 0.257683, 1e-5),
      near(red.h, 29.2339, 1e-3),
      near(green.L, 0.866440, 1e-5),
      near(green.C, 0.294827, 1e-5),
      near(green.h, 142.4953, 1e-3),
      near(white.L, 1, 1e-6),
      white.C < 1e-6,
      near(back.L, 0.7, 1e-6),
      near(back.C, 0.1, 1e-6),
      near(back.h, 200, 1e-4),
      toHex(parseColor("hsl(30 100% 50%)")) === "#ff8000",
      near(hs.h, 30.12, 0.01),
      near(hs.s, 1),
      near(hs.l, 0.5),
      parseColor("rgb(255 0 0 / 50%)").a === 0.5,
      toHex(parseColor("rgba(255,0,0,.5)")) === "#ff000080",
      near(luminance(parseColor("red")), 0.2126, 1e-9),
      near(contrast(parseColor("white"), parseColor("black")), 21, 1e-9),
      r(contrast(parseColor("#777"), parseColor("#fff")), 2) === "4.48",
      near(k[1], 0.498, 1e-3),
      k[0] === 0,
      k[2] === 1,
      k[3] === 0,
      nearestNamed(parseColor("#ff6348")).name === "tomato",
      parseColor("nonsense") === null,
      parseColor("rgb(1,2)") === null,
      formats(parseColor("#3dd6d0"))[1][1] === "rgb(61, 214, 208)",
      Object.keys(NAMED).length === 148
    ];
    if (known.indexOf(false) >= 0) return "known answer #" + known.indexOf(false) + " failed";
    var cv = document.createElement("canvas"); cv.width = cv.height = 1;
    var ctx = cv.getContext("2d", { willReadFrequently: true });
    function browser(str) { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#010203"; ctx.fillStyle = str; ctx.fillRect(0, 0, 1, 1); return ctx.getImageData(0, 0, 1, 1).data; }
    var samples = Object.keys(NAMED).concat(["#abc", "#a1b2c3", "rgb(10% 50% 90%)", "rgba(10, 20, 30, 1)", "hsl(210deg 40% 30%)", "hsl(0.5turn, 60%, 40%)",
      "hsla(300, 76%, 72%, 1)", "hwb(120 20% 30%)", "hwb(30 60% 60%)", "oklch(60% 0.15 250)", "oklch(0.9 0.05 90)", "oklab(0.5 0.1 -0.1)", "oklab(70% -0.1 0.05)"]);
    for (var i = 0; i < samples.length; i++) {
      var mine = parseColor(samples[i]), d = browser(samples[i]);
      if (!mine) return "could not parse " + samples[i];
      if (Math.abs(b255(mine.r) - d[0]) > 1 || Math.abs(b255(mine.g) - d[1]) > 1 || Math.abs(b255(mine.b) - d[2]) > 1) return "mismatch " + samples[i] + " " + toHex(mine) + " vs " + Array.from(d).join(",");
    }
    return true;
  };
})();
