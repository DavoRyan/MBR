// NEMI BI v8.0 - buildAll + Tabs 1-2
function buildAll(){
  var rev={2025:{YTD:0,Q1:0,Q2:0,Q3:0,Q4:0,m:[0,0,0,0,0,0,0,0,0,0,0,0]},2026:{YTD:0,Q1:0,Q2:0,Q3:0,Q4:0,m:[0,0,0,0,0,0,0,0,0,0,0,0]}};
  var act={2025:{YTD:{},Q1:{},Q2:{},Q3:{},Q4:{}},2026:{YTD:{},Q1:{},Q2:{},Q3:{},Q4:{}}};
  var aYTD={},prodT={},lDates={},firstOrd={},cMap={},aovT={};
  var pGrid={},chns={},grps={};
  var acctYears={};// account -> {2025:rev, 2026:rev}
  var newAcctChan={};// channel -> month -> count
  var chanAccts={};// channel -> account -> {first,last}
  skuData={};// account -> sku -> {rev,orders,lastDate}

  rawRows.forEach(function(r){
    var y=r.year;
    if(!lDates[r.account]||r.date>lDates[r.account])lDates[r.account]=r.date;
    if(!firstOrd[r.account]||r.date<firstOrd[r.account])firstOrd[r.account]=r.date;
    // SKU data for Tab 4
    if(!skuData[r.account])skuData[r.account]={};
    if(!skuData[r.account][r.sku])skuData[r.account][r.sku]={rev:0,orders:{},last:null};
    skuData[r.account][r.sku].rev+=r.revenue;
    skuData[r.account][r.sku].orders[r.orderId]=1;
    if(!skuData[r.account][r.sku].last||r.date>skuData[r.account][r.sku].last)skuData[r.account][r.sku].last=r.date;
    // Per-account year totals for growth accounting
    if(!acctYears[r.account])acctYears[r.account]={2025:0,2026:0};
    if((y===2025||y===2026)&&r.ytd)acctYears[r.account][y]+=r.revenue;
    // Channel longevity
    if(y===2026){
      if(!chanAccts[r.channel])chanAccts[r.channel]={};
      if(!chanAccts[r.channel][r.account])chanAccts[r.channel][r.account]={first:r.date,last:r.date};
      if(r.date<chanAccts[r.channel][r.account].first)chanAccts[r.channel][r.account].first=r.date;
      if(r.date>chanAccts[r.channel][r.account].last)chanAccts[r.channel][r.account].last=r.date;
    }
    if(y===2025||y===2026){
      rev[y][r.q]+=r.revenue;rev[y].m[r.month]+=r.revenue;
      act[y][r.q][r.account]=1;
      if(r.ytd){rev[y].YTD+=r.revenue;act[y].YTD[r.account]=1}
      if(!prodT[r.prod])prodT[r.prod]={2025:{Q1:0,Q2:0,Q3:0,Q4:0,YTD:0},2026:{Q1:0,Q2:0,Q3:0,Q4:0,YTD:0}};
      prodT[r.prod][y][r.q]+=r.revenue;
      if(r.ytd)prodT[r.prod][y].YTD+=r.revenue;
    }
    if(y===2026){
      if(r.ytd)aYTD[r.account]=(aYTD[r.account]||0)+r.revenue;
      if(r.ytd){if(!cMap[r.channel])cMap[r.channel]={};cMap[r.channel][r.account]=(cMap[r.channel][r.account]||0)+r.revenue}
      if(!aovT[r.channel])aovT[r.channel]={mR:[0,0,0,0,0,0,0,0,0,0,0,0],mO:[{},{},{},{},{},{},{},{},{},{},{},{}]};
      aovT[r.channel].mR[r.month]+=r.revenue;aovT[r.channel].mO[r.month][r.orderId]=1;
    }
    if(!pGrid[r.account])pGrid[r.account]={c:r.channel,g:r.group,m26:[0,0,0,0,0,0,0,0,0,0,0,0],m25:[0,0,0,0,0,0,0,0,0,0,0,0],y26:0,y25:0};
    if(y===2026){chns[r.channel]=1;grps[r.group]=1;pGrid[r.account].m26[r.month]+=r.revenue;if(r.ytd)pGrid[r.account].y26+=r.revenue}
    else if(y===2025){pGrid[r.account].m25[r.month]+=r.revenue;if(r.ytd)pGrid[r.account].y25+=r.revenue}
  });

  // ---- GROWTH ACCOUNTING ----
  var retainedRev26=0,retainedRev25=0,newBizRev=0;
  for(var a in acctYears){
    if(acctYears[a][2025]>0&&acctYears[a][2026]>0){retainedRev26+=acctYears[a][2026];retainedRev25+=acctYears[a][2025]}
    else if(acctYears[a][2025]===0&&acctYears[a][2026]>0){
      // Check if first-ever order is in 2026
      if(firstOrd[a]&&firstOrd[a].getFullYear()>=2026)newBizRev+=acctYears[a][2026];
    }
  }
  var organicGrowth=retainedRev26-retainedRev25;
  var gcH="";
  function gCard(t,v,cls){return'<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-t-4 border-t-'+cls+'"><p class="text-[10px] font-heading text-slate-500 uppercase tracking-wide mb-2">'+t+'</p><p class="text-2xl font-heading text-nemi-blue">'+fmt(v)+'</p></div>'}
  $("growth-cards").innerHTML=gCard("Retained Base Revenue",retainedRev26,"nemi-blue")+gCard("Organic Growth (YoY)",organicGrowth,"accent")+gCard("New Business Revenue",newBizRev,"status");
  var gtb="";
  function gRow(label,v26,v25){return"<tr><td class='px-4 py-2 font-heading text-nemi-blue'>"+label+"</td><td class='px-4 py-2 text-right'>"+fmt(v26)+"</td><td class='px-4 py-2 text-right text-slate-500'>"+fmt(v25)+"</td>"+yoyTd(v26,v25)+"</tr>"}
  gtb+=gRow("Retained Base Revenue",retainedRev26,retainedRev25);
  gtb+=gRow("Organic Growth",organicGrowth,0);
  gtb+=gRow("New Business Revenue",newBizRev,0);
  gtb+=gRow("Total YTD Revenue",rev[2026].YTD,rev[2025].YTD);
  $("growth-table-body").innerHTML=gtb;

  // ---- STANDARD MATRIX ----
  function mCard(t,v26,v25,isM){var yH;if(v25===0&&v26===0)yH="<span class='text-slate-400'>0.0%</span>";else if(v25===0)yH="<span class='text-success font-bold'>+100%</span>";else{var p=((v26-v25)/v25)*100;yH=p>0?"<span class='text-success font-bold'>+"+p.toFixed(1)+"%</span>":"<span class='text-danger font-bold'>"+p.toFixed(1)+"%</span>"}return'<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 border-t-4 border-t-nemi-blue"><p class="text-[10px] font-heading text-slate-500 uppercase tracking-wide mb-2">'+t+'</p><div class="flex items-end justify-between"><div class="flex items-baseline gap-2"><p class="text-lg font-heading text-nemi-blue">'+(isM?fmt(v26):v26.toLocaleString())+'</p><p class="text-[10px] text-slate-400">vs '+(isM?fmt(v25):v25.toLocaleString())+'</p></div><div class="text-xs">'+yH+'</div></div></div>'}
  var ord=["YTD","Q1","Q2","Q3","Q4"],rm="",am="";
  ord.forEach(function(k){rm+=mCard(k+" Rev",rev[2026][k],rev[2025][k],true);am+=mCard(k+" Unique",Object.keys(act[2026][k]).length,Object.keys(act[2025][k]).length,false)});
  $("matrix-revenue").innerHTML=rm;$("matrix-accounts").innerHTML=am;

  // ---- MONTHLY COMPARISON ----
  var moH="";for(var i=0;i<12;i++)moH+="<tr><td class='px-4 py-2 font-heading text-nemi-blue'>"+MN[i]+"</td><td class='px-4 py-2 text-right bg-slate-50'>"+fmt(rev[2026].m[i])+"</td><td class='px-4 py-2 text-right'>"+fmt(rev[2025].m[i])+"</td>"+yoyTd(rev[2026].m[i],rev[2025].m[i])+"</tr>";
  $("month-compare-body").innerHTML=moH;

  // ---- CONCENTRATION RISK ----
  rankCache=Object.keys(aYTD).map(function(k){return{n:k,v:aYTD[k]}}).sort(function(a,b){return b.v-a.v});
  var s20=0,s50=0,s100=0,tY=rev[2026].YTD;
  for(var i=0;i<rankCache.length;i++){var v=rankCache[i].v;if(i<20)s20+=v;if(i<50)s50+=v;if(i<100)s100+=v}
  function cg(t,s,n){var p=tY>0?((s/tY)*100).toFixed(1):"0";return"<div class='cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-center flex flex-col justify-center' onclick='showTopN(\""+t+"\","+n+")'><p class='text-xs font-heading text-slate-500 mb-1'>"+t+"</p><p class='text-2xl font-heading text-accent'>"+p+"%</p></div>"}
  $("concentration-gauges").innerHTML=cg("Top 20",s20,20)+cg("Top 50",s50,50)+cg("Top 100",s100,100);

  // ---- PRODUCT TRENDS ----
  var ptH="";Object.keys(prodT).sort().forEach(function(pk){var o=prodT[pk];ptH+="<tr><td class='px-3 py-2 font-heading text-nemi-blue border-r border-slate-200 bg-slate-50'>"+pk+"</td>";
  ["Q1","Q2","Q3","Q4","YTD"].forEach(function(q,idx){var bg=idx%2===0?"bg-slate-100":"";ptH+="<td class='px-2 py-2 text-right "+bg+" border-l border-slate-200'>"+fmt(o[2026][q])+"</td><td class='px-2 py-2 text-right "+bg+"'>"+fmt(o[2025][q])+"</td>"+yoyTd(o[2026][q],o[2025][q])});
  ptH+="</tr>"});$("prod-trends-body").innerHTML=ptH;

  // ==== TAB 2 ====
  // New Account Acquisition by Channel x Month
  var newAcctByYr={};// find accounts with first order in 2026
  for(var a in firstOrd){if(firstOrd[a].getFullYear()===2026){var m=firstOrd[a].getMonth();var ch="Unknown";rawRows.some(function(r){if(r.account===a){ch=r.channel;return true}});if(!newAcctByYr[ch])newAcctByYr[ch]=[0,0,0,0,0,0,0,0,0,0,0,0];newAcctByYr[ch][m]++}}
  var nTh="<th class='px-3 py-2'>Channel</th>";for(var i=0;i<12;i++)nTh+="<th class='px-2 py-2 text-right'>"+MN[i]+"</th>";nTh+="<th class='px-3 py-2 text-right bg-slate-100'>Total</th>";
  $("nacq-th").innerHTML=nTh;
  var nBd="";Object.keys(newAcctByYr).sort().forEach(function(ch){nBd+="<tr><td class='px-3 py-2 font-heading text-nemi-blue bg-slate-50 border-r border-slate-100'>"+ch+"</td>";var tot=0;for(var m=0;m<12;m++){var v=newAcctByYr[ch][m];tot+=v;nBd+="<td class='px-2 py-2 text-right'>"+(v||"-")+"</td>"}nBd+="<td class='px-3 py-2 text-right font-heading bg-slate-100 text-nemi-blue'>"+tot+"</td></tr>"});
  $("nacq-body").innerHTML=nBd||"<tr><td colspan='14' class='px-4 py-4 text-center text-slate-400'>No new accounts found.</td></tr>";

  // Account Longevity
  var lgH="";Object.keys(chanAccts).sort().forEach(function(ch){var accts=chanAccts[ch];var keys=Object.keys(accts);var totalDays=0;keys.forEach(function(a){totalDays+=Math.max(0,Math.floor((accts[a].last-accts[a].first)/86400000))});var avg=keys.length?Math.round(totalDays/keys.length):0;lgH+="<tr><td class='px-4 py-2 font-heading text-nemi-blue'>"+ch+"</td><td class='px-4 py-2 text-right'>"+keys.length+"</td><td class='px-4 py-2 text-right font-heading text-accent'>"+avg+"</td></tr>"});
  $("longevity-body").innerHTML=lgH;

  // AOV
  var aHth="<th class='px-3 py-2'>Channel</th>";for(var i=0;i<12;i++)aHth+="<th class='px-2 py-2 text-right'>"+MN[i]+"</th>";aHth+="<th class='px-3 py-2 text-right bg-slate-100'>YTD</th>";
  $("aov-th-row").innerHTML=aHth;
  var aH="";Object.keys(aovT).sort().forEach(function(ch){aH+="<tr><td class='px-3 py-2 font-heading text-nemi-blue bg-slate-50 border-r border-slate-100'>"+ch+"</td>";var tR=0,tO=0;for(var m=0;m<12;m++){var r=aovT[ch].mR[m],oc=Object.keys(aovT[ch].mO[m]).length;tR+=r;tO+=oc;var av=oc>0?r/oc:0;aH+="<td class='px-2 py-2 text-right text-slate-500'>"+(av>0?fmt(av):"-")+"</td>"}var ytdAov=tO>0?fmt(tR/tO):"-";aH+="<td class='px-3 py-2 text-right font-heading bg-slate-100 text-nemi-blue'>"+ytdAov+"</td></tr>"});
  $("aov-table-body").innerHTML=aH;

  // Retention Buckets
  retMap={atRisk:[],dormant:[],churn:[],lost:[]};
  for(var a in lDates){var d=Math.floor((CURRENT_DATE-lDates[a])/86400000);var o={n:a,date:lDates[a],v:aYTD[a]||0};if(d>=30&&d<60)retMap.atRisk.push(o);else if(d>=60&&d<90)retMap.dormant.push(o);else if(d>=90&&d<180)retMap.churn.push(o);else if(d>=180)retMap.lost.push(o)}
  $("ret-atRisk").textContent=retMap.atRisk.length;$("ret-dormant").textContent=retMap.dormant.length;$("ret-churn").textContent=retMap.churn.length;$("ret-lost").textContent=retMap.lost.length;

  // Build tabs 3-5
  buildTab3();buildTab4Select();buildTab5(chns,grps,pGrid);
}

function showTopN(title,n){
  var h="<table class='w-full text-sm text-left whitespace-nowrap'><thead class='text-xs text-slate-400 uppercase font-heading border-b border-slate-100'><tr><th class='pb-2 w-12 text-center'>Rank</th><th class='pb-2'>Account</th><th class='pb-2 text-right'>YTD Rev £</th></tr></thead><tbody class='divide-y divide-slate-100'>";
  for(var i=0;i<Math.min(n,rankCache.length);i++){var o=rankCache[i];h+="<tr><td class='px-2 py-2 text-center text-slate-400'>"+(i+1)+"</td><td class='px-2 py-2 font-heading text-nemi-blue'>"+o.n+"</td><td class='px-2 py-2 text-right font-heading text-status'>"+fmt(o.v)+"</td></tr>"}
  h+="</tbody></table>";openModal(title,h);
}
function showRetentionList(cat){
  var m={atRisk:"At Risk",dormant:"Dormant",churn:"Churn Risk",lost:"Lost"};$("retention-list-title").textContent=m[cat]+" Accounts";
  var arr=retMap[cat]||[];var h="";
  if(arr.length){arr.sort(function(a,b){return b.v-a.v}).forEach(function(o){h+="<tr><td class='py-1.5 font-heading text-nemi-blue'>"+o.n+"</td><td class='py-1.5 text-center text-slate-500'>"+dStr(o.date)+"</td><td class='py-1.5 text-right font-heading "+(o.v>0?"text-status":"text-slate-400")+"'>"+fmt(o.v)+"</td></tr>"})}
  else h="<tr><td colspan='3' class='py-3 text-center text-slate-400'>None</td></tr>";
  $("retention-list-tbody").innerHTML=h;$("retention-list-box").classList.remove("hidden");
}
