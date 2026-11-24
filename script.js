const ids=['invoice','date','customer','gstin','address','email','mobile','supply','transport','eway','po','reverse'];const $=x=>document.getElementById(x);const num=v=>Math.max(0,Number(v)||0);const money=n=>'₹'+n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function addRow(d={}){let tr=document.createElement('tr');tr.innerHTML=`<td class="sn"></td><td><input class="desc" value="${esc(d.desc||'')}"></td><td><input class="hsn" value="${esc(d.hsn||'')}"></td><td><select class="tax">${[0,5,12,18,28].map(v=>`<option value="${v}" ${Number(d.tax??18)===v?'selected':''}>${v}%</option>`).join('')}</select></td><td><input class="qty" type="number" min="0" step="any" value="${esc(d.qty??1)}"></td><td><input class="rate" type="number" min="0" step="any" value="${esc(d.rate??0)}"></td><td><input class="disc" type="number" min="0" max="100" step="any" value="${esc(d.disc??0)}"></td><td class="taxable money">₹0.00</td><td><button class="secondary" onclick="this.closest('tr').remove();calculate();queueDraftSave()">×</button></td>`;$('items').append(tr);tr.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',()=>{calculate();queueDraftSave()}));calculate()}
function getRows(){return [...$('items').children].map(tr=>({desc:tr.querySelector('.desc').value,hsn:tr.querySelector('.hsn').value,tax:num(tr.querySelector('.tax').value),qty:num(tr.querySelector('.qty').value),rate:num(tr.querySelector('.rate').value),disc:Math.min(100,num(tr.querySelector('.disc').value))}))}
function numberWords(n){n=Math.floor(n);if(n===0)return 'Zero';let ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];function small(x){return x<20?ones[x]:x<100?tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:''):ones[Math.floor(x/100)]+' Hundred'+(x%100?' '+small(x%100):'')}let out=[];for(let [v,name] of [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[1,'']]){let k=Math.floor(n/v);if(k){out.push(small(k)+(name?' '+name:''));n%=v}}return out.join(' ')}
// Round each displayed invoice line to paise; MRP is GST-INCLUSIVE.
const paisa=x=>Math.round((x+Number.EPSILON)*100)/100;
function lineCalc(r){
 const gross=paisa(r.qty*r.rate*(1-r.disc/100));
 const taxable=paisa(gross/(1+r.tax/100));
 const halfRate=r.tax/2;
 const cgst=paisa(taxable*halfRate/100);
 const sgst=paisa(taxable*halfRate/100);
 return {gross,taxable,cgst,sgst};
}
function calculate(){
 const rows=getRows(), lines=rows.map(lineCalc);
 let base=paisa(lines.reduce((a,x)=>a+x.taxable,0));
 let cg=paisa(lines.reduce((a,x)=>a+x.cgst,0));
 let sg=paisa(lines.reduce((a,x)=>a+x.sgst,0));
 let gross=paisa(lines.reduce((a,x)=>a+x.gross,0));
 let total=Math.round(gross),round=paisa(total-base-cg-sg);
 rows.forEach((r,i)=>{let tr=$('items').children[i];tr.querySelector('.sn').textContent=i+1;tr.querySelector('.taxable').textContent=money(lines[i].taxable)});
 $('subtotal').textContent=money(base);$('cgst').textContent=money(cg);$('sgst').textContent=money(sg);$('roundoff').textContent=round.toFixed(2);$('grand').textContent=money(total);$('words').textContent=numberWords(total)+' Rupees Only';
 let d=Object.fromEntries(ids.map(k=>[k,$(k).value]));
 let date=d.date?new Date(d.date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'';
 $('printCustomer').innerHTML=`<b>Party Details :</b><div class="party-name">${esc(d.customer)}</div><div>${esc(d.address).replace(/\n/g,'<br>')}</div><div><b>Email</b> &nbsp; : &nbsp; ${esc(d.email)}</div><div><b>Party Mobile No</b> &nbsp; : &nbsp; ${esc(d.mobile)}</div><div><b>GSTIN / UIN</b> &nbsp; : &nbsp; ${esc(d.gstin)}</div>`;
 $('printMeta').innerHTML=`<div><b>Invoice No.</b> &nbsp; : &nbsp; ${esc(d.invoice)}</div><div><b>Dated</b> &nbsp; : &nbsp; ${esc(date)}</div><div><b>Place of Supply</b> &nbsp; : &nbsp; ${esc(d.supply)}</div><div><b>Reverse Charge</b> &nbsp; : &nbsp; ${esc(d.reverse)}</div><div><b>GR/RR No.</b> &nbsp; : &nbsp; </div><div><b>Transport</b> &nbsp; : &nbsp; ${esc(d.transport)}</div><div><b>E-Way Bill No.</b> &nbsp; : &nbsp; ${esc(d.eway)}</div><div><b>PO No.</b> &nbsp; : &nbsp; ${esc(d.po)}</div>`;
 $('printRows').innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.desc)}</td><td>${esc(r.hsn)}</td><td>${r.tax}%</td><td>${r.qty.toFixed(2)}</td><td>${r.rate.toFixed(2)}</td><td>${r.disc}%</td><td>${lines[i].taxable.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</td></tr>`).join('');
 let taxGroups={};rows.forEach((r,i)=>{let k=r.tax; if(!taxGroups[k])taxGroups[k]={base:0,cg:0,sg:0};taxGroups[k].base+=lines[i].taxable;taxGroups[k].cg+=lines[i].cgst;taxGroups[k].sg+=lines[i].sgst});
 $('printTaxes').innerHTML=`<div class="tax-add"><span>Add &nbsp; : &nbsp; CGST</span><span>${Object.keys(taxGroups).length===1?((rows[0]?.tax??18)/2).toFixed(2)+'%':'Various'}</span><span class="amount">${cg.toFixed(2)}</span></div><div class="tax-add"><span>Add &nbsp; : &nbsp; SGST</span><span>${Object.keys(taxGroups).length===1?((rows[0]?.tax??18)/2).toFixed(2)+'%':'Various'}</span><span class="amount">${sg.toFixed(2)}</span></div>${round !== 0 ? `<div class="tax-add"><span>Add &nbsp; : &nbsp; Rounded off</span><span></span><span class="amount">${round.toFixed(2)}</span></div>` : ''}`;
 $('printGrand').textContent=money(total);
 $('printWords').textContent=$('words').textContent;
 $('printQty').textContent=rows.reduce((a,r)=>a+r.qty,0).toFixed(2);
 $('printTaxSummary').innerHTML=Object.entries(taxGroups).map(([rate,v])=>`<tr><td>${rate}%</td><td>${money(paisa(v.base))}</td><td>${money(paisa(v.cg))}</td><td>${money(paisa(v.sg))}</td><td>${money(paisa(v.cg+v.sg))}</td></tr>`).join('');
}

const TABLE = 'billing_shared_invoices';
const BACKUP_FORMAT = 'almumin-cloud-shared-v1';
const db = window.supabase && SUPABASE_KEY !== 'YOUR_PUBLISHABLE_KEY'
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null;
let current = null;
let dirty = false;
let timer;
let pendingWrite;
let busy = false;
let conflict = false;

function status(message) {
  $('syncStatus').textContent = message;
}

function report(error) {
  status(error.code === '23505'
    ? 'Invoice number already saved. Use a different number or reopen that invoice.'
    : error.message || 'Could not sync. Try again.');
}

function table() {
  if (!db) throw new Error('Set the project URL and publishable key in supabase-config.js and reload.');
  return db.from(TABLE);
}

function checked(result) {
  if (result.error) throw result.error;
  return result.data;
}

function formData() {
  return { ...Object.fromEntries(ids.map(id => [id, $(id).value])), rows: getRows() };
}

function displayInvoice(payload = {}) {
  ids.forEach(id => { $(id).value = payload[id] ?? ''; });
  if (payload.reverse == null) $('reverse').value = 'No';
  if (payload.date == null) {
    const now = new Date();
    $('date').value = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')].join('-');
  }
  $('items').replaceChildren();
  (payload.rows ?? [{}]).forEach(addRow);
  calculate();
}

function queueDraftSave() {
  dirty = true;
  if (current?.status === 'saved') {
    status('Unsaved changes. Click Save Invoice to update.');
    return;
  }
  if (busy || conflict) return;
  status('Changes waiting to sync…');
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      if (!busy) await flushDraft();
    } catch (error) {
      report(error);
    }
  }, 650);
}

async function writeInvoice(state) {
  const payload = formData();
  const number = payload.invoice.trim();
  if (state === 'saved' && !number) throw new Error('Enter an invoice number before saving.');
  payload.invoice = number;
  const previous = current;
  const id = previous?.id ?? crypto.randomUUID();
  const revision = crypto.randomUUID();
  const fields = {
    revision, number, status: state, customer: payload.customer.trim(),
    payload, updated_at: new Date().toISOString()
  };

  dirty = false;
  status('Syncing to Supabase…');
  try {
    const request = previous
      ? table().update(fields).eq('id', id).eq('revision', previous.revision)
      : table().insert({ id, ...fields });
    const row = checked(await request.select('id,revision,status').maybeSingle());
    if (!row) {
      conflict = true;
      throw new Error('This bill changed on another device. Reopen it from the list to load the latest copy.');
    }
    current = row;
    status(state === 'draft' ? 'Draft synced to Supabase.' : 'Invoice saved to Supabase.');
  } catch (error) {
    dirty = true;
    throw error;
  }
}

async function flushDraft() {
  clearTimeout(timer);
  if (pendingWrite) await pendingWrite;
  if (!dirty || current?.status === 'saved' || conflict) return;
  const isNew = !current;
  pendingWrite = writeInvoice('draft');
  try {
    await pendingWrite;
  } finally {
    pendingWrite = null;
  }
  if (isNew && !busy) {
      try {
        await refreshList();
      } catch (error) {
        status('Draft synced. Use Saved Invoices to retry loading the list.');
      }
  }
}

async function runAction(action) {
  if (busy) return;
  busy = true;
  const controls = document.querySelectorAll('.toolbar button, .wrap');
  controls.forEach(element => { element.inert = true; });
  try {
    await action();
  } catch (error) {
    report(error);
  } finally {
    controls.forEach(element => { element.inert = false; });
    busy = false;
  }
}

async function beforeSwitch() {
  if (conflict) return confirm('Discard your unsynced changes and open another bill?');
  if (dirty && current?.status === 'saved') {
    return confirm('Discard unsaved changes to this invoice?');
  }
  await flushDraft();
  return true;
}

function startNewInvoice() {
  return runAction(async () => {
    if (!await beforeSwitch()) return;
    current = null;
    dirty = false;
    conflict = false;
    displayInvoice();
    status('New invoice ready.');
    await refreshList();
  });
}

function saveInvoice() {
  return runAction(async () => {
    clearTimeout(timer);
    if (pendingWrite) await pendingWrite;
    if (conflict) throw new Error('Reopen this invoice to load the latest copy before saving.');
    await writeInvoice('saved');
    await refreshList();
  });
}

async function readAll(columns) {
  const rows = [];
  let cursor;
  for (;;) {
    let query = table().select(columns).order('id').limit(100);
    if (cursor) query = query.gt('id', cursor);
    const page = checked(await query);
    if (!page.length) return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    rows.push(...page);
    cursor = page.at(-1).id;
  }
}

async function refreshList() {
  const rows = await readAll('id,number,customer,status,updated_at');
  const list = $('savedList');
  list.replaceChildren();
  for (const [state, label] of [['draft', 'Pending Drafts'], ['saved', 'Saved Invoices']]) {
    const heading = document.createElement('p');
    heading.textContent = label;
    list.append(heading);
    const section = rows.filter(row => row.status === state);
    if (!section.length) {
      const empty = document.createElement('p');
      empty.textContent = state === 'draft' ? 'No pending drafts.' : 'No saved invoices.';
      list.append(empty);
    }
    for (const row of section) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = [row.number || 'Untitled draft', row.customer].filter(Boolean).join(' — ');
      button.addEventListener('click', () => openInvoice(row.id));
      list.append(button);
    }
  }
}

function loadList() {
  return runAction(async () => {
    await flushDraft();
    await refreshList();
  });
}

function openInvoice(id) {
  return runAction(async () => {
    if (!await beforeSwitch()) return;
    const { payload, ...row } = checked(await table()
      .select('id,revision,status,payload').eq('id', id).single());
    displayInvoice(payload);
    current = row;
    dirty = false;
    conflict = false;
    status(row.status === 'draft' ? 'Draft opened.' : 'Invoice opened.');
    window.scrollTo(0, 0);
  });
}

function exportInvoices() {
  return runAction(async () => {
    await flushDraft();
    const invoices = await readAll('id,number,customer,status,payload,updated_at');
    const blob = new Blob([JSON.stringify({ format: BACKUP_FORMAT, invoices }, null, 2)],
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'almumin-cloud-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('Backup downloaded.');
  });
}

function importInvoices(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  return runAction(async () => {
    await flushDraft();
    const backup = JSON.parse(await file.text());
    if (!['almumin-browser-invoices-v1', 'almumin-cloud-invoices-v1', BACKUP_FORMAT].includes(backup?.format) ||
        !Array.isArray(backup.invoices)) throw new Error('Choose an AL-MUMIN backup JSON file.');
    const records = backup.invoices.map((entry, index) => {
      const payload = entry?.payload;
      if (!payload || !Array.isArray(payload.rows) ||
          payload.rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
        throw new Error('Invalid invoice at backup entry ' + (index + 1) + '.');
      }
      const number = String(payload.invoice ?? '').trim();
      return {
        number, customer: String(payload.customer ?? '').trim(),
        payload: { ...payload, invoice: number },
        status: backup.format === BACKUP_FORMAT && entry.status === 'draft' || !number ? 'draft' : 'saved'
      };
    });
    if (!records.length || !confirm('Import ' + records.length + ' records into the shared database?')) return;
    const result = await table().upsert(records, {
      onConflict: 'invoice_key', ignoreDuplicates: true, defaultToNull: false, count: 'exact'
    });
    checked(result);
    status(result.count == null ? 'Import complete. Existing saved invoices were kept.'
      : 'Imported ' + result.count + ' records. Skipped ' + (records.length - result.count) + ' duplicates.');
    await refreshList();
  });
}

ids.forEach(id => $(id).addEventListener('input', () => {
  calculate();
  queueDraftSave();
}));
window.addEventListener('beforeprint', calculate);
window.addEventListener('beforeunload', event => {
  if (dirty || pendingWrite) {
    event.preventDefault();
    event.returnValue = true;
  }
});
displayInvoice();
runAction(async () => {
  status('Loading cloud invoices…');
  await refreshList();
  status('Ready. New invoices sync as drafts while you type.');
});
