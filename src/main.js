import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'leaflet/dist/leaflet.css'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
//引入Leaflet对象 挂载到Vue上，便于全局使用，也可以单独页面中单独引用
Vue.use(ElementUI);


Vue.config.productionTip = false
// Vue.L = Vue.prototype.$L = L
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
