This directory contains what is needed to test four.js.

## Usage
```make server``` will launch the webdriver server. it has to run all the time during the tests. (within fourjs/tests/)   
```http-server``` will launch start local server. it has to run all the time during the tests. port 8080 (within fourjs/)

To actually launch the tests, do ```make test```. it will run the ```test.js``` (within fourjs/tests/)


## Installation
first  npm install (within fourjs/tests/)
dependancies : webdriverio, node-resemble-js, fs-extra, http-server

To test on chrome, be sure to install [chromedriver](https://code.google.com/p/selenium/wiki/ChromeDriver)

## Chromedriver Install
To test with chrome download ChromeDriver at : https://sites.google.com/a/chromium.org/chromedriver/getting-started
And copy it in your PATH (eg /usr/local/bin)

## Implementation
It is all mostly in http://webdriver.io/

## Process to run tests locally
- Checkout master (or dev) branch
- in ```/tests```, run ```node test-runner.js -o``` in the console to generate originals png
- Checkout back to the branch on which you are working
- in ```/tests```, run ```node test-runner.js``` in the console
- tests result will be displayed in the console. green means good, red means bad.

## TASKS Remaining
- fix chrome different than firefox
  - font width, letter spacing
  - button[html template]
  - posrotsca animation
  - video + gif
- find a way to run that on a server (with GPU? without gpu with software emulation? with devops richard mag)
- link that to github for each pull request
- DONE able to test locally (near completion)

