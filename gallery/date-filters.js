(() => {
const form=document.getElementById('dateFilters');
const from=document.getElementById('dateFrom'),to=document.getElementById('dateTo');
const status=document.getElementById('filterStatus');
const sets=[...document.querySelectorAll('section[data-date]')];
function apply(){
 const invalid=from.value&&to.value&&from.value>to.value;
 to.setCustomValidity(invalid?'End date must be on or after the start date.':'');
 if(invalid){status.textContent='Choose an end date on or after the start date.';return;}
 let count=0,images=0;
 for(const set of sets){const date=set.dataset.date;set.hidden=!!(((from.value||to.value)&&!date)||(from.value&&date<from.value)||(to.value&&date>to.value));if(!set.hidden){count++;images+=set.querySelectorAll('.grid img').length;}}
 status.textContent=(count?`Showing ${count} of ${sets.length} report sets · ${images} images`:'No reports match these dates. Try another range or reset.') + ((from.value||to.value)?' · 4 undated sets are excluded; use Show all to see them.':' · Includes 4 sets with unavailable dates.');
}
form.addEventListener('submit',e=>{e.preventDefault();apply();});
from.addEventListener('change',apply);to.addEventListener('change',apply);
form.addEventListener('reset',()=>{setTimeout(()=>{to.setCustomValidity('');apply();},0);});
form.querySelectorAll('[data-month]').forEach(b=>b.addEventListener('click',()=>{const month=b.dataset.month;from.value=month+'-01';const [y,m]=month.split('-').map(Number);to.value=month+'-'+new Date(y,m,0).getDate();apply();}));
apply();
})();
