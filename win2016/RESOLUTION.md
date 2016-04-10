### radioactive syncup
- describe all the issues
  - 4d studio not on four.js/master
  - how to sync up with radioactive change
    - assess what are the change
    - pdfviewer
    - livesensor

### 4D Studio Not on four.js/master
- 4D Studio is currently using four.js/radioactive 
  - 4D Studio should be on four.js/master 
  - it freeze its developement
  - features are already done, just waiting to be merged, but can't be included (e.g. transparency refactor, performance stats reporting)
- 4D Studio doesn't depend on anything radioactive specific
  - So putting it back on four.js/master doesn't change any 4D Studio behavior
- LET ME REPEAT :) for 4D Studio, it is all the same from a features point of view
- So 4D Studio should put back on four.js/master asap, thus the dev process would come back on track 

### Syncing up with radioactive
- during first meeting with jerome/yowhann/luc/lawrence, we agreed on following principle
  - four.js contains the plateform independant stuff
  - mobile/helmet specific stuff go in their respective repo (fourAR?)
- i just apply this principle on each change made during radioactive

### Radioactive feature: what goes where
- carousel UI: it is made for the UI in mobile/helmet, so it goes in mobile/helmet repo
- pdfviewer: it has to be available in 4D Studio. it is not specific to mobile or helmet. it is plateform independant. it goes in four.js 
- livesensor: it has to be available in 4D Studio. it is not specific to mobile or helmet. it is plateform independant. it goes in four.js
