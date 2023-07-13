import { createApp, ComponentCustomProperties } from 'vue';
import App from './App.vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    loadScript: (src: string, onLoad: () => void) => void;
  }
}

const app = createApp(App);

app.mixin({
  methods: {
    loadScript(src: string, onLoad: () => void) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoad;
      document.body.appendChild(script);
    },
  },
});

app.mount('#app');
