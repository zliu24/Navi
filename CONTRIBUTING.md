# Guidelines for contributing to four.js

- Do your pull request over 'dev' branch (NOT 'master' branch)
- Shortly explain the purpose of the pull request
- Link to the bug/story you are fixing if suitable

**About Review**
- Add the name of the reviewers in your comment, thus they will get notified
- As a reviewer, to show your approuval. just add a +1
- it is better to have two or more approuval

## Release Process
- Pull Requests are created off of "dev" branch by anyone
- FourJS team merges PRs into "dev" throughout the week
- Weekly, we merge "dev" into "master" and tag it with a semantic version (http://semver.org/)
- When we are in bad shape and need hotfixe on releases, we do a PR on master
  and merge it in, and move the commit that the tag points to.
