const KEY="merakiAttendance_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"members":[],"meetings":[]}');
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem(KEY,JSON.stringify(data));render();}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function pct(a,b){return b?Math.round(a/b*100):0}
function dateStr(d){return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
function showScreen(id){$$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));window.scrollTo(0,0)}
$$(".nav").forEach(b=>b.onclick=()=>showScreen(b.dataset.screen));
$$(".text-btn").forEach(b=>b.onclick=()=>showScreen(b.dataset.screen));
function render(){
  $("#memberCount").textContent=data.members.length;
  $("#meetingCount").textContent=data.meetings.length;
  const total=data.meetings.reduce((n,m)=>n+m.present.length,0);
  const possible=data.meetings.length*data.members.length;
  $("#presentTotal").textContent=total; $("#overallPct").textContent=pct(total,possible)+"%";
  const cards=data.meetings.slice().reverse();
  $("#recentMeetings").innerHTML=cards.slice(0,4).map(meetingCard).join("")||'<div class="empty">No meetings yet.<br>Start your first meeting above.</div>';
  $("#allMeetings").innerHTML=cards.map(meetingCard).join("")||'<div class="empty">No meetings yet.</div>';
  renderMembers($("#memberSearch")?.value||"");
}
function meetingCard(m){return `<div class="card" onclick="openMeeting('${m.id}')"><div class="row"><div><div class="name">${esc(m.title||"Meraki Meeting")}</div><div class="sub">${dateStr(m.date)} · ${m.present.length}/${data.members.length} present</div></div><span class="pill">${pct(m.present.length,data.members.length)}%</span></div></div>`}
function renderMembers(q=""){
  const arr=data.members.filter(m=>m.name.toLowerCase().includes(q.toLowerCase()));
  $("#membersList").innerHTML=arr.map(m=>`<div class="card"><div class="row"><div><div class="name">${esc(m.name)}</div><div class="sub">${esc(m.id||"")}</div></div><button class="text-btn" onclick="deleteMember('${m.id}')">Delete</button></div></div>`).join("")||'<div class="empty">No members found.</div>';
}
$("#memberSearch").oninput=e=>renderMembers(e.target.value);
function openModal(html){$("#modal").innerHTML=`<div class="sheet">${html}</div>`;$("#modal").classList.add("show")}
function closeModal(){$("#modal").classList.remove("show");$("#modal").innerHTML=""}
$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()}
function addMember(){openModal(`<h3>Add member</h3><div class="field"><label>Name</label><input id="newName" autofocus placeholder="e.g. Suyash Sinha"></div><div class="field"><label>Member ID (optional)</label><input id="newId" placeholder="e.g. M-01"></div><div class="actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmMember()">Add member</button></div>`)}
$("#addMemberBtn").onclick=addMember;
window.confirmMember=()=>{let name=$("#newName").value.trim();if(!name)return alert("Enter a name.");data.members.push({id:uid(),name,id:$("#newId").value.trim()});closeModal();save()}
window.deleteMember=id=>{if(confirm("Delete this member? Their old attendance marks will remain, but they won't appear in future meetings.")){data.members=data.members.filter(m=>m.id!==id);save()}}
function newMeeting(){if(!data.members.length){alert("Add members first.");showScreen("members");return}
 const today=new Date().toISOString().slice(0,10);
 openModal(`<h3>Start new meeting</h3><div class="field"><label>Meeting name</label><input id="meetingTitle" value="Meraki Meeting"></div><div class="field"><label>Date</label><input id="meetingDate" type="date" value="${today}"></div><div class="actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="createMeeting()">Continue</button></div>`);
}
$("#newMeetingBtn").onclick=newMeeting;$("#newMeetingBtn2").onclick=newMeeting;
window.createMeeting=()=>{const m={id:uid(),title:$("#meetingTitle").value.trim()||"Meraki Meeting",date:$("#meetingDate").value,present:[]};data.meetings.push(m);save();closeModal();openMeeting(m.id)}
window.openMeeting=id=>{const m=data.meetings.find(x=>x.id===id);if(!m)return;showScreen("meetings");openModal(`<h3>${esc(m.title)}</h3><div class="date-label">${dateStr(m.date)} · <span id="countNow">${m.present.length}</span>/${data.members.length} present</div><div id="attendanceRows">${data.members.map(mem=>{let p=m.present.includes(mem.id);return `<div class="att-row"><div><div class="name">${esc(mem.name)}</div><div class="sub">${esc(mem.id||"")}</div></div><button class="toggle ${p?"present":""}" onclick="toggleAttendance('${m.id}','${mem.id}')">${p?"PRESENT":"ABSENT"}</button></div>`}).join("")}</div><div class="actions"><button class="secondary" onclick="closeModal()">Close</button><button class="danger-btn" onclick="deleteMeeting('${m.id}')">Delete meeting</button></div>`)}
window.toggleAttendance=(mid,memid)=>{let m=data.meetings.find(x=>x.id===mid);m.present=m.present.includes(memid)?m.present.filter(x=>x!==memid):[...m.present,memid];localStorage.setItem(KEY,JSON.stringify(data));openMeeting(mid);render()}
window.deleteMeeting=id=>{if(confirm("Delete this meeting?")){data.meetings=data.meetings.filter(m=>m.id!==id);closeModal();save()}}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`meraki-attendance-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("#exportBtn").onclick=exportData;$("#backupBtn").onclick=exportData;
$("#importBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.members||!x.meetings)throw Error();data=x;save();alert("Backup restored.");}catch{alert("That file is not a valid Meraki Attendance backup.")}e.target.value=""}
$("#clearBtn").onclick=()=>{if(confirm("Delete ALL members, meetings and attendance? This cannot be undone unless you have a backup.")){data={members:[],meetings:[]};save()}}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
render();