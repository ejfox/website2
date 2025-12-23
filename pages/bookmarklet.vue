<template>
  <div class="max-w-2xl mx-auto px-4 py-12">
    <header class="mb-12">
      <h1 class="font-serif text-3xl mb-2">Pinboard Bookmarklet</h1>
      <p class="text-zinc-600 dark:text-zinc-400">
        Save to Pinboard instantly, get smart tag suggestions after.
      </p>
    </header>

    <section class="mb-12">
      <label
        class="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3"
      >
        Passphrase
      </label>
      <div class="relative">
        <input
          v-model="passphrase"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your secret passphrase"
          class="w-full px-4 py-3 font-mono text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 focus:border-transparent transition-all duration-200"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs font-mono uppercase tracking-wider transition-colors"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>
      <p class="text-xs text-zinc-500 mt-2 font-mono">
        Embedded in the bookmarklet for authentication.
      </p>
    </section>

    <section class="mb-12">
      <a
        :href="bookmarkletCode"
        class="inline-flex items-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-sm font-mono rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-[0.98] transition-all duration-200"
        :class="{ 'opacity-40 pointer-events-none': !passphrase }"
        @click.prevent
      >
        <span class="text-base">+</span>
        Pin to Pinboard
      </a>
      <span class="text-sm text-zinc-500 ml-4 font-mono">
        {{ passphrase ? 'Drag to bookmarks bar' : 'Enter passphrase first' }}
      </span>
    </section>

    <section class="mb-12 space-y-2">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="flex items-start gap-3 text-sm"
      >
        <span class="font-mono text-zinc-400 tabular-nums">{{ i + 1 }}.</span>
        <span class="text-zinc-600 dark:text-zinc-400">{{ step }}</span>
      </div>
    </section>

    <details class="group">
      <summary
        class="cursor-pointer text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        Manual installation
      </summary>
      <div class="mt-4">
        <pre
          class="bg-zinc-900 dark:bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-zinc-800"
        ><code>{{ bookmarkletCode }}</code></pre>
        <button
          class="mt-3 px-3 py-1.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          @click="copyCode"
        >
          {{ copied ? 'Copied' : 'Copy code' }}
        </button>
      </div>
    </details>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'bookmarklet',
})

const copied = ref(false)
const passphrase = ref('')
const showPassword = ref(false)

const steps = [
  'Saves to Pinboard immediately',
  'Analyzes page content in background',
  'Suggests tags from your existing bookmarks',
  'One click to update with better tags',
]

const bookmarkletCode = computed(() => {
  if (!passphrase.value) return '#'

  const windowOpts =
    'toolbar=no,location=no,directories=no,status=no,menubar=no,' +
    'scrollbars=yes,resizable=yes,width=800,height=700'

  return `javascript:(function(){
  var d=document,w=window,e=w.getSelection,k=d.getSelection,x=d.selection,
  s=(e?e():(k)?k():(x?x.createRange().text:'')),
  l=d.location.href,
  bodyText=d.body.innerText||d.body.textContent||'',
  truncatedText=bodyText.substring(0,5000);

  if(l.indexOf('http')!==0){
    alert('This bookmarklet only works on web pages!');
    return;
  }

  var popupUrl='https://ejfox.com/bookmarklet-popup?'+
    'url='+encodeURIComponent(l)+
    '&title='+encodeURIComponent(d.title)+
    '&text='+encodeURIComponent(truncatedText)+
    '&auth='+encodeURIComponent('${passphrase.value}');

  if(s)popupUrl+='&description='+encodeURIComponent(s);

  var popup=w.open(popupUrl,'pinboard_enhanced','${windowOpts}');

  if(popup)popup.focus();
  else alert('Popup blocked! Please allow popups for this site.');
})();`.replace(/\n\s*/g, '')
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(bookmarkletCode.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

usePageSeo({
  title: 'Pinboard Bookmarklet',
  description: 'Save to Pinboard instantly with smart tag suggestions.',
  type: 'website',
  section: 'Tools',
  tags: ['Bookmarklet', 'Pinboard', 'Tagging'],
})
</script>
