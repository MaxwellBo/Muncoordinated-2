# Muncoordinated

[![Netlify Status](https://api.netlify.com/api/v1/badges/620aebdc-0c8d-4ef6-873d-cfcd154f8269/deploy-status)](https://app.netlify.com/sites/muncoordinated/deploys)

[![Muncoordinated](https://img.shields.io/endpoint?url=https://dashboard.cypress.io/badge/detailed/zxca1q/master&style=flat&logo=cypress)](https://dashboard.cypress.io/projects/zxca1q/runs)

Muncoordinated is a Model UN committee management service, (re)written with TypeScript, React, Semantic UI and Firebase, and available at [muncoordinated.io](https://muncoordinated.io).

![demo screenshot](public/promo.png)


## Background

This version of Muncoordinated began development at the end of 2017, ahead of SydMUN 2017. It began as a reimplementation of a previous version of Muncoordinated, built in Elm. The current version of Muncoordinated was my (@MaxwellBo) first real foray into frontend development, React, TypeScript, and UI design. This means that some of the old code in here is, frankly, shockingly bad. Furthermore, a lot of features were either rushed out before conferences, or during debate. Neither documentation or tests were written.

Ultimately, this is a personal project that ballooned in scope and LOC - contributing to this will be difficult. Absolutely feel free to contact me if you'd like to contribute; I'll gladly guide you through the ugly hacks and shaky foundations.

## Development


```sh
yarn && yarn start
```

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

## Tests


```sh
yarn test
```

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

## Integration tests

```sh
yarn run cypress
```

Launches the integration test runner.<br>
See the section about [The Test Runner](https://docs.cypress.io/guides/core-concepts/test-runner.html)

## Building

```sh
yarn build
```

Builds the app for production to the `build` folder.<br>
It will bundle React in production mode and optimize the build for the best performance.

The build is minified and the filenames include the hashes.<br>

## Maintainers

[@MaxwellBo](https://github.com/MaxwellBo).

## Contributing

Feel free to dive in! [Open an issue](https://github.com/MaxwellBo/Muncoordinated-2/issues/new) or submit PRs.

You might also want access to some of the SaaS services that we've used to build Muncoordinated:

- [Public Netlify deployment status](https://app.netlify.com/sites/muncoordinated/deploys)
- [Public Cypress integration test run recordings](https://dashboard.cypress.io/projects/zxca1q/runs)
- [Private Sentry error logging](https://sentry.io/organizations/muncoordinated/issues/?project=5450534) (access available upon request)
- [Private Google Analytics](https://analytics.google.com/analytics/web/?authuser=0&hl=en#/report-home/a122177622w180239935p178399522) (access available upon request)

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


### Contributors

This project exists thanks to all the people who contribute. Special thanks to:

- [UQ United Nations Student Association](https://www.facebook.com/UQUNSA/)


## License

[GNU GPLv3](LICENSE) © Maxwell Bo
