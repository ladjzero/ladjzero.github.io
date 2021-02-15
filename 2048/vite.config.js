import { VitePWA } from 'vite-plugin-pwa'

export default {
  base: '/2048/dist/',
  build: {
    assetsInlineLimit: 1024
  },
  plugins: [
    VitePWA({
      manifest: {
        "name": "2048",
        "short_name": "2048",
        "display": "standalone",
        "start_url": "index.html",
        "theme_color": "#F1E7DF",
        "background_color": "#F1E7DF",
        "icons": [
          {
            "src": "/2048/assets/icon.png",
            "sizes": "256x256",
            "type": "image/png"
          }
        ]
      }
    })
  ]
}