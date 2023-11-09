const form = document.getElementById("login_form");

function setInvalid()
{
    form.elements.login.style.border = "thin solid var(--color-red)";
    form.elements.password.style.border = "thin solid var(--color-red)";
}

function setValid()
{
    form.elements.login.style.border = null;
    form.elements.password.style.border = null;
}

async function validate()
{
    if (!form.checkValidity()) return setInvalid();
    const url = new URL("/validate", location.origin);
    url.searchParams.set("login", form.elements.login.value);
    url.searchParams.set("password", form.elements.password.value);
    const response = await fetch(url, { method: "GET" });
    const { valid } = await response.json();
    if (!valid) return setInvalid();
    return setValid();
}

form.elements.login.addEventListener("input", validate, { capture: false, once: false, passive: true });
form.elements.password.addEventListener("input", validate, { capture: false, once: false, passive: true });