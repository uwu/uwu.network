<script setup>
defineProps({
  caretClass: String,
  value: String,
  hideCaret: Boolean
})
</script>

<template>
  <div class="flex justify-between">
    <div>
      creatable@<span class="underline">home</span>>{{ value
      }}<span v-if="!hideCaret" class="term-caret font-bold">_</span>
    </div>
    <div class="text-green-400">~</div>
  </div>
</template>
