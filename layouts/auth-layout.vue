<template>
  <v-app id="auth-layout">
    <Alerts ref="alerts" />
    <!-- <ModalConfirmMsg ref="confirmMsg" />
    <ModalConnect ref="connect" /> -->

    <img
      id="auth-layout-background"
      :src="
        require(`~/assets/sources/images/circle${
          bgMain.includes(route) ? '-main'
          : bgLogo.includes(route) ? '-logo'
          : bgPerson.includes(route) ? '-person'
          : ''
        }.svg`)
      "
      :class="{ toTop: bgToTop.includes(route) }"
      alt="background"
      :style="`--w: ${excludedRoutes.includes(route) ? 452 : 634}px`"
    >

    <v-main class="parent">
      <nuxt-child data-nuxt="childs" />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "AuthLayout",
  data() {
    return {
      bgToTop: [
        '/swap',
        '/deposit'
      ],
      bgMain: [
        '/create-import',
        '/import-wallet',
        '/create-wallet',
        '/user-profile',
      ],
      bgLogo: [
        '/create-wallet-verification'
      ],
      bgPerson: [
        '/verification',
        '/verification-login-email'
      ],
      excludedRoutes: [
        "/login",
        "/verification",
      ],
    };
  },
  computed: {
    route() {
      const route = this.$route.path

      if (route.endsWith("/")) {
        if(!sessionStorage.getItem("indexSelect")) return route.slice(0, -1)

        if(sessionStorage.getItem("indexSelect") === "create-import") {
          sessionStorage.removeItem("indexSelect")
          return "/create-import";  
        }
        return route.slice(0, -1);
      }

      return route
    }
  },

  created() {
    /* if (localStorage.getItem('auth')) {
      this.$router.replace('/')
    } */
  },
}
</script>

<style src="~/assets/styles/layouts/auth-layout.scss" lang="scss" />
