<template>
  <main>
    <Head>
      <Title>{{ page.title }}</Title>
      <Meta
        name="description"
        :content="page.dek ? page.dek : page.description"
      />
      <Meta property="og:title" :content="`EJ Fox: 📝 ${page.title}`" />
      <Meta
        property="og:description"
        :content="`${page.dek ? page.dek : page.description}`"
      />
      <Meta property="og:image" :content="ogImageUrl" />
      <Meta property="og:url" content="https://ejfox.com" />
      <Meta property="og:type" content="website" />

      <!-- twitter opengraph tags -->
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:site" content="@mrejfox" />
      <Meta name="twitter:creator" content="@mrejfox" />
      <Meta name="twitter:title" :content="`EJ Fox | ${page.title}`" />
      <Meta
        name="twitter:description"
        :content="`${page.dek ? page.dek : page.description}`"
      />
      <Meta name="twitter:image" :content="ogImageUrl" />
    </Head>

    <!-- <h3 class="moon-gray tracked fw1">{{page?.dek}}</h3> -->
    <!-- og image preview -->
    <!-- <img :src="ogImageUrl" /> -->

    <div class="f4 near-black">
      <ContentDoc v-slot="{ doc }" :head="false">
        <div class="page-metadata pt4 pt6-l ml2 ml6-l">
          <div class="db moon-gray fw1 f6 pv2">
            <span class="mr4 word-nowrap dib gray">
              <Icon name="ant-design:calendar-outlined" class="mr1 f6 pb1" />
              {{ formatBlogDate(new Date(doc.date)) }}
            </span>
            <span class="mr4 word-nowrap dib" v-if="doc.readingTime.words > 100">
              <Icon name="bi:card-text" class="mr1 f6 pb1" />
              {{ doc.readingTime.words }} words
            </span>
            <span class="mr4 word-nowrap dib">
              <Icon name="bi:clock-history" class="mr1 f6 pb1" />
              {{ doc.readingTime.text }}
            </span>
            <span class="mr4 word-nowrap dib" v-if="countPhotos(doc) > 0">
              <Icon name="ant-design:camera-filled" class="mr1 f6 pb1" />
              {{ countPhotos(doc) }} photos
            </span>

            <span class="mr4 word-nowrap dib" v-if="countLinks(doc) > 0">
              <Icon name="bi:link" class="mr1 f6 pb1" />
              {{ countLinks(doc) }} links
            </span>
          </div>
          <div
            class="strong-tags f7 fw1 moon-gray mv1 i"
            v-if="filterStrongTags(doc).length > 0"
          >
            Highlights:
            <span
              v-for="tag in filterStrongTags(doc)"
              :key="tag"
              class="tag dib mr2 mb2 ph1 pv1 bg-near-white"
              >{{ tag }}</span
            >
          </div>
        </div>
        <ContentRenderer :value="doc" class="" />
      </ContentDoc>
    </div>

    <div class="cf pv5">
      <NuxtLink
        v-if="prev"
        :to="prev._path"
        class="pr2 w-40 w-20-ns link gray db absolute left-2 lh-title"
      >
        <span class="dib">&#8592;</span>
        {{ prev.title }}
        <div class="moon-gray f6 fw1">
          {{ formatDate(new Date(prev.date)) }}
        </div>
        <!-- <p class="moon-gray fw1 f6 mv0">{{ countWords(prev) }} words</p> -->
      </NuxtLink>

      <NuxtLink
        v-if="next"
        :to="next._path"
        class="pl2 w-40 w-20-ns link gray db absolute right-2 lh-title tr"
      >
        {{ next.title }}
        <span class="dib">&#8594;</span>
        <div class="moon-gray f6 fw1 tr">
          {{ formatDate(new Date(next.date)) }}
        </div>
        <!-- <p class="moon-gray fw1 f6 mv0 tr">{{ countWords(next) }} words</p> -->
      </NuxtLink>
    </div>
  </main>
</template>
<script setup>
import { timeFormat } from "d3-time-format";
import {
  countWords,
  countPhotos,
  countLinks,
  filterStrongTags,
} from "~~/helpers";

// TODO: Fix this so it only pulls out things from the current category
// ie if slug[0] is 'blog' then only pull out blog posts

// get slug from the route
const { params } = useRoute();

const { prev, next, toc, page, excerpt } = useContent();
const formatDate = timeFormat("%B %Y");

// const formatBlogDate = timeFormat('%B %d, %Y')
// YYYY-MM-DD format
const formatBlogDate = timeFormat("%Y-%m-%d");
const ogImageFontsize = computed(() => {
  const titleLength = page.value.title.length;

  // if title is less than 20 characters, use 100px font size
  if (titleLength < 24) {
    return 112;
  } else {
    return 72;
  }
});

const ogImageUrl = computed(() => {
  // template URL https://res.cloudinary.com/ejf/image/upload/g_north_west,co_rgb:fff,x_440,y_240,w_290,h_170,c_fit,l_text:FjallaOne-Regular.ttf_72:Ready%20to%20party/templates/og-image-generated-bg.png

  const title = page.value.title.toUpperCase();
  const urlEncodedTitle = encodeURIComponent(title);

  const bgImg = "templates/og-image-generated-bg.png";

  // there are two different ogImageUrl schemes
  // if the post has a cloudinary photo, we will use the first one as the background image
  // otherwise we will use our template
  const pageElements = page.value?.body?.children;

  // a pageElement looks like this
  //   {
  //     "type": "element",
  //     "tag": "img",
  //     "props": {
  //         "src": "https://res.cloudinary.com/ejf/image/upload/v1544846833/20180509-DSCF9221.jpg"
  //     },
  //     "children": []
  // }

  const cloudinaryPhoto = pageElements?.find((el) =>
    el?.props?.src?.includes("cloudinary")
  );

  // extract the cloudinaryPhoto ID from the URL
  // a URL looks like this
  // https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1600/v1544846833/20180509-DSCF9221.jpg
  // and an ID looks like this
  // v1544846833/20180509-DSCF9221.jpg
  // so if we split by / we need the last 2 values
  const cloudinaryPhotoId = cloudinaryPhoto?.props?.src
    ?.split("/")
    .slice(-2)
    .join("/");

  if (cloudinaryPhoto) {
    // the cloudinaryPhotoId photo can be any size or aspect ratio, so we need to transform it to fit our template
    // we do this by using the cloudinary image transformation API
    // https://cloudinary.com/documentation/image_transformations
    // we use the 'fill' transformation to fill the template with the photo
    // we use the 'crop' transformation to crop the photo to the template aspect ratio
    // we use the 'gravity' transformation to position the photo in the template
    // we use the 'scale' transformation to scale the photo to the template size

    const url = `https://res.cloudinary.com/ejf/image/upload/dpr_2.0,c_fill,g_auto,w_1200/fl_progressive:semi,c_fill,h_630,g_auto/dpr_2.0,co_rgb:FFF,fl_region_relative,w_0.5,l_text:FjallaOne-Regular.ttf_92:${urlEncodedTitle}/${cloudinaryPhotoId}`;
    return url;
  } else {
    const url = `https://res.cloudinary.com/ejf/image/upload/g_north_west,co_rgb:fff,x_440,y_200,w_690,h_320,c_fit,l_text:FjallaOne-Regular.ttf_${ogImageFontsize.value}:${urlEncodedTitle}/${bgImg}`;
    return url;
  }
});
</script>
<style>
strong {
  color: red;
}
</style>
