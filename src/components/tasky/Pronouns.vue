<script setup lang="ts">
// I think this is funny if you spam it
import { ref } from "vue";
const pronounsList = [
  "she",
  "her",
  "hers",
  "herself",

  "hereditary",
  "heretic",
  "hertz",
  "hermit",
  "hermetically sealed",
  "herb",

  "she",
  "sheaf",
  "shell",
  "sherbert",
  "sherlock",
  "shelldrake",
  "sheep herder",
  "shadow",
  "shamrock",
] as const;

const punctuationMark = [
  ".",
  ".",
  ".",
  "…",
  "!",
  ".",
  "?",
  "‽",
];

const pronouns = ref<Array<typeof pronounsList[number]>>([pronounsList[0]]);

function inc() {
  pronouns.value = [
    ...pronouns.value,
    pronounsList[pronouns.value.length % pronounsList.length],
  ];
}
</script>

<template>
  <span
    class="pronoun"
    :class="{ single: pronouns.length <= 1 }"
    @click="inc"
  >
    {{ pronouns.join(" / ") }}{{
      punctuationMark[pronouns.length % punctuationMark.length]
    }}
  </span>
</template>

<style scoped>
.pronoun {
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
</style>
