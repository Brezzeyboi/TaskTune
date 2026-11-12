/* TaskTune 2.0 — standalone, local-first task manager */
(() => {
'use strict';
const KEY='tasktune:v2:tasks', LEGACY='tasks', THEME='tasktune:theme';
const $=id=>document.getElementById(id), all=sel=>[...document.querySelectorAll(sel)];
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const uid=()=>globalThis.crypto?.randomUUID?.()||'task-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const safeDate=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00');return Number.isNaN(d.getTime())||[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')!==v?'':v};
const safeImage=v=>typeof v==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(v)&&v.length<6000000?v:'';
const normalize=t=>{if(!t||typeof t!=='object'||typeof(t.title??t.text)!=='string')return null;const title=(t.title??t.text).trim().slice(0,180);if(!title)return null;return {id:typeof t.id==='string'&&t.id.length<120?t.id:uid(),title,notes:typeof t.notes==='string'?t.notes.slice(0,1500):'',completed:!!(t.completed??t.done),priority:['low','medium','high'].includes(t.priority)?t.priority:'medium',category:['Work','Personal','Study','Other'].includes(t.category)?t.category:'Personal',dueDate:safeDate(t.dueDate),image:safeImage(t.image),createdAt:Number.isFinite(t.createdAt)?t.createdAt:Date.now()}};
function load(){try{const v=localStorage.getItem(KEY),a=JSON.parse(v!==null?v:localStorage.getItem(LEGACY)||'[]');if(!Array.isArray(a))return [];const ids=new Set();return a.slice(0,5000).map(normalize).filter(Boolean).map(t=>{if(ids.has(t.id))t.id=uid();ids.add(t.id);return t})}catch{return []}}
let tasks=load(),view='all',category='',status='all',editing=null,attachment='',undo=null,toastTimer;
function toast(s,action){clearTimeout(toastTimer);undo=action||null;$('toastText').textContent=s;$('undoButton').hidden=!action;$('toast').hidden=false;toastTimer=setTimeout(()=>hideToast(),action?6500:4000)}
function hideToast(){$('toast').hidden=true;undo=null}
function save(next){try{localStorage.setItem(KEY,JSON.stringify(next));tasks=next;render();return true}catch{toast('Storage full — export tasks or use a smaller image');return false}}
const overdue=t=>!t.completed&&t.dueDate&&t.dueDate<today();
function chip(label,cls=''){const e=document.createElement('span');e.className='meta-chip '+cls;e.textContent=label;return e}
function dateLabel(date){if(date===today())return 'Today';return new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})}
function taskNode(t){
const li=document.createElement('li');li.className='task-item'+(t.completed?' completed':'');
const check=document.createElement('input');check.type='checkbox';check.className='task-check';check.checked=t.completed;check.setAttribute('aria-label',(t.completed?'Mark incomplete: ':'Complete: ')+t.title);check.onchange=()=>save(tasks.map(x=>x.id===t.id?{...x,completed:check.checked}:x));li.append(check);
const body=document.createElement('div');body.className='task-main';const title=document.createElement('p');title.className='task-title';title.textContent=t.title;body.append(title);
if(t.notes){const notes=document.createElement('p');notes.className='task-notes';notes.textContent=t.notes;body.append(notes)}
const meta=document.createElement('div');meta.className='task-meta';meta.append(chip(t.priority[0].toUpperCase()+t.priority.slice(1)+' priority','priority-'+t.priority),chip(t.category));if(t.dueDate)meta.append(chip((overdue(t)?'Overdue · ':'◷ ')+dateLabel(t.dueDate),overdue(t)?'overdue-chip':''));body.append(meta);
if(t.image){const img=document.createElement('img');img.src=t.image;img.alt='Attachment for '+t.title;img.className='task-thumbnail';img.loading='lazy';body.append(img)}li.append(body);
const actions=document.createElement('div');actions.className='task-actions';
for(const [icon,label,run,cls] of [['✎','Edit',()=>openDialog(t.id),''],['✕','Delete',()=>removeTask(t.id),'delete']]){const b=document.createElement('button');b.type='button';b.className='task-action '+cls;b.textContent=icon;b.title=label;b.setAttribute('aria-label',label+' '+t.title);b.onclick=run;actions.append(b)}li.append(actions);return li
}
function visible(){const q=$('searchInput').value.trim().toLocaleLowerCase(),rank={high:0,medium:1,low:2};return tasks.filter(t=>{
if(category&&t.category!==category)return false;
if(view==='today'&&(t.completed||t.dueDate!==today()))return false;
if(view==='upcoming'&&(t.completed||!t.dueDate||t.dueDate<=today()))return false;
if(view==='completed'&&!t.completed)return false;
if(status==='active'&&t.completed||status==='completed'&&!t.completed)return false;
return !q||[t.title,t.notes,t.category].some(s=>s.toLocaleLowerCase().includes(q))
}).sort((a,b)=>{const s=$('sortSelect').value;if(s==='oldest')return a.createdAt-b.createdAt;if(s==='due')return (a.dueDate||'9999').localeCompare(b.dueDate||'9999')||b.createdAt-a.createdAt;if(s==='priority')return rank[a.priority]-rank[b.priority]||b.createdAt-a.createdAt;return b.createdAt-a.createdAt})}
function render(){
const done=tasks.filter(t=>t.completed).length,pct=tasks.length?Math.round(done*100/tasks.length):0;
for(const [id,value] of Object.entries({doneCount:done,totalCount:tasks.length,remainingCount:tasks.length-done,navAllCount:tasks.length,dueTodayCount:tasks.filter(t=>!t.completed&&t.dueDate===today()).length,overdueCount:tasks.filter(overdue).length,progressPercent:pct+'%'}))$(id).textContent=value;
$('progressRing').style.setProperty('--progress',pct+'%');$('progressRing').setAttribute('aria-label',pct+' percent completed');
$('progressMessage').textContent=!tasks.length?'Add your first task to get moving.':pct===100?'Everything checked off. Incredible work!':'Small steps make a big difference.';
const label=category?category+' tasks':({all:'All tasks',today:'Due today',upcoming:'Upcoming',completed:'Completed'}[view]);$('breadcrumbView').textContent=label;$('sectionTitle').firstChild.textContent=label+' ';
const list=visible();$('sectionCount').textContent=list.length;$('clearCompletedButton').disabled=done===0;$('taskList').replaceChildren(...list.map(taskNode));
$('emptyState').hidden=list.length!==0;$('emptyTitle').textContent=tasks.length?'Nothing here yet':'Your canvas is clear';$('emptyDescription').textContent=tasks.length?'Try another view or change your search filters.':'Add a task and turn ideas into progress.';$('emptyAddButton').hidden=tasks.length!==0
}
function removeTask(id){const index=tasks.findIndex(t=>t.id===id);if(index<0)return;const removed=tasks[index];if(save(tasks.filter(t=>t.id!==id)))toast('Task deleted',()=>{const a=[...tasks];a.splice(Math.min(index,a.length),0,removed);if(save(a))toast('Task restored')})}
function changeView(next,cat=''){view=next;category=cat;status='all';$('searchInput').value='';all('[data-view]').forEach(b=>b.classList.toggle('active',!cat&&b.dataset.view===next));all('[data-category]').forEach(b=>b.classList.toggle('active',b.dataset.category===cat));all('[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status==='all'));render()}
function preview(){$('attachmentPreview').hidden=!attachment;if(attachment)$('attachmentImage').src=attachment;else $('attachmentImage').removeAttribute('src')}
function openDialog(id=null){editing=id;const t=tasks.find(x=>x.id===id);$('taskForm').reset();$('formError').hidden=true;$('dialogTaskTitle').value=t?.title||$('quickTaskInput').value.trim();$('dialogTaskNotes').value=t?.notes||'';$('dialogTaskPriority').value=t?.priority||'medium';$('dialogTaskCategory').value=t?.category||'Personal';$('dialogTaskDue').value=t?.dueDate||'';attachment=t?.image||'';$('imageFileName').textContent=attachment?'Existing attachment':'No image selected';preview();$('dialogTitle').textContent=t?'Edit task':'Create a task';$('saveTaskButton').textContent=t?'Save changes':'Create task';$('taskDialog').showModal();$('dialogTaskTitle').focus()}
function closeDialog(){$('taskDialog').close();editing=null}
function handleImage(file){if(!file)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024){$('formError').textContent='Choose a PNG, JPG, WEBP or GIF under 5 MB';$('formError').hidden=false;return}const reader=new FileReader();reader.onerror=()=>toast('Could not read image');reader.onload=()=>{const img=new Image();img.onerror=()=>toast('Invalid image');img.onload=()=>{const scale=Math.min(1,1100/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d')?.drawImage(img,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/webp',.74);if(!data.startsWith('data:image/webp'))data=canvas.toDataURL('image/jpeg',.7);if(!safeImage(data)||data.length>950000){$('formError').textContent='Image too large to save. Choose a smaller image.';$('formError').hidden=false;return}attachment=data;$('imageFileName').textContent=file.name;$('formError').hidden=true;preview()};img.src=reader.result};reader.readAsDataURL(file)}
function addQuick(e){e.preventDefault();const title=$('quickTaskInput').value.trim().slice(0,180);if(!title)return;if(save([normalize({id:uid(),title,createdAt:Date.now()}),...tasks])){$('quickTaskInput').value='';toast('Task added')}}
function saveForm(e){e.preventDefault();const title=$('dialogTaskTitle').value.trim().slice(0,180);if(!title)return;const patch={title,notes:$('dialogTaskNotes').value.trim(),priority:$('dialogTaskPriority').value,category:$('dialogTaskCategory').value,dueDate:safeDate($('dialogTaskDue').value),image:attachment},wasEditing=!!editing;const next=editing?tasks.map(t=>t.id===editing?{...t,...patch}:t):[normalize({...patch,id:uid(),createdAt:Date.now()}),...tasks];if(save(next)){closeDialog();$('quickTaskInput').value='';toast(wasEditing?'Task updated':'Task created')}}
function exportTasks(){const blob=new Blob([JSON.stringify({app:'TaskTune',version:2,exportedAt:new Date().toISOString(),tasks},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tasktune-backup-'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup downloaded')}
async function importTasks(file){if(!file)return;if(file.size>5*1024*1024){toast('Backup exceeds 5 MB');return}try{const obj=JSON.parse(await file.text()),list=Array.isArray(obj)?obj:obj?.app==='TaskTune'&&Array.isArray(obj.tasks)?obj.tasks:null;if(!list||list.length>5000)throw Error();const imported=list.map(normalize);if(imported.some(t=>!t))throw Error();const ids=new Set(tasks.map(t=>t.id)),unique=imported.filter(t=>{if(ids.has(t.id))return false;ids.add(t.id);return true});if(save([...unique,...tasks]))toast(unique.length+' tasks imported')}catch{toast('Invalid TaskTune backup file')}}
all('[data-view]').forEach(b=>b.onclick=()=>changeView(b.dataset.view));all('[data-category]').forEach(b=>b.onclick=()=>changeView('all',b.dataset.category));all('[data-status]').forEach(b=>b.onclick=()=>{status=b.dataset.status;all('[data-status]').forEach(x=>x.classList.toggle('active',x===b));render()});
$('searchInput').oninput=render;$('sortSelect').onchange=render;$('quickAddForm').onsubmit=addQuick;
for(const id of ['newTaskButton','advancedAddButton','emptyAddButton'])$(id).onclick=()=>openDialog();
$('taskForm').onsubmit=saveForm;for(const id of ['closeDialogButton','cancelDialogButton'])$(id).onclick=closeDialog;
$('taskDialog').onclick=e=>{if(e.target===$('taskDialog'))closeDialog()};$('taskDialog').addEventListener('close',()=>{editing=null});
$('dialogTaskImage').onchange=e=>handleImage(e.target.files[0]);$('removeAttachmentButton').onclick=()=>{attachment='';$('dialogTaskImage').value='';$('imageFileName').textContent='No image selected';preview()};
$('clearCompletedButton').onclick=()=>{const done=tasks.filter(t=>t.completed);if(!done.length||!confirm('Delete '+done.length+' completed tasks?'))return;if(save(tasks.filter(t=>!t.completed)))toast('Completed tasks cleared',()=>{if(save([...tasks,...done]))toast('Tasks restored')})};
$('undoButton').onclick=()=>{const fn=undo;hideToast();fn?.()};$('dismissToastButton').onclick=hideToast;
$('exportButton').onclick=exportTasks;$('importButton').onclick=()=>$('importInput').click();$('importInput').onchange=async e=>{await importTasks(e.target.files[0]);e.target.value=''};
function themeLabel(){const dark=document.documentElement.dataset.theme!=='light';$('themeToggle').textContent=dark?'☼':'☾';$('themeToggle').title='Switch to '+(dark?'light':'dark')+' mode';$('themeToggle').setAttribute('aria-label',$('themeToggle').title)}
$('themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem(THEME,next)}catch{}themeLabel()};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||$('taskDialog').open||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key.toLowerCase()==='n'){e.preventDefault();openDialog()}if(e.key==='/'){e.preventDefault();$('searchInput').focus()}});
window.addEventListener('storage',e=>{if(e.key===KEY){tasks=load();render()}});
$('todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});themeLabel();render();
})();
