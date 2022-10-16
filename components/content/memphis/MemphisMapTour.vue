"
<template>
  <section class="hero-map-container ba b--white bw2 bw3-l" ref="root">
    <!-- <h2 class="bg-red yellow ph2 sticky top-0 h1 f6 z-3">{{ scrollY }}</h2>
    <h2 class="bg-blue white ph2 sticky top-2 h1 f6 z-3">
      {{ containerScrollY }}
    </h2> -->
    <div id="map" class="w-100 vh-100 z-1 top-0" ref="mapRoot"></div>

    <div ref="mapText" class="map-text relative z-999 ml5-l measure">
      <!-- <p data-lat="35.08652" data-lng="-89.99542"> -->

      <!-- [-89.999185, 35.102215] -->
      <p data-lat="35.102215" data-lng="-89.999185">
        Despite the lushness, many who live and go to school here didn’t
        necessarily choose to do so, Frank impresses upon me. Like many families
        that now reside in the area surrounding the Depot, Frank is here because
        his family was displaced by multiple waves of racist government policy.
        Otherwise, Frank and his family might have been living farther from the
        Depot, closer to downtown, where his grandfather, Frank Johnson Sr.,
        once built the family a house on Porter Street.
      </p>

      <p
        data-lat="35.12587"
        data-lng="-90.0362"
        data-place-marker="true"
        data-marker-color="blue"
        data-marker-text="Frank Sr. former home"
      >
        The original structure where Frank Sr. resided with his wife, Eva, and
        their seven children is no longer there. It was the family’s place: a
        set of walls that they crafted and owned. Frank Sr., who escaped slavery
        and had a fourth-grade education, worked many jobs to maintain it,
        including as an auto mechanic, boiler helper, and farmworker. But in the
        1940s, the Home Owners’ Loan Corporation (HOLC), a New Deal–era
        government-sponsored corporation, redlined a vast swath of the
        city backing up to the Mississippi River, including Porter Street,
        designating it as hazardous.
      </p>

      <p>
        Maps from the era note that the neighborhood could be characterized by
        “detrimental influences in a pronounced degree” and an “under-desirable
        population,” which implied the presence of non-whites or migrants — “or
        an infiltration of it.” As a result of the practice, as occurred all
        around the U.S., Black residents like Frank Sr. couldn’t obtain loans,
        and investment was funneled elsewhere.
      </p>

      <p data-lat="35.12487" data-lng="-90.03924">
        Then, on the heels of the 1949 American Housing Act, which made $1.5
        billion in federal loans and grants available for “urban redevelopment,”
        city politicians surveyed sites that would “make available considerable
        land and eradicate a good portion of the present slum areas,” including
        the swells and stream channels where Frank Sr. had built his life. City
        officials would ultimately build a major thoroughfare bisecting the area
        diagonally, connecting a state highway with Interstate 55 and naming it
        E.H. Crump Boulevard.
      </p>

      <p
        data-lat="35.13275"
        data-lng="-90.04676"
        data-place-marker="true"
        data-marker-color="green"
        data-marker-text="Foote Homes"
      >
        Having been redlined and targeted for slum clearance, Frank Sr.’s house
        was condemned: the first, but not the last time that racist housing
        policy would encroach on the family’s health and ability to grow wealth,
        Frank told me. One day in 1950, Frank Sr. and his family returned home
        to find all their belongings on the front lawn. The family moved up the
        road, into a public housing project known as Foote Homes, which would
        later be found to have been built on contaminated soil.
      </p>

      <p>
        It wasn’t the same as having their own space, and the move took a toll.
        In September 1951, months after being displaced from Porter Street, Eva
        found Frank Johnson Sr. hunched over the kitchen table without a pulse.
        “I think that broke him,” Frank told me. “Died suddenly without
        attendance,” his death certificate read. “No medical history could be
        obtained.”
      </p>

      <p
        data-lat="35.07857555947834"
        data-lng="-90.01542349339891"
        data-place-marker="true"
        data-marker-color="orange"
        data-marker-text="Norris View Subdivision"
      >
        Wanting to give their mother a home of her own again, in 1959, Frank
        Sr.’s son William Johnson, a 27-year-old veteran and U.S. postal worker,
        purchased a lot in what would be the first addition to Norris View
        Subdivision, where Frank Jr. would grow up in a brick house with black
        shutters, blocks away from the Defense Depot.
      </p>

      <p>
        A decade prior, in 1948, the Supreme Court had struck down the use of
        racial covenants, which had previously prevented residents of color from
        purchasing homes or land in an area designated “white.” But in practice,
        subdivisions in much of the expanding city continued to be segregated,
        designed “for negros” or “for whites.”
      </p>
    </div>
  </section>
</template>

<script>
// import * as d3 from 'd3'
// import turf
import {
  centerOfMass,
  point,
  featureCollection,
  feature,
  bbox,
} from '@turf/turf'
import * as mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import scrollama from 'scrollama'

const memphisDepotGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Polygon',
        name: 'Unnamed Layer',
        category: 'default',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-90.009572, 35.091997],
            [-90.009915, 35.082112],
            [-89.988565, 35.081532],
            [-89.988543, 35.085027],
            [-89.987835, 35.084992],
            [-89.987792, 35.091453],
            [-90.009572, 35.091997],
          ],
        ],
      },
      id: '4a8795c6-4dd2-480e-a02e-a5bd2316aa9c',
    },
  ],
}

const focusAreaGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Rectangle',
        name: 'Focus Area',
        category: 'default',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-90.030295, 35.099617],
            [-90.030295, 35.077423],
            [-89.980798, 35.077423],
            [-89.980798, 35.099617],
            [-90.030295, 35.099617],
          ],
        ],
      },
      id: '9192e488-943b-490c-a04e-1656aa747e7e',
    },
  ],
}

const wholeMemphisGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Rectangle',
        name: 'Whole Memphis',
        category: 'default',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-90.074572, 35.062039],
            [-89.853525, 35.062039],
            [-89.853525, 35.208319],
            [-90.074572, 35.208319],
            [-90.074572, 35.062039],
          ],
        ],
      },
      id: 'f20ddac7-c258-4cb9-9a28-ac398b911528',
    },
  ],
}

// const finalFocusAreaGeojson = {
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       properties: {
//         shape: 'Rectangle',
//         name: 'Unnamed Layer',
//         category: 'default',
//       },
//       geometry: {
//         type: 'Polygon',
//         coordinates: [
//           [
//             [-90.03356, 35.122225],
//             [-90.03356, 35.076861],
//             [-89.969959, 35.076861],
//             [-89.969959, 35.122225],
//             [-90.03356, 35.122225],
//           ],
//         ],
//       },
//       id: 'b5106608-7231-4513-ad16-144df4e8bb3a',
//     },
//   ],
// }

const finalFocusAreaGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Rectangle',
        name: 'Unnamed Layer',
        category: 'default',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-89.987812, 35.082972],
            [-89.987812, 35.1204],
            [-90.048328, 35.1204],
            [-90.048328, 35.082972],
            [-89.987812, 35.082972],
          ],
        ],
      },
      id: 'b5106608-7231-4513-ad16-144df4e8bb3a',
    },
  ],
}

const initialViewGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Rectangle',
        name: 'Unnamed Layer',
        category: 'default',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-90.014892, 35.085641],
            [-89.981933, 35.085641],
            [-89.981933, 35.110852],
            [-90.014892, 35.110852],
            [-90.014892, 35.085641],
          ],
        ],
      },
      id: '83fa7a9e-cf4c-44e7-a4ac-70c5d2351af1',
    },
  ],
}

const railroadLinessGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        shape: 'Line',
        name: 'Railroad 1',
        category: 'default',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-89.962115, 35.078407],
          [-89.967436, 35.083043],
          [-89.972285, 35.087221],
          [-89.975889, 35.090171],
          [-89.988247, 35.096667],
          [-90.003865, 35.104602],
          [-90.00541, 35.10541],
          [-90.007255, 35.106709],
          [-90.011503, 35.110711],
        ],
      },
      id: 'fac44442-a8f5-4df2-8c70-bc77e00f9289',
    },
    {
      type: 'Feature',
      properties: {
        shape: 'Line',
        name: 'Unnamed Layer',
        category: 'default',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.011503, 35.110711],
          [-90.018544, 35.118855],
          [-90.022835, 35.122647],
        ],
      },
      id: '459a8af9-d3ec-4f91-99ed-9826bbe6b74c',
    },
    {
      type: 'Feature',
      properties: {
        shape: 'Line',
        name: 'Railroad 2',
        category: 'default',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.043603, 35.076721],
          [-90.040685, 35.077704],
          [-90.033562, 35.081848],
          [-89.990396, 35.107552],
          [-89.985848, 35.111413],
          [-89.982415, 35.114081],
          [-89.980613, 35.115766],
          [-89.978296, 35.117592],
          [-89.973061, 35.125033],
        ],
      },
      id: '5760ca20-4487-4346-a0a3-64cd899f5a68',
    },
  ],
}

export default {
  name: 'MemphisContextHeroMap',
  props: {
    scrollY: {
      type: Number,
      default: 0,
    },
  },
  data: function () {
    return {
      map: null,
      focusedEl: null,
      containerScrollY: 0,
      focused: false,
      initialZoom: 5,
      focusedZoom: 16,
      zoomDuration: 3300,
      // locations: [
      //   // {
      //   //   name: 'Memphis Depot',
      //   //   lat: 35.08652,
      //   //   lng: -89.99542,
      //   //   color: '#e41a1c',
      //   // },
      //   {
      //     name: 'Foote Homes',
      //     // 35.13274686904458, -90.04675594297821
      //     lat: 35.13274686904458,
      //     lng: -90.04675594297821,
      //     color: '#ffff33',
      //   },
      //   {
      //     name: 'Frank Sr. former home',
      //     lat: 35.12587,
      //     lng: -90.0362,
      //     color: '#377eb8',
      //   },
      //   {
      //     name: 'Family home impacted by Dunn Field contents',
      //     lat: 35.09519,
      //     lng: -90.00734,
      //     color: '#4daf4a',
      //   },
      //   {
      //     name: 'Hamilton High School',
      //     lat: 35.100182,
      //     lng: -90.017372,
      //     color: '#984ea3',
      //   },
      //   {
      //     name: 'Ms. Doris home',
      //     lat: 35.08566,
      //     lng: -90.01443,
      //     color: '#ff7f00',
      //   },
      //   // {
      //   //   name: 'Dunn Field',
      //   //   lat: 35.09519,
      //   //   lng: -90.00734,
      //   //   color: '#00ffff',
      //   // },
      // ],
    }
  },
  computed: {
    isMobile: function () {
      const screenWidth = window.innerWidth
      return screenWidth < 768
    },
  },
  mounted: function () {
    this.setUpMapboxMap()

    const scroller = scrollama()
    scroller
      .setup({
        step: '.map-text p',
        // debug: true,
        // offset: 0.75,
        offset: 0.92,
      })
      .onStepEnter(this.onStepEnter)

    // set up scroll listener
    window.addEventListener('scroll', this.onScroll)
  },
  watch: {
    focused: function (newVal, oldVal) {
      if (newVal) {
        this.onMapFocused()
      } else if (oldVal && !newVal) {
        this.onMapUnfocused()
      }
    },
  },
  methods: {
    addMarker(lat, lng, markerColor, markerText) {
      this.map
    },
    onStepEnter(step) {
      // console.log('step', step)
      const el = step.element

      // const location = this.locations.find((l) => l.lat == lat && l.lng == lng)
      this.focusedEl = el
      // this.focused = true

      const zoomDuration = this.zoomDuration
      const lat = el.getAttribute('data-lat')
      const lng = el.getAttribute('data-lng')

      const placeMarker = el.getAttribute('data-place-marker')
      const markerColor = el.getAttribute('data-marker-color')
      const markerText = el.getAttribute('data-marker-text')

      // place all locations like this:
      // this.locations.forEach(
      //   function (location) {
      //     const popup = new mapboxgl.Popup({ offset: 25 }).setText(
      //       location.name
      //     )
      //     const el = document.createElement('div')

      //     const marker = new mapboxgl.Marker({
      //       color: location.color,
      //     })
      //       .setLngLat([location.lng, location.lat])
      //       .setPopup(popup)
      //       .addTo(this.map)
      //   }.bind(this)
      // )

      if (placeMarker) {
        // place single location like this:
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(markerText)
        const el = document.createElement('div')

        // const marker = new mapboxgl.Marker({
        //   color: markerColor,
        // })
        //   .setLngLat([lng, lat])
        //   .setPopup(popup)
        //   .addTo(this.map)

        // wait this.zoomDuration then add to map
        setTimeout(
          function () {
            const marker = new mapboxgl.Marker({
              color: markerColor,
            })
              .setLngLat([lng, lat])
              .setPopup(popup)
              .addTo(this.map)
          }.bind(this),
          zoomDuration * 0.5
        )
      }

      if (step.index === 0) {
        this.map.fitBounds(bbox(initialViewGeojson), {
          duration: zoomDuration * 1.4,
          padding: {
            left: window.innerWidth * 0.3,
            right: 0,
            top: 0,
            bottom: 0,
          },
        })
      } else if (step.index === 2 && step.direction === 'down') {
        // show redlining map layer
        this.map.setLayoutProperty('redlining', 'visibility', 'visible')
        this.map.fitBounds(bbox(wholeMemphisGeojson), {
          duration: zoomDuration * 1.4,
          padding: {
            left: window.innerWidth * 0.3,
            right: 0,
            top: 0,
            bottom: 0,
          },
        })
      } else if (step.index === 2 && step.direction === 'up') {
        // if the redlining layer exists, hide it
        if (this.map.getLayer('redlining')) {
          this.map.setLayoutProperty('redlining', 'visibility', 'none')
        }
      } else if (step.index === 3) {
        // set the redlining layer opacity to 0.3
        this.map.setPaintProperty('redlining', 'raster-opacity', 0.5)
        this.map.flyTo({
          center: [lng, lat],
          zoom: this.focusedZoom,
          duration: this.zoomDuration,
        })
      } else if (step.index === 6) {
        if (this.map.getLayer('redlining')) {
          this.map.setLayoutProperty('redlining', 'visibility', 'none')
        }

        this.map.flyTo({
          center: [lng, lat],
          zoom: this.focusedZoom,
          duration: this.zoomDuration,
        })

        // this.map.fitBounds(bbox(wholeMemphisGeojson), {
        //   duration: zoomDuration * 2,
        //   padding: {
        //     left: window.innerWidth * 0.33,
        //     right: 0,
        //     top: window.innerHeight * 0.25,
        //     bottom: window.innerHeight * 0.25,
        //   },
        // })
      } else if (step.index === 7) {
        console.log('step 7')
        this.map.fitBounds(bbox(finalFocusAreaGeojson), {
          duration: 5500,
        })
        // add marker for hamilton high school
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(
          'Hamilton High School'
        )
        const el = document.createElement('div')
        const marker = new mapboxgl.Marker({
          color: '#984ea3',
        })
          .setLngLat([-90.017372, 35.100182])
          .setPopup(popup)
          .addTo(this.map)
      } else {
        if (!lng || !lat) return
        // console.log('flying to', lat, lng)
        this.map.flyTo({
          center: [lng, lat],
          zoom: this.focusedZoom,
          duration: this.zoomDuration,
        })
      }
    },
    flyToLocation(location) {
      this.map.flyTo({
        center: [location.lng, location.lat],
        zoom: this.focusedZoom * 1.3,
        duration: this.zoomDuration,
      })
    },
    onMapUnfocused: function () {
      this.map.fitBounds(bbox(focusAreaGeojson), {
        duration: this.zoomDuration * 1.4,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      })
    },
    onMapFocused: function () {
      // const zoomDuration = 8000
      // fit to bounds of whole Memphis
      // this.map.fitBounds(bbox(wholeMemphisGeojson), {
      //   duration: zoomDuration,
      //   padding: {
      //     left: 20,
      //     right: 20,
      //     top: 20,
      //     bottom: 20,
      //   },
      // })
      // this.map.easeTo({
      //   zoom: this.focusedZoom,
      //   pitch: 55,
      //   bearing: -32,
      //   duration: zoomDuration,
      // })
      // // after 8 seconds do this.map.setStyle to this style: 'mapbox://styles/mapbox/satellite-v9',
      // setTimeout(
      //   function () {
      //     this.map.setStyle('mapbox://styles/mapbox/satellite-v9')
      //   }.bind(this),
      //   zoomDuration + 25
      // )
    },
    onMapLoaded: function () {
      // add mapboxgl controls
      this.map.addControl(new mapboxgl.NavigationControl())

      // add geotif source from ejfox.2kyqw8bg
      this.map.addSource('redlining', {
        type: 'raster',
        url: 'mapbox://ejfox.41w7bf5g',
      })

      this.map.addLayer({
        id: 'redlining',
        type: 'raster',
        source: 'redlining',
        paint: {
          'raster-opacity': 0.75,
        },
      })

      this.map.setLayoutProperty('redlining', 'visibility', 'none')

      this.map.fitBounds(bbox(wholeMemphisGeojson), {
        duration: 0,
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20,
        },
      })

      this.map.easeTo({
        pitch: 45,
        duration: 0,
      })

      // create markers for all locations in this.locations
      // this.locations.forEach(
      //   function (location) {
      //     const popup = new mapboxgl.Popup({ offset: 25 }).setText(
      //       location.name
      //     )
      //     const el = document.createElement('div')

      //     const marker = new mapboxgl.Marker({
      //       color: location.color,
      //     })
      //       .setLngLat([location.lng, location.lat])
      //       .setPopup(popup)
      //       .addTo(this.map)
      //   }.bind(this)
      // )

      // add labels for all locations in this.locations as geojson
      // first create an array of points for each location
      // const points = this.locations.map(function (location) {
      //   return point([location.lng, location.lat], {
      //     name: location.name,
      //     color: location.color,
      //   })
      // })
      // // then create a feature collection from the points
      // const pointFeatureCollection = featureCollection(points)
      // // then add the feature collection to the map
      // this.map.addSource('points', {
      //   type: 'geojson',
      //   data: pointFeatureCollection,
      // })
      // // then add the labels to the map
      // this.map.addLayer({
      //   id: 'labels',
      //   type: 'symbol',
      //   source: 'points',
      //   layout: {
      //     'text-field': ['get', 'name'],
      //     'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      //     'text-offset': [0, 0.6],
      //     // 'text-transform': 'uppercase',
      //     'text-anchor': 'top',
      //   },
      //   paint: {
      //     'text-color': ['get', 'color'],
      //     'text-halo-color': '#fff',
      //     'text-halo-width': 1,
      //   },
      // })

      // add memphis depot as geojson, with orange fill
      this.map.addSource('memphis-depot', {
        type: 'geojson',
        data: memphisDepotGeojson,
      })
      // this.map.addLayer({
      //   id: 'memphis-depot-label',
      //   type: 'symbol',
      //   source: 'memphis-depot',
      //   layout: {
      //     'text-field': 'Memphis Depot',
      //     'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      //     'text-offset': [0, 0.6],
      //     'text-anchor': 'top',
      //     'text-allow-overlap': false,
      //   },
      // })

      this.map.addLayer({
        id: 'memphis-depot-fill',
        type: 'fill',
        source: 'memphis-depot',
        paint: {
          'fill-color': '#ff7f00',
          'fill-opacity': 0.2,
        },
      })
    },
    onScroll: function (e) {
      this.containerScrollY = this.calcContainerScrollY(e)
      if (!this.$refs.root) return

      const containerHeight = this.$refs.root.offsetHeight
      // if containerScrollY is negative, not in focus for the height of the element
      if (this.containerScrollY < 0) {
        this.focused = false
      } else if (this.containerScrollY > containerHeight) {
        this.focused = false
      } else {
        this.focused = true
      }
    },
    calcContainerScrollY: function (e) {
      const containerEl = this.$refs.root
      if (!containerEl) return false
      /* figure out how many pixels have been scrolled in container */
      let containerScrollY = containerEl.getBoundingClientRect().top
      // invert the number from negative to positive
      containerScrollY = -containerScrollY
      return containerScrollY
    },
    setUpMapboxMap: function () {
      this.map = new mapboxgl.Map({
        container: this.$refs.mapRoot,
        // style: 'mapbox://styles/mapbox/streets-v11',
        // satellite style
        // style: 'mapbox://styles/mapbox/satellite-v9',
        style: 'mapbox://styles/ejfox/cl7p0rxav000o15p0dnsl8jen',
        accessToken:
          'pk.eyJ1IjoiZWpmb3giLCJhIjoiY2lyZjd0bXltMDA4b2dma3JzNnA0ajh1bSJ9.iCmlE7gmJubz2RtL4RFzIw',
        center: [-89.99542, 35.08652],
        zoom: this.initialZoom,

        // 'pk.eyJ1IjoiZWpmb3giLCJhIjoiY2lyZjd0bXltMDA4b2dma3JzNnA0ajh1bSJ9.iCmlE7gmJubz2RtL4RFzIw',

        // projection: 'globe',
        projection: 'mercator',
      })

      this.map.on('load', this.onMapLoaded)
      // Disable zoom scrolling
      this.map.scrollZoom.disable()

      // Disable panning
      if (this.isMobile) this.map.dragPan.disable()
    },
  },
}
</script>

<style scoped>
#map {
  position: sticky;
}

.vh-80 {
  height: 80vh;
}

.hero-map-container {
  /* position: sticky;
  top: 1rem; */
}

p {
  margin-bottom: 48vh;
  padding: 2em 1.2em;
  margin-left: 2vw;
  margin-right: 2vw;
  line-height: 1.3em;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 0 3.3rem rgba(0, 0, 0, 0.15);
  border: 1px solid white;
}

.sticky {
  position: sticky;
}
</style>
"
