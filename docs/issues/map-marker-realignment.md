# Map Marker Re-alignment When Map Image Changes

- Map marker positions are stored in a logical coordinate space and rendered correctly when the map image is displayed. As noted in the implementation plan (Phase 4.5), **existing markers are not automatically adjusted when the map image is changed** (e.g. user replaces the image URL or uploads a different image with a different size or aspect ratio).
- Implement robust re-alignment behavior for this case: e.g. scale/remap existing marker positions to the new image bounds, or prompt the user to confirm/adjust marker positions after an image change. Ensure the behavior is documented and predictable for users.
