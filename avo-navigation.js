/* AVO navigation and language bridge (01). No math or renderer modifications. */
(()=>{
  'use strict';
  const VALID=new Set(['ru','en','he']);
  const KEY='avo-site-language';
  const OLD_HOME_KEY='avo-home-lang';
  const names={ru:'На главную',en:'Home',he:'לדף הראשי'};
  const store=(lang)=>{
    if(!VALID.has(lang))return;
    try{localStorage.setItem(KEY,lang);localStorage.setItem(OLD_HOME_KEY,lang);}catch(_){/* storage optional */}
  };
  const stored=()=>{
    try{const x=localStorage.getItem(KEY)||localStorage.getItem(OLD_HOME_KEY);return VALID.has(x)?x:null;}catch(_){return null;}
  };
  let fromQuery=null;
  try{const x=new URLSearchParams(location.search).get('lang');if(VALID.has(x))fromQuery=x;}catch(_){}
  const preferred=fromQuery||stored()||(/^he/i.test(navigator.language)?'he':/^en/i.test(navigator.language)?'en':'ru');
  const isHome=!!document.querySelector('a.launch[href]') && !document.querySelector('.app-version');
  let current=preferred;
  const mark=lang=>{if(VALID.has(lang)){current=lang;store(lang);}};
  // Delegation works even if core creates flag buttons dynamically.
  document.addEventListener('click',ev=>{
    const btn=ev.target.closest?.('[data-lang]');
    if(btn && VALID.has(btn.dataset.lang)){
      mark(btn.dataset.lang);
      if(isHome)updateLaunches();
      else updateHomeButton();
      try {const u=new URL(location.href);if(u.searchParams.has('lang')){u.searchParams.set('lang',current);history.replaceState(history.state,'',u.href);}}catch(_){}
    }
  },true);
  function updateLaunches(){
    document.querySelectorAll('a.launch[href]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),document.baseURI);
      url.searchParams.set('lang',current);
      link.href=url.href;
    });
  }
  let homeButton;
  function updateHomeButton(){
    if(!homeButton)return;
    homeButton.textContent='⌂ '+names[current];
    homeButton.setAttribute('aria-label',names[current]);
    const url=new URL('../',document.baseURI);
    url.searchParams.set('lang',current);
    homeButton.href=url.href;
  }
  function createHomeButton(){
    if(isHome)return;
    if(document.querySelector('#avo-return-home'))return;
    const style=document.createElement('style');
    style.textContent='.avo-return-home{display:inline-flex!important;align-items:center;justify-content:center;flex-shrink:0;gap:.25em;padding:7px 10px;margin:2px 4px;background:#fff;color:#174b79!important;border:1px solid #acc3d8;border-radius:8px;font:700 15px system-ui,"Segoe UI",Arial,sans-serif;line-height:1.3;text-decoration:none!important;cursor:pointer;white-space:nowrap}.avo-return-home:hover,.avo-return-home:focus-visible{background:#e9f5ff;outline-offset:2px}@media(max-width:620px){.avo-return-home{font-size:14px;padding:6px 8px}}';
    document.head.append(style);
    homeButton=document.createElement('a');
    homeButton.id='avo-return-home';
    homeButton.className='avo-return-home';
    homeButton.setAttribute('data-avo-navigation','1');
    // Beside the AVO logo, without changing existing buttons.
    const logo=document.querySelector('header .logo, header .header-brand, .top .logo');
    if(logo)logo.insertAdjacentElement('afterend',homeButton);
    else {
      const head=document.querySelector('header, .top-actions, .top');
      if(head)head.insertAdjacentElement('afterbegin',homeButton);
      else document.body.insertAdjacentElement('afterbegin',homeButton);
    }
    homeButton.addEventListener('click',()=>{
      const live=document.documentElement.lang;
      if(VALID.has(live))mark(live);
      updateHomeButton();
    });
    updateHomeButton();
  }
  function applyPreferred(){
    const flag=document.querySelector('[data-lang="'+preferred+'"]');
    if(!flag)return false;
    // Use the application's own public language button; don't alter its math, JSON or translations.
    const live=document.documentElement.lang;
    if(live!==preferred)flag.click();
    mark(preferred);
    return true;
  }
  function init(){
    createHomeButton();
    if(isHome){
      applyPreferred();
      updateLaunches();
    }else{
      // Most applications restore their own saved UI after startup.
      // Wait for window.load so the shared preferred language takes precedence.
      applyPreferred();
      updateHomeButton();
    }
  }
  new MutationObserver(()=>{const live=document.documentElement.lang;if(VALID.has(live)&&live!==current){mark(live);if(isHome)updateLaunches();else updateHomeButton();}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if(document.readyState==='complete')init();
  else window.addEventListener('load',init,{once:true});
})();
