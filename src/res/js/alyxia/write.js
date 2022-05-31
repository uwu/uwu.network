export function write(element) {
  var text = element.innerHTML;
  var i = 1;

  var toot = setInterval(function () {
    element.innerHTML = text.substring(0, i);
    i += 1;
    if (i > text.length) {
      clearInterval(toot);
      element.innerHTML = text;
    }
  }, 100);
}
