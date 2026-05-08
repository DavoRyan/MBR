// NEMI BI v8.0 - Tabs 3, 4, 5

// ==== TAB 3: P&L ANALYSIS ====
function buildTab3(){
  var plData={};// plClass -> {newA:{},repA:{},orders:{},rev:0,mRev:[12]}
  var classFirst={};// plClass -> account -> firstDate
  rawRows.forEach(function(r){
    if(!classFirst[r.plClass])classFirst[r.plClass]={};
    if(!classFirst[r.plClass][r.account]||r.date<classFirst[r.plClass][r.account])classFirst[r.plClass][r.account]=r.date;
    if(r.year===2026){
      if(!plData[r.plClass])plData[r.plClass]={newA:{},repA:{},orders:{},rev:0,mRev:[0,0,0,0,0,0,0,0,0,0,0,0],accts:{}};
      plData[r.plClass].rev+=r.revenue;
      plData[r.plClass].mRev[r.month]+=r.revenue;
      plData[r.plClass].orders[r.orderId]=1;
      plData[r.plClass].accts[r.account]=1;
    }
  });
  // Classify new vs repeat per class
  for(var pc in plData){
    var accts=Object.keys(plData[pc].accts);
    accts.forEach(function(a){
      var fd=classFirst[pc]&&classFirst[pc][a];
      if(fd&&fd.getFullYear()>=2026)plData[pc].newA[a]=1;
      else plData[pc].repA[a]=1;
    });
  }
  var h="";
  Object.keys(plData).sort().forEach(function(pc){
    var d=plData[pc];
    var nA=Object.keys(d.newA).length,rA=Object.keys(d.repA).length,tA=Object.keys(d.accts).length,tO=Object.keys(d.orders).length;
    // Avg monthly sales: total rev / months with activity
    var activeMo=0;d.mRev.forEach(function(v){if(v>0)activeMo++});
    var avgM=activeMo>0?d.rev/activeMo:0;
    h+="<div class='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>";
    h+="<div class='bg-nemi-blue-dark text-white px-5 py-3 font-heading tracking-wider text-sm flex justify-between items-center'>"+pc+"<span class='text-accent text-xs font-heading'>"+fmt(d.rev)+"</span></div>";
    h+="<div class='p-4 grid grid-cols-2 md:grid-cols-5 gap-3'>";
    h+="<div class='text-center'><p class='text-[10px] font-heading text-slate-400 uppercase'>New Accounts</p><p class='text-xl font-heading text-success'>"+nA+"</p></div>";
    h+="<div class='text-center'><p class='text-[10px] font-heading text-slate-400 uppercase'>Repeat Accounts</p><p class='text-xl font-heading text-nemi-blue'>"+rA+"</p></div>";
    h+="<div class='text-center'><p class='text-[10px] font-heading text-slate-400 uppercase'>Total Accounts</p><p class='text-xl font-heading text-nemi-blue'>"+tA+"</p></div>";
    h+="<div class='text-center'><p class='text-[10px] font-heading text-slate-400 uppercase'>Total Orders</p><p class='text-xl font-heading text-slate-600'>"+tO+"</p></div>";
    h+="<div class='text-center'><p class='text-[10px] font-heading text-slate-400 uppercase'>Avg Monthly Sales</p><p class='text-xl font-heading text-accent'>"+fmt(avgM)+"</p></div>";
    h+="</div>";
    // Monthly breakdown row
    h+="<div class='px-4 pb-3 overflow-x-auto'><table class='w-full text-xs whitespace-nowrap'><thead class='font-heading uppercase text-slate-400 border-b border-slate-200'><tr><th class='pb-1 text-left'>Month</th>";
    for(var m=0;m<12;m++)h+="<th class='pb-1 text-right'>"+MN[m]+"</th>";
    h+="</tr></thead><tbody><tr><td class='py-1 font-heading text-status'>Revenue</td>";
    for(var m=0;m<12;m++)h+="<td class='py-1 text-right'>"+(d.mRev[m]>0?fmt(d.mRev[m]):"-")+"</td>";
    h+="</tr></tbody></table></div></div>";
  });
  $("pl-container").innerHTML=h||"<p class='text-slate-400 text-center py-10'>No P&L data found.</p>";
}

// ==== TAB 4: CUSTOMER SKU REVIEW ====
function buildTab4Select(){
  var sel=$("sku-account-select");
  sel.innerHTML="<option value=''>— Choose an account —</option>";
  var accts=Object.keys(skuData).sort();
  accts.forEach(function(a){sel.innerHTML+="<option value=\""+a.replace(/"/g,"&quot;")+"\">"+a+"</option>"});
}
function renderSKUReview(){
  var acct=$("sku-account-select").value;
  if(!acct||!skuData[acct]){$("sku-result").innerHTML="<p class='text-slate-400 text-center py-10'>Select an account above to view their SKU history.</p>";return}
  var skus=skuData[acct];
  var list=Object.keys(skus).map(function(s){return{sku:s,rev:skus[s].rev,orders:Object.keys(skus[s].orders).length,last:skus[s].last}}).sort(function(a,b){return b.rev-a.rev});
  var h="<h3 class='font-heading text-nemi-blue text-base mb-3'>"+acct+" — SKU History ("+list.length+" products)</h3>";
  h+="<div class='overflow-x-auto border border-slate-100 rounded-lg'><table class='w-full text-sm text-left whitespace-nowrap sticky-header'>";
  h+="<thead class='text-[10px] text-slate-500 uppercase font-heading bg-slate-50 border-b border-slate-200'><tr><th class='px-4 py-2'>SKU / Product</th><th class='px-4 py-2 text-right'>Total Revenue</th><th class='px-4 py-2 text-right'>Orders</th><th class='px-4 py-2 text-right'>Last Order Date</th></tr></thead>";
  h+="<tbody class='divide-y divide-slate-100'>";
  if(list.length){
    list.forEach(function(s){h+="<tr><td class='px-4 py-2 font-heading text-nemi-blue'>"+s.sku+"</td><td class='px-4 py-2 text-right font-heading text-status'>"+fmt(s.rev)+"</td><td class='px-4 py-2 text-right'>"+s.orders+"</td><td class='px-4 py-2 text-right text-slate-500'>"+dStr(s.last)+"</td></tr>"});
  } else {h+="<tr><td colspan='4' class='px-4 py-4 text-center text-slate-400'>No SKU data.</td></tr>"}
  h+="</tbody></table></div>";
  $("sku-result").innerHTML=h;
}

// ==== TAB 5: PIVOT ====
function buildTab5(chns,grps,pGrid){
  var sc=$("pivot-channel"),sg=$("pivot-group");
  sc.innerHTML="<option value='__ALL__'>All Channels</option>";
  sg.innerHTML="<option value='__ALL__'>All Groups</option>";
  Object.keys(chns).sort().forEach(function(k){sc.innerHTML+="<option value=\""+k+"\">"+k+"</option>"});
  Object.keys(grps).sort().forEach(function(k){sg.innerHTML+="<option value=\""+k+"\">"+k+"</option>"});
  pivotCache=Object.keys(pGrid).map(function(k){return{n:k,c:pGrid[k].c,g:pGrid[k].g,m26:pGrid[k].m26,m25:pGrid[k].m25,y26:pGrid[k].y26,y25:pGrid[k].y25}}).sort(function(a,b){return b.y26-a.y26});
  renderPivot();
}
function togglePivotYear(){pivotYear=parseInt($("pivot-year-select").value);$("pivot-title-text").textContent="Master Pivot Table ("+pivotYear+")";renderPivot()}
function renderPivot(){
  var c=$("pivot-channel").value,g=$("pivot-group").value,s=$("pivot-search").value.toLowerCase();
  var h="",cnt=0;
  pivotCache.forEach(function(p){
    if(c!=="__ALL__"&&p.c!==c)return;if(g!=="__ALL__"&&p.g!==g)return;
    if(s&&p.n.toLowerCase().indexOf(s)===-1)return;
    cnt++;
    var mV=pivotYear===2026?p.m26:p.m25;
    var ytd=pivotYear===2026?p.y26:p.y25;
    var ly=pivotYear===2026?p.y25:p.y26;
    h+="<tr><td class='px-3 py-2 font-heading text-nemi-blue'>"+p.n+"</td><td class='px-2 py-2 text-slate-500'>"+p.c+"</td><td class='px-2 py-2 text-slate-500'>"+p.g+"</td>";
    for(var i=0;i<12;i++)h+="<td class='px-2 py-2 text-right text-slate-400'>"+(mV[i]>0?fmt(mV[i]):"-")+"</td>";
    h+="<td class='px-3 py-2 text-right bg-slate-200 font-heading text-nemi-blue'>"+fmt(ytd)+"</td><td class='px-3 py-2 text-right bg-white border-l border-slate-300 text-slate-500'>"+fmt(ly)+"</td>"+yoyTd(ytd,ly)+"</tr>";
  });
  if(!cnt)h="<tr><td colspan='18' class='px-4 py-6 text-center text-slate-400'>No accounts match filters.</td></tr>";
  $("pivot-body").innerHTML=h;
}
