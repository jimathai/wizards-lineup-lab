Replace only:
src/components/Court.jsx

Then refresh the browser.

If the app is still blue because stale state is loaded, open DevTools Console and run:
localStorage.removeItem('wll-react-v1')
location.reload()
