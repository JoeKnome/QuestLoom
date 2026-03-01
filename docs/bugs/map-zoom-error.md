# Map zoom error

## Description

When zooming in or out of the map using the scroll wheel, the following error is logged to the console:

```text
MapView.tsx:745 Unable to preventDefault inside passive event listener invocation.
preventDefault @ chunk-OY5C42Z6.js?v=8620014c:5775
(anonymous) @ MapView.tsx:745
callCallback2 @ chunk-OY5C42Z6.js?v=8620014c:3680
invokeGuardedCallbackDev @ chunk-OY5C42Z6.js?v=8620014c:3705
invokeGuardedCallback @ chunk-OY5C42Z6.js?v=8620014c:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-OY5C42Z6.js?v=8620014c:3742
executeDispatch @ chunk-OY5C42Z6.js?v=8620014c:7046
processDispatchQueueItemsInOrder @ chunk-OY5C42Z6.js?v=8620014c:7066
processDispatchQueue @ chunk-OY5C42Z6.js?v=8620014c:7075
dispatchEventsForPlugins @ chunk-OY5C42Z6.js?v=8620014c:7083
(anonymous) @ chunk-OY5C42Z6.js?v=8620014c:7206
batchedUpdates$1 @ chunk-OY5C42Z6.js?v=8620014c:18966
batchedUpdates @ chunk-OY5C42Z6.js?v=8620014c:3585
dispatchEventForPluginEventSystem @ chunk-OY5C42Z6.js?v=8620014c:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-OY5C42Z6.js?v=8620014c:5484
dispatchEvent @ chunk-OY5C42Z6.js?v=8620014c:5478
dispatchContinuousEvent @ chunk-OY5C42Z6.js?v=8620014c:5467
```
