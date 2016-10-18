# Development

To get started developing Reptar locally:

```shell
git clone git@github.com:reptar/reptar.git
cd reptar
npm install
```

From there you're good to go!

Easiest way to add/modify/test features is by writing a test and then interacting with Reptar through there.

You can start mocha in watch mode and then begin coding:

```shell
npm run test:unit -- --watch
```

# Commit Messages

Reptar is using [standard-version](https://github.com/conventional-changelog/standard-version) to standardize its commit messages. For a quick overview of what that looks like [consult the quick start guide](https://github.com/conventional-changelog/standard-version#commit-message-convention-at-a-glance) or look at previous commits.

By default a git-hook is installed to validate your commit message.

Additionally you should use [commitizen](https://github.com/commitizen/cz-cli) to automate and streamline the process of creating properly formatted commit messages.

# Cutting a release

When ready to cut a release just run `npm run release`. We're closely following the [instructions on the standard-version documentation page](https://github.com/conventional-changelog/standard-version#cut-a-release).