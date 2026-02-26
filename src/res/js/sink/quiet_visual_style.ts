import stylesheet from "^css/quiet_ysnk.sass?inline";

const pref = localStorage.getItem("quiet_system_light");

const styleElemTemplate = document.createElement("style");
styleElemTemplate.append(new Text(stylesheet));

let styleElem: undefined | HTMLStyleElement;

let overriding = false;

const lightButtons: HTMLButtonElement[] = [];
const darkButtons: HTMLButtonElement[] = [];

const set = (override: boolean) => {
	if (overriding && !override) {
		// use uwunet style
		styleElem?.remove();
		styleElem = undefined;

		lightButtons.forEach(b => b.classList.remove("active"));
		darkButtons.forEach(b => b.classList.add("active"));
	}
	if (!overriding && override) {
		// use ysnk style
		styleElem = styleElemTemplate.cloneNode(true) as HTMLStyleElement;
		document.head.append(styleElem);
		lightButtons.forEach(b => b.classList.add("active"));
		darkButtons.forEach(b => b.classList.remove("active"));
	}

	overriding = override;

	localStorage.setItem("quiet_system_light", override ? "yes" : "no");
};

function registerBtn(btn: HTMLButtonElement, isLight: boolean) {
	btn?.addEventListener("click", () => set(isLight));
	(isLight ? lightButtons : darkButtons).push(btn);
}

document.querySelectorAll(".btn-uwunet").forEach(b => registerBtn(b as HTMLButtonElement, false));
document.querySelectorAll(".btn-ysnk").forEach(b => registerBtn(b as HTMLButtonElement, true));

if (pref === "yes") set(true);