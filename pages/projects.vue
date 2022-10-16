<script setup lang="ts">
const { data } = await useAsyncData('projects', () => queryContent('/projects').findOne())
</script>
<template>
  <main class="">
    <Nav />
    <table class="w-100 collapse f3">
      <!-- projects have Client, Project Name, Role, Year, and URL-->
      <tr class="">
        <th class="bb bw1 b--gray dn dtc-ns"><span class="gray">Client</span></th>
        <th class="bb bw1 b--gray">Project Name</th>
        <th class="bb bw1 b--gray dn dtc-ns gray">Role</th>
        <th class="bb bw1 b--gray dn dtc-ns gray">Year</th>
      </tr>
      <tr v-for="project in data.body" :key="project.name" class="stripe-dark">
        <td class="dn dtc-ns f5 v-top w-10 gray">{{ project.Client }}</td>
        <td class="dtc measure-narrow center">
          <a :href="project.URL" class="link b black dim db pv5 tc f1 f-subheadline-l lh-solid headline-sans-serif ttu tracked-tight">{{ project['Project Name'] }}</a>
          </td>
        <td class="f5 v-top w-10 gray">{{ project.Role }}</td>
        <td class="dn dtc-ns f5 v-top w-10 gray">{{ project.Year }}</td>

      </tr>
    </table>
  </main>
</template>
<style scoped>
/* table {
  border-collapse: collapse;
} */
tr {
  border-bottom: 1px solid rgba(0,0,0,.15);
}
th, td {
  text-align: left;
  padding: 4px;
}
.stripe-dark:nth-child(odd) {
    background-color: rgba(0,0,0,.1);
}

.headline-sans-serif {
  font-family: 'Staatliches', 'Helvetica Neue', 'Helvetica', sans-serif !important;
  /* font-weight: 400; */
  /* font-family: 'Paytone One', sans-serif; */
  /* font-family: 'Fjalla One', sans-serif !important; */
  /* font-weight: 400; */
  font-weight: 800;
}
</style>