function showEditEmployee(ev)
{
    const tr = ev.currentTarget.parentElement.parentElement;
    const id = tr.dataset.value;
    const login = tr.children[0].children[0].dataset.value;
    const access = tr.children[1].dataset.value;
    const responsibility = tr.children[2].dataset.value;

    const form = document.getElementById("edit_employee").children[1];
    form.elements.id.value = id;
    form.elements.login.value = login;
    form.elements.access.value = access;
    form.elements.responsibility.value = responsibility;
}

Array.from(document.querySelectorAll("[data-modal='edit_employee'][data-modal_action='show']")).forEach(button =>
{
    button.addEventListener("click", showEditEmployee, { capture: false, once: false, passive: true });
});