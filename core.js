// NEMI BI v8.0 - Core utilities, parsing, file handling
var CURRENT_DATE,CUTOFF_NEW;
var COL_DATE=1,COL_ORDER=3,COL_ACCT=4,COL_SKU=5,COL_PLA=6,COL_SPLIT=7,COL_AMT=8;
var COL_PROD=10,COL_CAT=11,COL_CATER=12,COL_CHAN=13,COL_GRP=14,COL_PLC=15;
var rawRows=[],pivotCache=[],rankCache=[],retMap={},skuData={},pivotYear=2026;
var MN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function $(id){return document.getElementById(id)}
function fmt(n){return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(n)}
function pct(a,b){if(b===0&&a===0)return"0.0%";if(b===0)return"+100%";return(((a-b)/b)*100).toFixed(1)+"%"}
function pctC(a,b){if(b===0&&a===0)return"text-slate-400";if(b===0)return"text-success font-bold";var p=((a-b)/b)*100;return p>0?"text-success font-bold":"text-danger font-bold"}
function yoyTd(a,b){return"<td class='px-2 py-2 text-right "+pctC(a,b)+"'>"+(((a-b)>0&&b>0)?"+":"")+pct(a,b)+"</td>"}
function parseDate(str){
  if(!str)return null;var s=String(str).trim();
  if(s.indexOf("/")!==-1){var p=s.split("/");if(p.length===3)return new Date(+p[2],p[1]-1,+p[0])}
  else if(s.indexOf("-")!==-1){var p=s.split("-");if(p.length===3){if(p[0].length===4)return new Date(+p[0],p[1]-1,+p[2]);else return new Date(+p[2],p[1]-1,+p[0])}}
  var d=new Date(s);return isNaN(d)?null:d;
}
function parseAmt(v){if(typeof v==="number")return v;if(!v)return 0;var s=String(v).replace(/,/g,"").replace(/£/g,"").trim();if(s[0]==="("&&s[s.length-1]===")")s="-"+s.slice(1,-1);var n=parseFloat(s);return isNaN(n)?0:n}
function qtr(d){var m=d.getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4"}
function dStr(d){return d.getDate()+" "+MN[d.getMonth()]+" "+d.getFullYear()}
function switchTab(n){for(var i=1;i<=5;i++){$("tab-btn-"+i).className=i===n?"px-4 py-1.5 rounded font-heading text-[12px] bg-white text-nemi-blue shadow-sm":"px-4 py-1.5 rounded font-heading text-[12px] text-slate-300 hover:text-white transition-colors";$("tab-content-"+i).className="tab-content h-full overflow-y-auto bg-slate-50 p-6 pb-20 "+(i===n?"active":"")}}
function openModal(t,html){$("modal-title").textContent=t;$("modal-inner").innerHTML=html;$("modal-container").classList.remove("hidden");$("modal-container").classList.add("flex")}
function closeModal(){$("modal-container").classList.add("hidden");$("modal-container").classList.remove("flex")}
function resetDashboard(){rawRows=[];pivotCache=[];rankCache=[];$("screen-dashboard").classList.add("hidden");$("screen-dashboard").classList.remove("flex");$("screen-upload").classList.remove("hidden");$("screen-upload").classList.add("flex");$("file-input").value="";$("upload-label").innerHTML='<span class="text-accent font-heading">Click to browse</span> or drag &amp; drop';$("upload-icon-wrap").classList.remove("hidden");$("upload-spinner").classList.add("hidden");$("upload-sublabel").classList.remove("hidden");$("upload-error").classList.add("hidden")}
function handleFileSelect(e){if(e.target.files[0])processFile(e.target.files[0])}
function processFile(file){
  if(!file.name.toLowerCase().endsWith(".csv")){$("upload-error").classList.remove("hidden");$("upload-error").textContent="Please select a .csv file.";return}
  $("upload-icon-wrap").classList.add("hidden");$("upload-spinner").classList.remove("hidden");$("upload-label").textContent="Parsing data...";$("upload-sublabel").classList.add("hidden");$("upload-error").classList.add("hidden");
  setTimeout(function(){
    Papa.parse(file,{header:false,skipEmptyLines:true,complete:function(res){
      var rows=res.data;rawRows=[];var maxD=null;
      for(var i=1;i<rows.length;i++){
        var r=rows[i];if(!r||r.length<16)continue;
        if(String(r[COL_SPLIT]||"").indexOf("NEMI Teas Business Bank")!==-1)continue;
        var rev=parseAmt(r[COL_AMT]);if(rev<0)continue;
        var dt=parseDate(r[COL_DATE]);var acc=String(r[COL_ACCT]||"").trim();
        if(!dt||!acc)continue;
        if(!maxD||dt>maxD)maxD=dt;
        var y=dt.getFullYear(),m=dt.getMonth();
        rawRows.push({date:dt,year:y,month:m,q:qtr(dt),orderId:String(r[COL_ORDER]||"").trim(),account:acc,revenue:rev,
          sku:String(r[COL_SKU]||"").trim()||"Unknown",prod:String(r[COL_PROD]||"").trim()||"Unknown",
          cat:String(r[COL_CAT]||"").trim()||"Unknown",caterer:String(r[COL_CATER]||"").trim()||"Unknown",
          channel:String(r[COL_CHAN]||"").trim()||"Unknown",group:String(r[COL_GRP]||"").trim()||"Unknown",
          plAcct:String(r[COL_PLA]||"").trim()||"Unknown",plClass:String(r[COL_PLC]||"").trim()||"Unknown"});
      }
      if(!rawRows.length){$("upload-icon-wrap").classList.remove("hidden");$("upload-spinner").classList.add("hidden");$("upload-sublabel").classList.remove("hidden");$("upload-label").innerHTML='<span class="text-accent font-heading">Click to browse</span> or drag &amp; drop';$("upload-error").classList.remove("hidden");$("upload-error").textContent="No valid rows found.";return}
      CURRENT_DATE=maxD;CUTOFF_NEW=new Date(maxD.getFullYear(),maxD.getMonth()-1,maxD.getDate());
      $("sys-date").textContent=dStr(CURRENT_DATE);
      // Mark YTD based on dynamic max date
      var ytdM=CURRENT_DATE.getMonth(),ytdD=CURRENT_DATE.getDate();
      rawRows.forEach(function(r){r.ytd=(r.month<ytdM||(r.month===ytdM&&r.date.getDate()<=ytdD))});
      $("screen-upload").classList.add("hidden");$("screen-upload").classList.remove("flex");
      $("screen-dashboard").classList.remove("hidden");$("screen-dashboard").classList.add("flex");
      buildAll();
    }});
  },50);
}
