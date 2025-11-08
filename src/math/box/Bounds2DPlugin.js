/**
 * Interface for plugins that attach to Bounds2D instances.
 * Plugins can observe lifecycle events, mutations, and traits.
 */
class Bounds2DPlugin {
  /**
   * Called when the plugin is attached to a Bounds2D instance.
   * @param {Bounds2D} bounds - The target bounds.
   */
  onAttach(bounds) {}

  /**
   * Called when the bounds emits an event.
   * @param {string} event - The event name.
   * @param {any} payload - Optional event payload.
   * @param {Bounds2D} bounds - The source bounds.
   */
  onEvent(event, payload, bounds) {}
}

export { Bounds2DPlugin };
