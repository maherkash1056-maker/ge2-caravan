<script>/* GE2 Caravan bug catcher: every page reports its errors to the class server (teacher tab → Bugs). Marker: CARAVAN_BUGCATCH */
(function(){if(window.CARAVAN_BUGCATCH)return;window.CARAVAN_BUGCATCH=1;
var API="https://ge2-caravan-api.ge2-caravan.workers.dev/";var seen={},sent=0;
function page(){try{var m=location.search.match(/[?&]p=(\d+)/);return m?"p="+m[1]:(document.title||"page").slice(0,30);}catch(e){return "page";}}
function session(){try{var s=JSON.parse(localStorage.getItem("gs-session")||"null");if(s&&s.token)return s;}catch(e){}try{var h=location.hash.replace(/^#/,"");var t="";h.split("&").forEach(function(x){if(x.indexOf("s=")===0)t=x.slice(2);});if(t&&t.split("~")[0].length>=8)return{token:t.split("~")[0],id:t.split("~")[1]||""};}catch(e){}return null;}
function report(where,err,extra){try{var msg=String(err&&err.message||err||"error").slice(0,400);var stack=String(err&&err.stack||"").slice(0,2000);var key=where+"|"+msg.replace(/\d+/g,"#");if(seen[key]||sent>=20)return;seen[key]=1;sent++;var s=session();
  var body=JSON.stringify({kind:"bug",token:s?s.token:"",id:s?s.id:"",device:"",data:{page:page(),where:String(where||"").slice(0,80),message:msg,stack:stack,url:location.href.replace(/#.*$/,"").slice(0,300),extra:extra||null}});
  if(navigator.sendBeacon){navigator.sendBeacon(API,new Blob([body],{type:"text/plain"}));}else{fetch(API,{method:"POST",headers:{"content-type":"text/plain"},body:body,keepalive:true}).catch(function(){});}}catch(e){}}
window.reportBug=report;
window.addEventListener("error",function(e){if(e&&e.message&&/ResizeObserver|Script error\.?$/.test(e.message))return;report("window.error",e.error||e.message,{line:e.lineno,col:e.colno,src:String(e.filename||"").slice(0,120)});});
window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason;if(r&&r.msg&&!r.stack)return; /* app-level notices like {msg:"Log in first"} are not bugs */ report("promise",r||"rejected");});
/* network failures to the class server */
var _f=window.fetch;if(_f){window.fetch=function(u,o){var p=_f.apply(this,arguments);try{if(String(u).indexOf("ge2-caravan-api")>=0){var kind="";try{kind=(JSON.parse(o&&o.body||"{}").kind)||"";}catch(e){}p.then(function(r){if(!r.ok&&r.status>=500&&kind!=="bug")report("server "+kind,"HTTP "+r.status);},function(err){if(kind!=="bug")report("network "+kind,err);});}}catch(e){}return p;};}
})();</script>
