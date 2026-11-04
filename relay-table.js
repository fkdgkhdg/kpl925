
/* relay judge table v1 */
(function(){
  var css = [
    "#relayCard .rlytblwrap{margin-top:4px;overflow-x:auto}",
    "#relayCard .rlytbl{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px}",
    "#relayCard .rlytbl th{padding:2px 4px;border-bottom:1px solid var(--border);color:var(--muted);font-size:10px;font-weight:700;text-align:left;white-space:nowrap;background:transparent}",
    "#relayCard .rlytbl td{padding:3px 4px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.35;white-space:normal;word-break:break-word}",
    "#relayCard .rlytbl th:nth-child(1),#relayCard .rlytbl td:nth-child(1){width:25%}",
    "#relayCard .rlytbl th:nth-child(2),#relayCard .rlytbl td:nth-child(2){width:13%;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}",
    "#relayCard .rlytbl th:nth-child(3),#relayCard .rlytbl td:nth-child(3){width:29%}",
    "#relayCard .rlytbl th:nth-child(4),#relayCard .rlytbl td:nth-child(4){width:33%}",
    "#relayCard .rlytbl .rk .bd{font-weight:800;color:#c02c2c;margin-right:2px}",
    "#relayCard .rlytbl .rk .stk{font-weight:700}",
    "#relayCard .rlytbl .rk .kbtn{margin-left:2px;padding:0 3px;font-size:9.5px}",
    "#relayCard .rlytbl .rk .rlyyi{font-size:9px;color:#e07a1f;border:1px solid rgba(224,122,31,.5);border-radius:3px;padding:0 2px;margin-left:2px}",
    "#relayCard .rlytbl .rth{margin-top:1px;font-size:10px;color:var(--muted);line-height:1.2}",
    "#relayCard .rlytbl .rj.bad{color:#c02c2c;font-weight:700}",
    "#relayCard .rlytbl .rj.warn{color:#e07a1f;font-weight:700}",
    "#relayCard .rlytbl .rj.ok{color:#1f7a3d;font-weight:700}",
    "#relayCard .rlytbl .ra{color:var(--fg)}",
    "#relayCard .rlytbl .fineprint{font-size:10px;color:var(--muted);margin-top:2px}",
    "#relayCard .rlyaq{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:-1px 0 5px;font-size:10.5px;line-height:1.25}",
    "#relayCard .rlyaq .rlyalab{color:var(--muted);font-weight:700;flex:none}",
    "#relayCard .rlyaq .rlyov{color:var(--muted);border:1px solid var(--border);border-radius:4px;padding:1px 4px;background:rgba(127,127,127,.06)}",
    "#relayCard .rlyaq .rlyaqchip{border:1px solid var(--border);border-radius:4px;padding:1px 4px;text-decoration:none;font-weight:700;background:rgba(127,127,127,.04)}",
    "#relayCard .rlyaq .rlyaqchip small{font-size:9.5px;color:var(--muted);font-weight:500;margin-left:2px}",
    "@media(max-width:520px){#relayCard .rlytbl{font-size:10.5px}#relayCard .rlytbl th,#relayCard .rlytbl td{padding:2px 3px}#relayCard .rlytbl th:nth-child(1),#relayCard .rlytbl td:nth-child(1){width:27%}#relayCard .rlytbl th:nth-child(2),#relayCard .rlytbl td:nth-child(2){width:14%}#relayCard .rlytbl th:nth-child(3),#relayCard .rlytbl td:nth-child(3){width:28%}#relayCard .rlytbl th:nth-child(4),#relayCard .rlytbl td:nth-child(4){width:31%}}"
  ].join("");
  if(!document.getElementById("relayTblCss")){
    var st=document.createElement("style"); st.id="relayTblCss"; st.textContent=css; document.head.appendChild(st);
  }
  function E(tag, cls, txt){
    var e=document.createElement(tag);
    if(cls) e.className=cls;
    if(txt!==null && txt!==undefined) e.textContent=txt;
    return e;
  }
  function cleanTheme(s){ return String(s||"").replace(/\s+\d+只$/,"").trim(); }
  function themeParts(e){
    var primary=cleanTheme(e?e.textContent:"");
    var dir=String((e&&e.getAttribute("data-dir"))||"").trim();
    var group=dir||primary;
    return {primary:primary, group:group, label:dir?(primary&&primary!==dir?dir+"（"+primary+"）":dir):primary};
  }
  function themeCount(s){ var m=String(s||"").match(/([0-9]+)只/); return m?+m[1]:1; }
  function mainMatch(theme, arr){
    if(!theme) return "";
    for(var i=0;i<arr.length;i++){
      var m=arr[i];
      if(m===theme || m.indexOf(theme)>=0 || theme.indexOf(m)>=0) return m;
    }
    return "";
  }
  function judge(board, chg, n, main, isYi, auctionMode){
    if(!auctionMode) return ["待9:25竞价","9:25后再判","wait"];
    if(isNaN(chg)) return ["竞价未出","等数据","wait"];
    if(isYi) return ["一字板","买不到，开板再看","bad"];
    if(board>=4){
      if(chg<3) return [chg===0?"高位+零溢价"+(main?"":"+非主线"):"高位+弱竞价"+(main?"":"+非主线"),"直接淘汰；持仓反抽卖，不补","bad"];
      if(chg<7) return ["高位分歧"+(main?"·主线":"·非主线"),"只做秒板确认，不板就走","warn"];
      return ["高开加速，追高风险","不追；等回封，不回封放弃","warn"];
    }
    if(board===3){
      if(chg<2) return ["3板弱竞价","观察，不买","bad"];
      if(chg>=7) return ["高开过多，兑现压力","不追；等回封，不回封放弃","warn"];
      if(n>=2) return ["3板+同题材"+n+"只"+(main?"·主线":""),"只做最强，等开盘确认","ok"];
      return [main?"3板+主线，可试错":"3板题材孤立",main?"等开盘确认，强则做":"只做秒板，不板放弃",main?"ok":"warn"];
    }
    if(board===2){
      if(chg<0) return ["低开淘汰","不买","bad"];
      if(chg<2) return [n>=2?"2板弱竞价（同题材"+n+"只）":"2板弱竞价","只等弱转强，不竞价买","warn"];
      if(n>=2) return ["2板+同题材"+n+"只"+(main?"·主线":""),n===2?"二选一，选开盘更强的":"选最强的，只做一只","ok"];
      if(main) return ["2板+主线","优先，等开盘确认","ok"];
      return ["2板题材孤立","只做确认，不追","warn"];
    }
    return ["—","—","wait"];
  }

  function paintTable(){
    var card=document.getElementById("relayCard"); if(!card) return;
    var grid=card.querySelector(".rlygrid"); if(!grid) return;
    var cands=[].slice.call(grid.querySelectorAll(".rlycand")); if(!cands.length) return;
    var mainThemes=[].slice.call(card.querySelectorAll(".rlytheme .thlink")).map(function(a){ return cleanTheme(a.textContent); }).filter(Boolean);
    var themeSeen={}, themeFirst={};
    cands.forEach(function(c){
      var e=c.querySelector(".th");
      var t=themeParts(e).group;
      if(t) themeSeen[t]=(themeSeen[t]||0)+1;
    });
    var d0="";
    try{ d0=(STATE.cyc&&STATE.cyc.day)?STATE.cyc.day:""; }catch(e){}
    if(!d0){ var lb=card.querySelector(".lb"); var mm=lb?lb.textContent:""; var dm=mm.match(/(\d{4}-\d{2}-\d{2})\s*收盘/); if(dm) d0=dm[1]; }
    var auctionMode=true;
    try{ auctionMode=(STATE.cyc&&STATE.cyc.day)!==STATE.day; }catch(e){}
    if(auctionMode && cands.every(function(c){ var e=c.querySelector(".ch"); return e && e.textContent.trim()==="待竞价"; })) auctionMode=false;
    var wrap=E("div","rlytblwrap");
    var table=E("table","rlytbl");
    var thead=E("thead"); var trh=E("tr");
    ["股票","竞价","判断","动作"].forEach(function(t){ trh.appendChild(E("th",null,t)); });
    thead.appendChild(trh); table.appendChild(thead);
    var tbody=E("tbody");
    cands.forEach(function(c){
      var bd=c.querySelector(".bd"); var board=parseInt((bd?bd.textContent:""),10)||0;
      var nEl=c.querySelector(".stk"); var name=nEl?nEl.textContent:"";
      var thEl=c.querySelector(".th"); var thRaw=thEl?thEl.textContent:""; var tp=themeParts(thEl); var primary=tp.primary; var theme=tp.group; var n=themeSeen[theme]||1;
      var chEl=c.querySelector(".ch"); var chTxt=chEl?chEl.textContent.trim():"";
      var chg=parseFloat(chTxt.replace("%","").replace("+","")); if(chTxt==="—" || chTxt==="待竞价") chg=NaN;
      var isYi=!!c.querySelector(".rlyyi");
      var main=mainMatch(theme,mainThemes);
      var firstOfTheme=!themeFirst[theme]; if(firstOfTheme) themeFirst[theme]=true;
      var j=judge(board,chg,n,!!main,isYi,auctionMode);
      if(board===2 && n>=2 && !isYi && chg>=2) j[1]=firstOfTheme?(n===2?"二选一，选开盘更强的":"同题材"+n+"只，选最强的"):(n===2?"备选，不双买":"备选，不追多");
      var kb=c.querySelector(".kbtn");
      var code=kb?kb.getAttribute("data-kc"):"";
      var tr=E("tr");
      var td1=E("td","rk");
      td1.appendChild(E("span","bd",board+"板"));
      td1.appendChild(document.createTextNode(" "));
      var a=E("a","stk",name); a.href="https://stockpage.10jqka.com.cn/"+code+"/"; a.target="_blank"; a.rel="noopener"; td1.appendChild(a);
      if(kb) td1.appendChild(kb.cloneNode(true));
      if(isYi) td1.appendChild(E("span","rlyyi","一字"));
      var div=E("div","rth");
      var mainLabel=main ? ((main===theme||main===primary)?" · 主线":"（"+main+"主线）") : (theme?" · 非主线":"");
      var tl=E("a","thlink",(tp.label||"—")+(n>1?" "+n+"只候选":"")+mainLabel);
      tl.setAttribute("data-th",primary||theme); tl.setAttribute("data-ztd",d0.replace(/-/g,""));
      div.appendChild(tl); td1.appendChild(div);
      tr.appendChild(td1);
      var chgCol=auctionMode && !isNaN(chg) ? (chg>0?"#c02c2c":(chg<0?"#1f7a3d":"var(--muted)")) : "var(--muted)";
      var td2=E("td","rc",chTxt||"—"); td2.style.color=chgCol; tr.appendChild(td2);
      tr.appendChild(E("td","rj "+j[2],j[0]));
      tr.appendChild(E("td","ra",j[1]));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrap.appendChild(table);
    grid.parentNode.replaceChild(wrap,grid);
  }
  var paintQueued=false;
  function queuePaint(){
    if(paintQueued) return; paintQueued=true;
    setTimeout(function(){ paintQueued=false; try{ paintTable(); }catch(e){} },0);
  }
  try{
    new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        var m=muts[i];
        if(m.type==="childList" && (m.addedNodes.length || m.removedNodes.length)){
          var card=document.getElementById("relayCard");
          if(card && card.querySelector(".rlygrid")){ queuePaint(); return; }
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
  var oldPaint=window.paintRelay;
  window.paintRelay=function(){
    try{ if(oldPaint) oldPaint.apply(this,arguments); }catch(e){}
    try{ paintTable(); }catch(e){}
  };
  setTimeout(function(){try{paintTable();}catch(e){}},100);
  setTimeout(function(){try{paintTable();}catch(e){}},1200);
})();
