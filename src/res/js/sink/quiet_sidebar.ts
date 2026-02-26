// my own custom impl inspired by
// https://thirty-five.com/overengineered-anchoring

// find elements
const sidenav = document.getElementById("sidenav");

const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];

const main = document.getElementsByTagName("main")[0];

const scroller = main.parentElement?.parentElement!;

const scrollerParent = scroller.parentElement!;

// find all headings and stuff

const scrollTriggers: [number, Element, HTMLElement][] = [];

const TRIGGER_FR_START = 0.2; // fraction of screen height
const TRIGGER_FR_END = 0.8;

for (const heading of headings) {
	const sidebarLink = sidenav?.querySelector(`a[href="#${heading.id}"]`)?.parentElement;

	if (!sidebarLink) continue;

	scrollTriggers.push([(heading as HTMLElement).offsetTop, sidebarLink, heading as HTMLElement]);
}

window.addEventListener("resize", () => {
	for (let trigger of scrollTriggers) {
		trigger[0] = trigger[2].offsetTop;
	}
});


// scroll listener
let ACTIVE_LINK: Element | undefined;

function updateLinks() {
	const innerContentHeight = main.clientHeight;
	const outerHeight = scrollerParent.clientHeight;

	const scrollFraction = (scroller.scrollTop + (outerHeight / 2)) / innerContentHeight;

	// TODO: making this something other than a lerp could make a nicer experience
	// lerp from TRIGGER_FR_START to TRIGGER_FR_END
	const adjustedOffsetFrac = (1 - scrollFraction) * TRIGGER_FR_START + scrollFraction * TRIGGER_FR_END;

	let debugLine = document.querySelector("#debug-line")  as HTMLElement;
	if (debugLine) debugLine.style.top = 100 * adjustedOffsetFrac + "vh";

	const scrollPos = scroller.scrollTop + (adjustedOffsetFrac * outerHeight);

	// find trigger
	let currentTrigger: Element | undefined;

	for (const [trigger, el] of scrollTriggers) if (trigger <= scrollPos) {
		currentTrigger = el;
	}

	if (currentTrigger && currentTrigger !== ACTIVE_LINK) {
		ACTIVE_LINK?.classList.remove("active");
		ACTIVE_LINK = currentTrigger;
		currentTrigger.classList.add("active");
		currentTrigger.scrollIntoView({behavior: "smooth", block: "nearest"})
	}
}
updateLinks();

scroller.addEventListener("scroll", updateLinks);

// for a little bit of class, add a nice smooth animation to clicking the left links
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
	for (let [, sidebarItem] of scrollTriggers) {
		const anchor = sidebarItem.firstElementChild as HTMLAnchorElement;
		anchor?.addEventListener("click", (ev) => {
			ev.preventDefault();
			// set URL without invoking a scroll
			history.replaceState({}, '', anchor.href);

			// do scroll ourselves
			const hash = new URL(anchor.href).hash;
			document.querySelector(hash)?.scrollIntoView({ block: "start", behavior: "smooth" });
		})
	}