<template>
  <NuxtLayout>
    <noscript>
      <div
      style="
      font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.5;
      "
      >
      <h1>EJ Fox</h1>
      <p>Hacker, Journalist, Data Visualization Specialist</p>

      <h2>Navigation</h2>
      <ul>
      <li>
      <a href="/projects">Projects</a> - Interactive data visualization
      work, journalism projects
      </li>
      <li>
      <a href="/blog">Blog</a> - Technical writing, tutorials, week notes
      </li>
      <li>
      <a href="/gear">Gear</a> - Complete inventory with weights, specs,
      and TCWM scoring
      </li>
      <li>
      <a href="/stats">Stats</a> - Personal metrics: GitHub, health,
      chess, typing, music
      </li>
      <li>
      <a href="https://ejfox.photos">Photos</a> - Photography portfolio
      (external)
      </li>
      <li>
      <a href="https://archive.ejfox.com">Archive</a> - Historical work
      (external)
      </li>
      </ul>

      <h2>Recent Work</h2>
      <ul>
      <li>Interactive news graphics and data visualizations</li>
      <li>Personal quantified self tracking systems</li>
      <li>Open source journalism tools</li>
      <li>Technical documentation and tutorials</li>
      </ul>

      <h2>Contact</h2>
      <ul>
      <li>Email: <a href="mailto:ejfox@ejfox.com">ejfox@ejfox.com</a></li>
      <li>
      GitHub: <a href="https://github.com/ejfox">github.com/ejfox</a>
      </li>
      <li>PGP: E207 8E65 3FE3 89CD (<a href="/pgp.txt">full key</a>)</li>
      </ul>

      <p>
      <em>Note: This site uses JavaScript for enhanced interactivity.</em>
      </p>
      </div>
    </noscript>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// Inline critical CSS + prevent dark mode flash
useHead({
  style: [
    {
      innerHTML: `
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Georgia,serif;line-height:1.6;color:#18181b;background:#fff}
        @media(prefers-color-scheme:dark){body{color:#fafafa;background:#18181b}}
        main{padding:1rem;max-width:48rem;margin:0 auto}
        @media(min-width:768px){main{padding:2rem}}
        h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
        p{margin:1rem 0}
        a{color:inherit;text-decoration:underline}
        #app{min-height:100vh}
      `,
      tagPosition: 'head'
    }
  ],
  script: [
    {
      innerHTML: `
        (function() {
          const isDark = localStorage.getItem('vueuse-color-scheme') === 'dark' || 
            (!localStorage.getItem('vueuse-color-scheme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
          if (isDark) document.documentElement.classList.add('dark');
        })()
      `,
      type: 'text/javascript',
      tagPosition: 'head'
    }
  ]
})
</script>
