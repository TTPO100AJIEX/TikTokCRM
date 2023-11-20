function handleModalEvent(ev)
{
    const id = ev.currentTarget.dataset.modal;
    const modal = document.getElementById(id);
    if (!modal) return;
    let action = ev.currentTarget.dataset.modal_action ?? "toggle";
    if (action == "toggle") action = modal.open ? "close" : "show";
    switch (action)
    {
        case 'show': return modal.showModal();
        case 'close': return modal.close();
    }
}

function loadModalData(ev)
{
    let container = ev.currentTarget;
    const level = container.dataset.container_level ?? 1;
    for (let i = 0; i < level; i++) container = container.parentElement;
    const data_elements = container.querySelectorAll("[data-key][data-value]");

    const id = ev.currentTarget.dataset.modal;
    const modal = document.getElementById(id);
    const form = modal.querySelector("form");
    for (const element of [ ...data_elements, container ])
    {
        const { key, value } = element.dataset;
        if (key in form.elements) form.elements[key].value = value;
    }
}

Array.from(document.querySelectorAll("[data-modal][data-modal_filler]")).forEach(button =>
{
    button.addEventListener("click", loadModalData, { capture: false, once: false, passive: true });
});
Array.from(document.querySelectorAll("[data-modal]")).forEach(button =>
{
    button.addEventListener("click", handleModalEvent, { capture: false, once: false, passive: true });
});