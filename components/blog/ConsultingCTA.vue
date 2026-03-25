<template>
  <div class="consulting-cta">
    <p class="cta-body">
      The world is editable. I ship fast, bend computers toward good
      problems, and help teams who have a hunch something could be
      better &mdash; napkin sketch to working prototype, usually before
      the week is out.
      <NuxtLink to="/consulting" class="cta-link">
        Let's build something<span class="cta-arrow">&hairsp;&rarr;</span>
      </NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.consulting-cta {
  @apply px-4 md:px-6 py-8;
  @apply border-t border-zinc-200 dark:border-zinc-800;
}

.cta-body {
  @apply font-serif text-sm text-zinc-500 dark:text-zinc-400
         max-w-prose leading-relaxed;
}

.cta-link {
  @apply font-serif text-zinc-800 dark:text-zinc-200
         no-underline whitespace-nowrap;
  border-bottom: 1px solid currentColor;
  padding-bottom: 1px;
  transition: border-color 0.2s, color 0.2s;
}

.cta-link:hover {
  @apply text-zinc-600 dark:text-zinc-400;
  border-bottom-color: transparent;
}

.cta-arrow {
  @apply inline-block transition-transform duration-200;
}

.cta-link:hover .cta-arrow {
  transform: translateX(3px);
}
</style>
