# DOM nesting error

## Description

When the app is loaded, the following error is logged to the console:

```text
chunk-OY5C42Z6.js?v=8620014c:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
chunk-OY5C42Z6.js?v=8620014c:521 Warning: validateDOMNesting(...): <button> cannot appear as a descendant of <button>.
    at button
    at div
    at div
    at button
    at div
    at div
    at MapListScreen (http://localhost:5173/src/features/maps/MapListScreen.tsx?t=1772283323831:80:33)
    at MapsSection (http://localhost:5173/src/features/maps/MapsSection.tsx?t=1772283323861:22:3)
    at div
    at GameViewContent (http://localhost:5173/src/features/games/GameViewContent.tsx?t=1772283323861:28:3)
    at div
    at div
    at div
    at GameView (http://localhost:5173/src/features/games/GameView.tsx?t=1772286937483:34:25)
    at main
    at div
    at App (http://localhost:5173/src/App.tsx?t=1772286937483:24:25)
printWarning @ chunk-OY5C42Z6.js?v=8620014c:521
error @ chunk-OY5C42Z6.js?v=8620014c:505
validateDOMNesting @ chunk-OY5C42Z6.js?v=8620014c:8303
createInstance @ chunk-OY5C42Z6.js?v=8620014c:8375
completeWork @ chunk-OY5C42Z6.js?v=8620014c:16338
completeUnitOfWork @ chunk-OY5C42Z6.js?v=8620014c:19277
performUnitOfWork @ chunk-OY5C42Z6.js?v=8620014c:19259
workLoopSync @ chunk-OY5C42Z6.js?v=8620014c:19190
renderRootSync @ chunk-OY5C42Z6.js?v=8620014c:19169
performConcurrentWorkOnRoot @ chunk-OY5C42Z6.js?v=8620014c:18728
workLoop @ chunk-OY5C42Z6.js?v=8620014c:197
flushWork @ chunk-OY5C42Z6.js?v=8620014c:176
performWorkUntilDeadline @ chunk-OY5C42Z6.js?v=8620014c:384

```
