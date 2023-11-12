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

Array.from(document.querySelectorAll("[data-modal]")).forEach(button =>
{
    button.addEventListener("click", handleModalEvent, { capture: false, once: false, passive: true });
});