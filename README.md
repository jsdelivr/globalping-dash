# globalping-dash

Globalping's official dashboard and probe control panel

## Contributing

You can run the project by following these steps:

1. Set up and run [directus service](https://github.com/jsdelivr/globalping-dash-directus)
2. `pnpm i`
3. `pnpm dev`
4. Go to http://localhost:13010
5. Log In:
    - Either using your GitHub account (make sure `AUTH_GITHUB_CLIENT_ID` and `AUTH_GITHUB_CLIENT_SECRET` at directus service are correctly set).
    - Or login with email `user@example.com` and password `user` at directus service (http://localhost:18055 by default), then get back to http://localhost:13010 and refresh the page.
6. Optionally, you can also run [globalping API](https://github.com/jsdelivr/globalping) and [globalping probe](https://github.com/jsdelivr/globalping-probe) to e.g. run full probe adoption flow.

Other notes:

- We are using [PrimeVue](https://primevue.org/) as a components library. While adding components make sure they are uncommented in [presets/aura/index.js](presets/aura/index.js). Unused components are commented out to reduce the bundle size.
