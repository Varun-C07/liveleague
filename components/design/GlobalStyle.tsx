"use client";

import { useTheme } from "@/components/design/theme";

// The prototype's injected <style> — keyframes, fonts, utility classes, media
// queries, scrollbar. Theme-coupled (scrollbar uses t.border). Kept global, as
// the prototype intended; cross-effects on the dormant old routes are benign
// (box-sizing, button transitions, fonts).
export function GlobalStyle() {
  const { t } = useTheme();
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Saira+Condensed:ital,wght@0,600;0,700;0,800;1,700;1,800&family=Inter:wght@400;500;600;700;800&display=swap');
      @keyframes llp{0%{transform:scale(1);opacity:.6}70%{transform:scale(2.8);opacity:0}100%{opacity:0}}
      @keyframes llrise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      @keyframes llscan{0%{transform:translateX(-100%)}100%{transform:translateX(320%)}}
      @keyframes llstripe{to{background-position:28px 0}}
      @keyframes llflash{0%,100%{opacity:1}50%{opacity:.35}}
      @keyframes lltip{from{opacity:0;transform:translate(-50%,4px)}to{opacity:1;transform:translate(-50%,0)}}
      @keyframes llsweep{0%{transform:translateX(-120%)}60%,100%{transform:translateX(420%)}}
      @keyframes lldash{to{stroke-dashoffset:-1000}}
      .disp{font-family:'Saira Condensed',sans-serif;font-style:italic;text-transform:uppercase;letter-spacing:.01em}
      .cond{font-family:'Saira Condensed',sans-serif;letter-spacing:.01em}
      .num{font-variant-numeric:tabular-nums}
      .rise{animation:llrise .5s cubic-bezier(.2,.7,.3,1) both}
      .lift{transition:transform .22s cubic-bezier(.2,.7,.3,1),box-shadow .25s ease}
      .lift:hover{transform:translateY(-3px);box-shadow:0 0 0 1px var(--glow), var(--hovsh)!important}
      .lift:active{transform:translateY(-1px)}
      .navpill:hover{background:var(--surfHi)!important;color:var(--accent)!important}
      .stepbtn:hover{background:var(--surfHi)!important;color:var(--accent)!important}
      .chip-btn{transition:background .16s ease,color .16s ease,box-shadow .2s ease}
      .f1row{transition:background .16s ease}
      .f1row:hover{background:var(--surfHi)}
      .wrap{max-width:1200px;margin:0 auto;padding:0 22px 90px;position:relative;z-index:2}
      .hero{display:grid;grid-template-columns:1.15fr .85fr;gap:30px;align-items:center;padding:34px 0 26px}
      .mgrid{display:grid;grid-template-columns:1fr 326px;gap:22px;align-items:start}
      .rail{position:sticky;top:76px;max-height:calc(100vh - 92px);overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;gap:14px;padding-right:2px;scrollbar-width:thin}
      .rail::-webkit-scrollbar{width:6px}
      .rail::-webkit-scrollbar-thumb{background:var(--surfHi);border-radius:3px}
      .h-hero{font-size:clamp(40px,7.4vw,58px)}
      .h-page{font-size:clamp(34px,6.4vw,50px)}
      .ll-leagues-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(216px,1fr));gap:12px}
      .ll-leagues-acc{display:none}
      .ll-acc-body{max-height:0;overflow:hidden;transition:max-height .28s cubic-bezier(.2,.7,.3,1)}
      .ll-acc-item[data-open="true"] .ll-acc-body{max-height:180px}
      .ll-acc-chev{transition:transform .25s ease}
      .ll-acc-item[data-open="true"] .ll-acc-chev{transform:rotate(180deg)}
      @media(max-width:900px){.mgrid{grid-template-columns:1fr}.rail{position:static;max-height:none;overflow:visible}}
      @media(max-width:860px){.hero{grid-template-columns:1fr;gap:20px;padding:24px 0 16px}}
      @media(max-width:560px){.wrap{padding:0 14px 72px}.ll-leagues-cards{display:none}.ll-leagues-acc{display:flex;flex-direction:column;gap:10px}}
      .lldesign ::-webkit-scrollbar{height:7px;width:7px}
      .lldesign ::-webkit-scrollbar-thumb{background:${t.border};border-radius:4px}
      .lldesign ::-webkit-scrollbar-track{background:transparent}
    `}</style>
  );
}
