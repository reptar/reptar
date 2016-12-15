# Development

To get started developing Reptar locally:

## OSX / Linux

```shell
git clone git@github.com:reptar/reptar.git
cd reptar
npm install
```

From there you're good to go!

## Windows

First of all, if you're using Git Bash to clone the repo, then make sure that you enter this command into the terminal:  
```shell
git config --global core.autocrlf false
```
It will ensure that all file line endings are in the LF format when cloning the repo, not the standard CRLF format that Windows uses. This is to comply with Reptar's ESLint rules.  

Secondly, you might need to install some Windows build tools to make the node-gyp dependency work. This can be easily done by typing in the following into your terminal:  
```shell
npm install --global --production windows-build-tools
```  
(For more information visit [this page](https://github.com/nodejs/node-gyp#installation))  
If Reptar still give you errors about node-gyp after trying to install it you might need to download Python version 2 manually. During installation you need to set the PATH environment variable by clicking on a checkbox.

Finally move on to running the following commands to download Reptar and install its dependencies:  

```shell
git clone git@github.com:reptar/reptar.git
cd reptar
npm install
```

## Testing
The easiest way to add/modify/test features is by writing a test and then interacting with Reptar through there.
You can start mocha in watch mode and then begin coding:

```shell
npm run test:unit -- --watch
```

## Commit Messages

Reptar is using [standard-version](https://github.com/conventional-changelog/standard-version) to standardize its commit messages. For a quick overview of what that looks like [consult the quick start guide](https://github.com/conventional-changelog/standard-version#commit-message-convention-at-a-glance) or look at previous commits.

By default a git-hook is installed to validate your commit message.

Additionally you should use [commitizen](https://github.com/commitizen/cz-cli) to automate and streamline the process of creating properly formatted commit messages.

## Cutting a release

When ready to cut a release just run `npm run release`. We're closely following the [instructions on the standard-version documentation page](https://github.com/conventional-changelog/standard-version#cut-a-release).
