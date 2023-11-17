const table = document.querySelector("table");
const tbody = table.tBodies[0];

function sort(comparator)
{
    Array.from(tbody.children).sort(comparator).forEach(item => tbody.appendChild(item));
}

function filter(rule)
{
    const result = Object.groupBy(tbody.children, rule);
    (result.true ?? [ ]).forEach(tr => tr.hidden = false);
    (result.false ?? [ ]).forEach(tr => tr.hidden = true);
}


const followers_sorter = document.getElementById("followers_sorter");
function followersAscComparator(a, b)
{
    const a_value = a.querySelector("[data-key='follower_count']").dataset.value;
    const b_value = b.querySelector("[data-key='follower_count']").dataset.value;
    return a_value - b_value;
}
function followersDescComparator(...args)
{
    return -followersAscComparator(...args);
}
function followersDefaultComparator(a, b)
{
    return a.dataset.index - b.dataset.index;
}
followers_sorter.addEventListener("click", ev =>
{
    followers_sorter.dataset.order ??= "default";
    switch (followers_sorter.dataset.order)
    {
        case "default":
            followers_sorter.dataset.order = "asc";
            return sort(followersAscComparator);
        case "asc":
            followers_sorter.dataset.order = "desc";
            return sort(followersDescComparator);
        case "desc":
            followers_sorter.dataset.order = "default";
            return sort(followersDefaultComparator);
    }
}, { capture: false, once: false, passive: true });


const search = document.getElementById("search");
function searchFilterRule(tr)
{
    const unique_id = tr.querySelector("[data-key='unique_id']").dataset.value;
    const tiktok_id = tr.querySelector("[data-key='tiktok_id']").dataset.value;
    return search.value.length == 0 || search.value == unique_id || search.value == tiktok_id;
}
search.addEventListener("input", filter.bind(this, searchFilterRule), { capture: false, once: false, passive: true });


const date_to = document.getElementById("date_to");
const date_from = document.getElementById("date_from");
function dateFilterRule(tr)
{
    const date = new Date(tr.querySelector("[data-key='updated']").dataset.value);
    return date > new Date(date_from.value) && date < new Date(date_to.value);
}
date_to.addEventListener("input", filter.bind(this, dateFilterRule), { capture: false, once: false, passive: true });
date_from.addEventListener("input", filter.bind(this, dateFilterRule), { capture: false, once: false, passive: true });