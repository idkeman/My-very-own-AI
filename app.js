const SUPABASE_URL="https://dkwmkvruzebnqlmvwzhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_Tur9X4MaQjH__4DnEtwAAQ_Xy9xVl5P";
const FUNCTION_NAME="ai-chat";

const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);

let savedMessages=[];
try{savedMessages=JSON.parse(localStorage.getItem("nova_messages")||"[]");if(!Array.isArray(savedMessages))savedMessages=[];}catch{localStorage.removeItem("nova_messages");}
const state={
  messages:savedMessages,
  name:localStorage.getItem("nova_name")||"NOVA",
  instructions:localStorage.getItem("nova_instructions")||$("systemPrompt").value
};

$("aiName").value=state.name;
$("systemPrompt").value=state.instructions;
$("modelSelect").value=localStorage.getItem("nova_model")||"gpt-5.6-luna";
$("webSearchToggle").checked=localStorage.getItem("nova_web_search")==="true";

function save(){
  localStorage.setItem("nova_messages",JSON.stringify(state.messages));
  localStorage.setItem("nova_name",state.name);
  localStorage.setItem("nova_instructions",state.instructions);
  localStorage.setItem("nova_model",$("modelSelect").value);
  localStorage.setItem("nova_web_search",$("webSearchToggle").checked);
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function render(){
  const box=$("messages");
  if(!state.messages.length){
    box.innerHTML='<div class="empty"><div class="spark">✦</div><h2>Meet '+escapeHtml(state.name)+'</h2><p>Ask a question, brainstorm an idea, debug code, or just start talking.</p></div>';
    return;
  }
  box.innerHTML=state.messages.map(m=>`<article class="message ${m.role}">
    <div class="avatar">${m.role==="user"?"YOU":"✦"}</div>
    <div><div class="bubble">${escapeHtml(m.content)}</div><div class="message-meta">${m.role==="user"?"You":escapeHtml(state.name)}</div></div>
  </article>`).join("");
  box.scrollTop=box.scrollHeight;
}
function setStatus(type,text){
  const el=$("connectionStatus");el.className="status "+(type||"");el.innerHTML=`<span></span>${escapeHtml(text)}`;
}
async function ensureSession(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session){setStatus("ok","Connected");return session}
  const {data,error}=await supabaseClient.auth.signInAnonymously();
  if(error) throw new Error("Supabase sign-in failed: "+error.message);
  setStatus("ok","Connected");
  return data.session;
}
async function sendMessage(text){
  state.messages.push({role:"user",content:text});
  save();render();
  $("typing").classList.remove("hidden");$("sendBtn").disabled=true;
  setStatus("","Connecting to AI…");
  try{
    await ensureSession();
    const recent=state.messages.slice(-30);
    const {data,error}=await supabaseClient.functions.invoke(FUNCTION_NAME,{
      body:{messages:recent,model:$("modelSelect").value,webSearch:$("webSearchToggle").checked,instructions:state.instructions,name:state.name}
    });
    if(error) throw new Error(error.message||"The AI service returned an error.");
    if(!data?.output) throw new Error(data?.error||"The AI returned no text.");
    state.messages.push({role:"assistant",content:data.output});
    save();render();
  }catch(error){
    let message=error?.message||String(error)||"Unknown error";
    if(error?.context instanceof Response){
      try{
        const body=await error.context.clone().json();
        if(body?.error) message=String(body.error);
      }catch{}
    }
    state.messages.push({role:"assistant",content:"I couldn't answer that yet. "+message});
    save();render();setStatus("error",message.slice(0,80));
  }finally{
    $("typing").classList.add("hidden");$("sendBtn").disabled=false;$("prompt").focus();
  }
}
$("composer").addEventListener("submit",async e=>{
  e.preventDefault();const input=$("prompt");const text=input.value.trim();if(!text||$("sendBtn").disabled)return;
  input.value="";input.style.height="auto";await sendMessage(text);
});
$("prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("composer").requestSubmit()}});
$("prompt").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,180)+"px"});
$("newChatBtn").onclick=()=>{state.messages=[];save();$("chatTitle").textContent="New conversation";render();$("prompt").focus()};
$("clearBtn").onclick=()=>{if(confirm("Delete this AI's saved local conversation and settings?")){localStorage.clear();location.reload()}};
$("exportBtn").onclick=()=>{
  const text=state.messages.map(m=>`${m.role==="user"?"You":state.name}: ${m.content}`).join("\n\n");
  const blob=new Blob([text],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="my-ai-chat.txt";a.click();URL.revokeObjectURL(url);
};
$("settingsBtn").onclick=()=>{$("settingsDialog").showModal()};
$("saveSettings").onclick=()=>{state.name=$("aiName").value.trim()||"NOVA";state.instructions=$("systemPrompt").value.trim()||"You are a helpful AI assistant.";save();render()};
$("modelSelect").onchange=save;$("webSearchToggle").onchange=save;
(async()=>{render();try{await ensureSession()}catch(e){setStatus("error","Setup required")}})();
