<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-4xl font-bold mb-8">Enhanced Pinboard Bookmarklet</h1>
    
    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold mb-4">Installation</h2>
      
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Your Passphrase (Required)</label>
        <input 
          v-model="passphrase" 
          type="password"
          placeholder="Enter your secret passphrase"
          class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
          This will be embedded in your bookmarklet for authentication
        </p>
      </div>
      
      <p class="mb-4">Drag this button to your bookmarks bar:</p>
      
      <div class="flex items-center gap-4 mb-6">
        <a 
          :href="bookmarkletCode"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors cursor-move"
          :class="{ 'opacity-50 cursor-not-allowed': !passphrase }"
          @click.prevent="!passphrase ? null : showInstructions = true"
        >
          📌 Pin to Pinboard+
        </a>
        
        <span v-if="passphrase" class="text-sm text-gray-600 dark:text-gray-400">← Drag me!</span>
        <span v-else class="text-sm text-red-600 dark:text-red-400">← Enter passphrase first</span>
      </div>
      
      <div v-if="showInstructions" class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
        <p class="text-sm">
          <strong>Can't drag?</strong> Right-click the button and select "Bookmark This Link" or manually create a bookmark with the code below.
        </p>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-8 mb-8">
      <div>
        <h3 class="text-xl font-semibold mb-3">How it works</h3>
        <ol class="space-y-2 text-sm">
          <li class="flex gap-2">
            <span class="font-bold">1.</span>
            <span>Saves to Pinboard immediately (no delay!)</span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">2.</span>
            <span>Analyzes page content in the background</span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">3.</span>
            <span>Shows tag suggestions based on your bookmarks</span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">4.</span>
            <span>One click to update with better tags</span>
          </li>
        </ol>
      </div>
      
      <div>
        <h3 class="text-xl font-semibold mb-3">Features</h3>
        <ul class="space-y-2 text-sm">
          <li class="flex gap-2">
            <span>✓</span>
            <span>Smart tag suggestions from similar bookmarks</span>
          </li>
          <li class="flex gap-2">
            <span>✓</span>
            <span>Shows related items you've saved before</span>
          </li>
          <li class="flex gap-2">
            <span>✓</span>
            <span>Identifies active "threads" in your collection</span>
          </li>
          <li class="flex gap-2">
            <span>✓</span>
            <span>Works exactly like regular Pinboard bookmarklet</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-8">
      <h3 class="text-xl font-semibold mb-3">Test it out</h3>
      <p class="mb-4">Try bookmarking these pages to see suggestions:</p>
      <div class="grid gap-2">
        <a href="https://www.are.na/blog/building-with-care" target="_blank" class="text-blue-600 hover:underline">
          Are.na: Building with Care
        </a>
        <a href="https://css-tricks.com/snippets/css/a-guide-to-flexbox/" target="_blank" class="text-blue-600 hover:underline">
          CSS-Tricks: A Complete Guide to Flexbox
        </a>
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" class="text-blue-600 hover:underline">
          A Classic YouTube Video
        </a>
      </div>
    </div>

    <details class="mb-8">
      <summary class="cursor-pointer font-semibold mb-2">Manual Installation (Advanced)</summary>
      <div class="mt-4">
        <p class="text-sm mb-2">Create a new bookmark with this code as the URL:</p>
        <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code class="text-xs font-mono whitespace-pre">{{ bookmarkletCode }}</code>
        </div>
        <button 
          @click="copyCode" 
          class="mt-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded"
        >
          {{ copied ? '✓ Copied!' : 'Copy Code' }}
        </button>
      </div>
    </details>

    <div class="text-sm text-gray-600 dark:text-gray-400">
      <p>Privacy: The bookmarklet only sends data to ejfox.com for analysis. Your Pinboard credentials are never touched.</p>
    </div>
  </div>
</template>

<script setup>
const showInstructions = ref(false)
const copied = ref(false)
const passphrase = ref('')

const bookmarkletCode = computed(() => {
  if (!passphrase.value) return '#'
  
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
  
  var popupUrl='http://localhost:3006/bookmarklet-popup?'+
    'url='+encodeURIComponent(l)+
    '&title='+encodeURIComponent(d.title)+
    '&text='+encodeURIComponent(truncatedText)+
    '&auth='+encodeURIComponent('${passphrase.value}');
  
  if(s)popupUrl+='&description='+encodeURIComponent(s);
  
  var popup=w.open(popupUrl,'pinboard_enhanced','toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=700');
  
  if(popup)popup.focus();
  else alert('Popup blocked! Please allow popups for this site.');
})();`.replace(/\n\s*/g, '')
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(bookmarkletCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

useSeoMeta({
  title: 'Enhanced Pinboard Bookmarklet',
  description: 'A smarter Pinboard bookmarklet that suggests tags based on your existing bookmarks',
})
</script>