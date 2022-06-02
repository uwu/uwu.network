<script setup>
import { ref, reactive } from "vue";
import TerminalPrompt from "./TerminalPrompt.vue";

let terminalLines = reactive([]);
const lineDivRef = ref(null);

let currentLine = reactive({
  input: "",
  type: "prompt",
});

terminalLines.push(currentLine);

function handleKeypress(e) {
  const { key } = e;

  switch (key) {
    case "Enter":
      currentLine.hideCaret = true;

      currentLine = reactive({
        type: "prompt",
        input: "",
      });

      terminalLines.push(currentLine);

      // stupid
      setTimeout(() => {
        lineDivRef.value.lastElementChild.scrollIntoView(false);
      });
      break;
    case "Backspace":
      currentLine.input = currentLine.input.slice(0, -1);
      break;
    default:
      if (key.length > 1) return;
      currentLine.input += key;
  }
}
</script>

<style>
@keyframes blink {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

#term:not(:focus) .term-caret {
  visibility: hidden;
}

#term:focus .term-caret {
  animation: blink 1s step-end infinite;
}
</style>

<template>
  <div
    id="term"
    class="w-full h-full outline-none"
    tabindex="0"
    ref="lineDivRef"
    @keydown="handleKeypress"
  >
    <template v-for="line in terminalLines">
      <TerminalPrompt
        v-if="line.type === 'prompt'"
        :value="line.input"
        :hideCaret="line.hideCaret"
      ></TerminalPrompt>
    </template>
  </div>
</template>
