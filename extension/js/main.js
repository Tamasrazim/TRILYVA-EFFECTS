(function(){
"use strict";
var presets={
  linear:{name:"Linear",x1:0,y1:0,x2:1,y2:1},
  in:{name:"Ease In",x1:.42,y1:0,x2:1,y2:1},
  out:{name:"Ease Out",x1:0,y1:0,x2:.58,y2:1},
  inout:{name:"Ease In-Out",x1:.42,y1:0,x2:.58,y2:1},
  ease:{name:"Soft",x1:.25,y1:.1,x2:.25,y2:1},
  sharp:{name:"Sharp",x1:.7,y1:0,x2:.3,y2:1},
  back:{name:"Back",x1:.34,y1:1.28,x2:.68,y2:1}
};
var curve=Object.assign({},presets.ease);
var svg=document.getElementById("curveGraph");
var path=document.getElementById("curvePath");
var lines=document.getElementById("handleLines");
var h1=document.getElementById("handle1");
var h2=document.getElementById("handle2");
var activeHandle=0;
var hostConnected=false;
function graphPoint(x,y){return{x:20+x*280,y:176-y*132};}
function updateGraph(){
  var a=graphPoint(0,0),b=graphPoint(curve.x1,curve.y1),c=graphPoint(curve.x2,curve.y2),d=graphPoint(1,1);
  path.setAttribute("d","M"+a.x+" "+a.y+" C"+b.x+" "+b.y+" "+c.x+" "+c.y+" "+d.x+" "+d.y);
  lines.setAttribute("d","M"+a.x+" "+a.y+" L"+b.x+" "+b.y+" M"+d.x+" "+d.y+" L"+c.x+" "+c.y);
  h1.setAttribute("cx",b.x);h1.setAttribute("cy",b.y);
  h2.setAttribute("cx",c.x);h2.setAttribute("cy",c.y);
  document.getElementById("curveSummary").textContent="x1 "+curve.x1.toFixed(2)+" · y1 "+curve.y1.toFixed(2);
  document.getElementById("curveSummary2").textContent="x2 "+curve.x2.toFixed(2)+" · y2 "+curve.y2.toFixed(2);
}
function custom(){Array.prototype.forEach.call(document.querySelectorAll(".preset"),function(b){b.classList.remove("active");});updateGraph();}
function setPreset(key){
  if(!presets[key])return;
  curve=Object.assign({},presets[key]);
  Array.prototype.forEach.call(document.querySelectorAll(".preset"),function(b){b.classList.toggle("active",b.getAttribute("data-preset")===key);});
  updateGraph();
}
function fromEvent(e){
  var r=svg.getBoundingClientRect(),vx=(e.clientX-r.left)*320/r.width,vy=(e.clientY-r.top)*220/r.height;
  return{x:Math.max(.001,Math.min(.999,(vx-20)/280)),y:Math.max(-.4,Math.min(1.4,(176-vy)/132))};
}
function begin(which,e){
  activeHandle=which;
  if(svg.setPointerCapture&&e.pointerId!==undefined){try{svg.setPointerCapture(e.pointerId);}catch(ignore){}}
  e.preventDefault();
}
h1.addEventListener("pointerdown",function(e){begin(1,e);});
h2.addEventListener("pointerdown",function(e){begin(2,e);});
svg.addEventListener("pointermove",function(e){
  if(!activeHandle)return;
  var p=fromEvent(e);
  if(activeHandle===1){curve.x1=Math.min(p.x,curve.x2);curve.y1=p.y;}
  else{curve.x2=Math.max(p.x,curve.x1);curve.y2=p.y;}
  custom();
});
svg.addEventListener("pointerup",function(){activeHandle=0;});
svg.addEventListener("pointercancel",function(){activeHandle=0;});
Array.prototype.forEach.call(document.querySelectorAll(".preset"),function(b){
  b.addEventListener("click",function(){setPreset(b.getAttribute("data-preset"));});
});
document.getElementById("resetCurve").addEventListener("click",function(){setPreset("ease");});
document.getElementById("reverseCurve").addEventListener("click",function(){
  var old=curve;
  curve={name:"Custom",x1:1-old.x2,y1:1-old.y2,x2:1-old.x1,y2:1-old.y1};
  custom();
});
document.getElementById("copyCurve").addEventListener("click",function(){
  var value=[curve.x1,curve.y1,curve.x2,curve.y2].map(function(n){return Number(n.toFixed(4));}).join(", ");
  var status=document.getElementById("copyStatus");
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(value).then(function(){status.textContent="COPIED";},function(){status.textContent=value;});
  }else status.textContent=value;
});
function evalHost(script,callback){
  try{
    if(window.__adobe_cep__&&typeof window.__adobe_cep__.evalScript==="function")window.__adobe_cep__.evalScript(script,callback||function(){});
    else if(callback)callback("CEP_BRIDGE_UNAVAILABLE");
  }catch(err){if(callback)callback("ERROR: "+err.message);}
}
function hostStatus(label,state){
  var el=document.getElementById("hostStatus");
  el.innerHTML="<i></i> "+label;
  el.className="status"+(state?" "+state:"");
}
function parse(raw){if(!raw||raw==="undefined")return null;try{return JSON.parse(raw);}catch(ignore){return{message:String(raw)};}}
function checkHost(){
  evalHost("TRILYVA.ping()",function(raw){
    if(raw==="CEP_BRIDGE_UNAVAILABLE"){
      hostConnected=false;hostStatus("OPEN INSIDE AFTER EFFECTS","");
      document.getElementById("selectionStatus").textContent="This panel must run inside After Effects.";
      return;
    }
    var result=parse(raw);
    if(result&&result.ok){
      hostConnected=true;hostStatus("AFTER EFFECTS CONNECTED","connected");
      document.getElementById("selectionStatus").textContent=result.compName?"Active composition: "+result.compName:"Open a composition and select keyframes.";
    }else{
      hostConnected=false;hostStatus("HOST NOT READY","error");
      document.getElementById("selectionStatus").textContent=result&&result.message?result.message:"Open a composition to begin.";
    }
  });
}
document.getElementById("applyCurve").addEventListener("click",function(){
  if(!hostConnected){checkHost();return;}
  var btn=this;btn.disabled=true;btn.querySelector("span").textContent="APPLYING";
  var args=[curve.x1,curve.y1,curve.x2,curve.y2].map(function(n){return Number(n).toFixed(5);}).join(",");
  evalHost("TRILYVA.applyCurve("+args+")",function(raw){
    var result=parse(raw)||{};
    btn.disabled=false;btn.querySelector("span").textContent="APPLY CURVE";
    if(result.ok){document.getElementById("selectionStatus").textContent=result.message;hostStatus("CURVE APPLIED","connected");}
    else{document.getElementById("selectionStatus").textContent=result.message||"Could not apply the selected curve.";hostStatus("CHECK KEYFRAME SELECTION","error");}
  });
});
updateGraph();checkHost();window.setInterval(checkHost,5000);
}());
