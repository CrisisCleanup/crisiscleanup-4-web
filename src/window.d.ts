import type { App } from 'vue';

declare global {
  type Window = {
    app: App<Element>;
  };
}
