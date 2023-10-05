/* 
    https://codepen.io/arickle/pen/XKjMZY
*/

export default function rainmaker() {
    // DOM elements
    const rainRoot = document.querySelector(".rain");
    const rainFrontRow = document.querySelector(".rain.front-row");
    const rainBackRow = document.querySelector(".rain.back-row");

    // Clear out the rain root
    rainRoot.innerHTML = "";

    // Variables
    let increment = 0;
    let drops = "";
    let backDrops = "";

    while(increment < 100) {
        // Random numbers for CSS vars
        const randomHundred = (Math.floor(Math.random() * (98 - 1 + 1) + 1));
        const randomFiver = (Math.floor(Math.random() * (5 - 2 + 1) + 2));

        // Bump the increment
        increment += randomFiver;

        // Add drops to back and front row
        drops += `<div class="drop" style="left: ${increment}%; bottom: ${(randomFiver * 2) + 100}%; animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"><div class="stem" style="animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"></div><div class="splat" style="animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"></div></div>`;
        backDrops += `<div class="drop" style="right: ${increment}%; bottom: ${(randomFiver * 2) + 100}%; animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"><div class="stem" style="animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"></div><div class="splat" style="animation-delay: 0.${randomHundred}s; animation-duration: 0.5${randomHundred}s;"></div></div>`;
    }

    // Append
    rainFrontRow.innerHTML += drops;
    rainBackRow.innerHTML += backDrops;
}