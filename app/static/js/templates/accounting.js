const table = document.querySelector("table");
const colgroup = table.querySelector("colgroup");

function filter(rule)
{
    const result = Object.groupBy(colgroup.children, rule);
    (result.true ?? [ ]).forEach(col => col.style.visibility = "visible");
    (result.false ?? [ ]).forEach(col => col.style.visibility = "collapse");
}


const date_to = document.getElementById("date_to");
const date_from = document.getElementById("date_from");
function dateFilterRule(col)
{
    const date = new Date(col.dataset.value);
    if (!col.dataset.value || !date_from.value || !date_to.value) return true;
    return date >= new Date(date_from.value) && date < new Date(date_to.value);
}
date_to.addEventListener("input", filter.bind(this, dateFilterRule), { capture: false, once: false, passive: true });
date_from.addEventListener("input", filter.bind(this, dateFilterRule), { capture: false, once: false, passive: true });