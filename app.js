(() => {
"use strict";
const $ = s => document.querySelector(s);
const serversElement = $("#servers"), channelsElement = $("#channels"), messagesElement = $("#messages");
const messageInput = $("#messageInput"), chatForm = $("#chatForm"), chatName = $("#chatName"), searchInput = $("#search"), toastElement = $("#toast");
const STORAGE_KEY = "velorr_local_v1";

/* Add your Supabase Project URL and Publishable key here.
   Never use a service_role key or sb_secret_ key in browser code. */
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";

let supabaseClient = null;
let authMode = "signup";
let currentUser = null;

function showToast(msg){toastElement.textContent=msg;toastElement.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toastElement.classList.remove("show"),3000)}
function setAuthNote(msg){const n=$("#authNote");if(n)n.textContent=msg}
function setAuthMode(mode){
  authMode=mode;
  $("#authTitle").textContent=mode==="signup"?"Create your VELORR account":"Welcome back";
  $("#authSubmit").textContent=mode==="signup"?"Sign up":"Log in";
  $("#authToggle").textContent=mode==="signup"?"I already have an account":"Create a new account";
  $("#usernameWrap").hidden=mode!=="signup" || !!currentUser;
  $("#authPassword").autocomplete=mode==="signup"?"new-password":"current-password";
}
function renderAuth(user){
  currentUser=user||null;
  const status=$("#authStatus");
  status.textContent=user ? "SIGNED IN" : "SIGNED OUT";
  $("#authEmail").disabled=!!user;
  $("#authPassword").hidden=!!user;
  $("#usernameWrap").hidden=!!user || authMode!=="signup";
  $("#authSubmit").hidden=!!user;
  $("#authToggle").hidden=!!user;
  $("#signOutButton").hidden=!user;
  if(user){
    $("#authTitle").textContent="Your VELORR account";
    setAuthNote("Signed in as "+(user.email||"your account")+".");
    $("#profileButton").textContent=(user.email||"V").charAt(0).toUpperCase();
  } else {
    $("#authEmail").disabled=false;
    $("#authPassword").hidden=false;
    $("#authTitle").textContent=authMode==="signup"?"Create your VELORR account":"Welcome back";
    setAuthNote(supabaseClient ? "Create an account or sign in to continue." : "Add your Supabase Project URL and publishable key in app.js to enable accounts.");
  }
}
async function saveProfile(user, username){
  if(!supabaseClient || !user) return;
  const clean=(username||user.email?.split("@")[0]||"user").trim().slice(0,24);
  const {error}=await supabaseClient.from("profiles").upsert({id:user.id,username:clean},{onConflict:"id"});
  if(error) console.warn("Profile save failed:",error.message);
}
async function initAuth(){
  const configured=SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("PASTE_YOUR") &&
    SUPABASE_PUBLISHABLE_KEY && !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR");
  if(!window.supabase || !configured){
    setAuthMode("signup"); renderAuth(null); return;
  }
  try{
    supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
    const {data,error}=await supabaseClient.auth.getSession();
    if(error) throw error;
    renderAuth(data.session?.user||null);
    supabaseClient.auth.onAuthStateChange((_event,session)=>{
      currentUser=session?.user||null;
      renderAuth(currentUser);
    });
  }catch(err){
    console.error(err);setAuthNote("Could not connect to Supabase. Check the project URL and publishable key.");
  }
}
$("#authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!supabaseClient){setAuthNote("First add your Supabase Project URL and publishable key in app.js.");return;}
  const email=$("#authEmail").value.trim();
  const password=$("#authPassword").value;
  const username=$("#authUsername").value.trim();
  $("#authSubmit").disabled=true;
  try{
    if(authMode==="signup"){
      if(username.length<3){setAuthNote("Username must be at least 3 characters.");return;}
      const {data,error}=await supabaseClient.auth.signUp({email,password});
      if(error) throw error;
      if(data.user && data.session){
        await saveProfile(data.user,username);
        setAuthNote("Account created and signed in.");
        showToast("Welcome to VELORR!");
      } else {
        setAuthNote("Check your email to confirm your account, then log in.");
      }
    } else {
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error) throw error;
      renderAuth(data.user);
      showToast("Logged in successfully.");
    }
  }catch(err){setAuthNote(err.message||"Authentication failed.");}
  finally{$("#authSubmit").disabled=false;}
});
$("#authToggle").addEventListener("click",()=>{setAuthMode(authMode==="signup"?"login":"signup");setAuthNote(authMode==="signup"?"Create an account or sign in to continue.":"Log in with your email and password.")});
$("#signOutButton").addEventListener("click",async()=>{
  if(!supabaseClient)return;
  const {error}=await supabaseClient.auth.signOut();
  if(error){setAuthNote(error.message);return;}
  renderAuth(null);setAuthMode("login");showToast("Signed out.");
});

function makeId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function makeChannel(name="general"){return{id:makeId(),name,messages:[]}}
function makeServer(name,channels=["general"]){return{id:makeId(),name,channels:channels.map(n=>makeChannel(n))}}
function initialData(){const a=makeServer("Velorr Lounge",["general","announcements"]),b=makeServer("Gaming Hub",["general","looking-for-group"]),c=makeServer("Friends Zone",["general"]);return{servers:[a,b,c],selectedServerId:a.id,selectedChannelId:a.channels[0].id}}
function loadData(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const d=JSON.parse(raw);if(d&&Array.isArray(d.servers)&&d.servers.length){d.servers.forEach(s=>{if(!Array.isArray(s.channels))s.channels=[];s.channels.forEach(c=>{if(!Array.isArray(c.messages))c.messages=[]})});if(!d.servers.some(s=>s.id===d.selectedServerId))d.selectedServerId=d.servers[0].id;return d}}}catch(e){console.warn("VELORR local data load failed",e)}return initialData()}
let state=loadData();
function saveData(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){showToast("Could not save data in this browser.")}}
function getServer(){return state.servers.find(s=>s.id===state.selectedServerId)||state.servers[0]||null}
function getChannel(){const s=getServer();return s?(s.channels.find(c=>c.id===state.selectedChannelId)||s.channels[0]||null):null}
function selectServer(id){state.selectedServerId=id;const s=getServer();if(!s)return;if(!s.channels.length)s.channels.push(makeChannel());state.selectedChannelId=s.channels[0].id;saveData();render()}
function renderServers(query=""){serversElement.replaceChildren();const q=query.trim().toLowerCase();const list=state.servers.filter(s=>!q||s.name.toLowerCase().includes(q)||s.channels.some(c=>c.name.toLowerCase().includes(q)));$("#emptyServers").hidden=list.length>0;list.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.className="server";b.classList.toggle("active",s.id===state.selectedServerId);const icon=document.createElement("span");icon.className="server-icon "+["purple","blue","pink"][i%3];icon.textContent=s.name.charAt(0).toUpperCase();const details=document.createElement("span"),title=document.createElement("b"),sub=document.createElement("small");title.textContent=s.name;sub.textContent=`${s.channels.length} channel${s.channels.length===1?"":"s"}`;details.append(title,sub);const dot=document.createElement("span");dot.className="dot";b.append(icon,details,dot);b.addEventListener("click",()=>selectServer(s.id));serversElement.append(b)})}
function renderChannels(query=""){channelsElement.replaceChildren();const s=getServer();$("#emptyChannels").hidden=true;if(!s){$("#selectedServerLabel").textContent="Create a server to begin.";$("#emptyChannels").hidden=false;return}$("#selectedServerLabel").textContent=s.name;const q=query.trim().toLowerCase(),list=s.channels.filter(c=>!q||c.name.toLowerCase().includes(q)||s.name.toLowerCase().includes(q));$("#emptyChannels").hidden=list.length>0;list.forEach(c=>{const b=document.createElement("button");b.type="button";b.className="channel";b.classList.toggle("active",c.id===state.selectedChannelId);const hash=document.createElement("span"),name=document.createElement("b");hash.className="channel-icon";hash.textContent="#";name.textContent=c.name;b.append(hash,name);b.addEventListener("click",()=>{state.selectedChannelId=c.id;saveData();render()});channelsElement.append(b)})}
function renderMessages(){messagesElement.replaceChildren();const s=getServer(),c=getChannel();if(!s||!c){chatName.textContent="No channel selected";$("#chatSubtitle").textContent="Create a server and channel";$("#chatForm").hidden=true;return}$("#chatForm").hidden=false;chatName.textContent=c.name;$("#chatSubtitle").textContent=s.name;if(!c.messages.length){const welcome=document.createElement("p"),empty=document.createElement("p");welcome.className="system";welcome.textContent=`Welcome to #${c.name} in ${s.name}!`;empty.className="hint";empty.textContent="This is the beginning of this channel.";messagesElement.append(welcome,empty);return}c.messages.forEach(m=>{const p=document.createElement("p");p.className="bubble";p.textContent=String(m.text);messagesElement.append(p)});messagesElement.scrollTop=messagesElement.scrollHeight}
function render(){const q=searchInput.value;renderServers(q);renderChannels(q);renderMessages()}
$("#addServer").addEventListener("click",()=>{if(!currentUser)return showToast("Please sign in first.");const name=prompt("Enter your new server name:");if(!name||!name.trim())return;const clean=name.trim().slice(0,50);if(state.servers.some(s=>s.name.toLowerCase()===clean.toLowerCase()))return showToast("A server with this name already exists.");const s=makeServer(clean);state.servers.push(s);state.selectedServerId=s.id;state.selectedChannelId=s.channels[0].id;saveData();render();showToast("Local demo server created. Cloud sync is not connected yet.")});
$("#addChannel").addEventListener("click",()=>{if(!currentUser)return showToast("Please sign in first.");const s=getServer();if(!s)return showToast("Create a server first.");const name=prompt("Enter channel name (e.g. general):");if(!name||!name.trim())return;const clean=name.trim().replace(/^#+/,"").replace(/\s+/g,"-").slice(0,40);if(!clean)return showToast("Please enter a valid channel name.");if(s.channels.some(c=>c.name.toLowerCase()===clean.toLowerCase()))return showToast("This channel already exists.");const c=makeChannel(clean);s.channels.push(c);state.selectedChannelId=c.id;saveData();render();showToast("Local demo channel created. Cloud sync is not connected yet.")});
chatForm.addEventListener("submit",e=>{e.preventDefault();if(!currentUser)return showToast("Please sign in first.");const text=messageInput.value.trim();if(!text)return;const c=getChannel();if(!c)return showToast("Select a channel first.");c.messages.push({id:makeId(),text:text.slice(0,2000),createdAt:new Date().toISOString()});saveData();messageInput.value="";renderMessages();messageInput.focus();showToast("Saved locally only; shared chat is not connected yet.")});
searchInput.addEventListener("input",render);
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("selected",x===b));const p=b.dataset.page;if(p!=="Home")showToast(`${p} will be added in a future version.`);else window.scrollTo({top:0,behavior:"smooth"})}));
$("#profileButton").addEventListener("click",()=>{if(currentUser)showToast(currentUser.email||"Signed in");else{document.querySelector("#authCard").scrollIntoView({behavior:"smooth"});showToast("Sign up or log in to view your profile.")}});
window.addEventListener("storage",e=>{if(e.key===STORAGE_KEY){state=loadData();render()}});
if(!getChannel()){const s=getServer();if(s){if(!s.channels.length)s.channels.push(makeChannel());state.selectedChannelId=s.channels[0].id}saveData()}
setAuthMode("signup");
render();
initAuth();
})();