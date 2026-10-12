<!--
  @file AuthorLine.vue
  @description Quiet "who wrote this" block at the end of long posts: EJ's name,
  the first sentence of his own profile text (public/resume.json basics.summary,
  verbatim; don't rewrite it here) and two links. Umami tracks the links via
  data-umami-event="author-line".
-->
<template>
  <aside
    class="author-line mt-12 max-w-prose border-t border-zinc-200 dark:border-zinc-800 pt-6"
  >
    <p class="font-mono text-2xs uppercase tracking-wider text-zinc-500 mb-1">
      EJ Fox
    </p>
    <p class="font-serif text-sm text-zinc-700 dark:text-zinc-300 mb-3">
      Design engineer and creative technologist who ships under pressure.
    </p>
    <p class="font-mono text-xs flex gap-4">
      <a
        href="/projects"
        class="underline underline-offset-2 hover:no-underline"
        data-umami-event="author-line"
        data-umami-event-to="projects"
      >
        Projects
      </a>
      <a
        href="/consulting"
        class="underline underline-offset-2 hover:no-underline"
        data-umami-event="author-line"
        data-umami-event-to="consulting"
      >
        Work with me
      </a>
    </p>
  </aside>
</template>
