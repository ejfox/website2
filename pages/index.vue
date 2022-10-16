<template>
  <section class="db cf mb4">
    <Nav />
    <section class="intro pv2 lh-copy f4 measure-wide">
      <ContentDoc />
    </section>

    <div id="hcard-EJ-Fox" class="vcard w-100 f6 tc dn">
      <img
        src="https://gravatar.com/avatar/4a503ee102c67cc632d77f97721d83f7"
        alt="Gravatar photo of EJ Fox"
        class="photo dn"
      />
      <div><a class="url fn db" href="https://ejfox.com">EJ Fox</a></div>
      <a class="email db" href="mailto:ejfox@ejfox.com">ejfox@ejfox.com</a>
      <div class="adr">
        <span class="locality">Beacon</span>,
        <span class="region">New York</span>

        <div class="country-name ml1 b">United States</div>
      </div>

      <div class="tel sans-serif">(260) 673-5369</div>
    </div>
  </section>
</template>

<style scoped>
ul {
  padding: 0;
}
/* li { list-style-type: none } */

.intro a:link,
.intro a:hover {
  color: black;
  text-decoration: underline;
}

.intro a:visited,
.intro a:focus {
  color: #414346;
  /*text-decoration: none;*/
}
</style>
