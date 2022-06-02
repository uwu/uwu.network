export function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

export function setContainerContent(name, content) {
    const container = document.getElementById(name);

    container.innerHTML = content;
}

export function writeContainerContent(name, content) {
    const container = document.getElementById(name);

    container.innerHTML = container.innerHTML + content;
}