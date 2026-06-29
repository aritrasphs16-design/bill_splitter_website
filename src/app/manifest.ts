import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CruiseSplit | Bill Splitter',
    short_name: 'CruiseSplit',
    description: 'Track personal spending and split shared expenses with friends.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0056b3',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
