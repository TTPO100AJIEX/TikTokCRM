const table = document.querySelector("table");
const tbody = table.tBodies[0];

const followers_sorter = document.getElementById("followers_sorter");
followers_sorter.addEventListener("click", ev =>
{
    followers_sorter.dataset.order ??= "default";
    switch (followers_sorter.dataset.order)
    {
        case "default": followers_sorter.dataset.order = "d"
    }
    function comparator(a, b)
    {
        const a_value = a.querySelector("[data-key='follower_count']").dataset.value;
        const b_value = b.querySelector("[data-key='follower_count']").dataset.value;
        return a_value - b_value;
    }
    Array.from(tbody.children).sort(comparator).forEach(item => tbody.appendChild(item));
}, { capture: false, once: false, passive: true });


const search = document.getElementById("search");
function searchFilter(tr)
{
    const unique_id = tr.querySelector("[data-key='uniqueId']").dataset.value;
    const tiktok_id = tr.querySelector("[data-key='tiktok_id']").dataset.value;
    return search.value.length == 0 || search.value == unique_id || search.value == tiktok_id;
}
search.addEventListener("input", ev =>
{
    const result = Object.groupBy(tbody.children, searchFilter);
    (result.false ?? [ ]).forEach(tr => tr.hidden = true);
    (result.true ?? [ ]).forEach(tr => tr.hidden = false);
}, { capture: false, once: false, passive: true });

/*
Меню выбора даты “от” и “до”, фильтрует стримеров по дате последнего изменения.
Стрелочка около столбца “подписчики” - сортировка по числу подписчиков
    по убыванию,
    по возрастанию,
    по умолчанию (в случайном порядке как было первоначально до применения фильтра).
*/