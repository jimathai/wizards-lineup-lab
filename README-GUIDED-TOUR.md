# District GM Guided Tour

This patch adds a four-step first-visit walkthrough:

1. Court / Cards / List selector
2. Lineup Editor
3. Saved Lineups
4. Share Lineups

The tour supports Next, Back, Skip, progress dots, Space/Enter/Right Arrow to continue, Left Arrow to go back, and Escape to skip.

Completion is stored locally under:

`district-gm-tour-complete`

Use the `Help / Tour` button in the top navigation to replay the walkthrough at any time.

To force the automatic first-visit experience again during testing, run this in the browser console and refresh:

```js
localStorage.removeItem('district-gm-tour-complete')
```
