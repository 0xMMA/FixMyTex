package shortcut

// ShortcutEvent carries the payload emitted when the global shortcut fires.
type ShortcutEvent struct {
	Source string // "hotkey" | "simulate"
}

// Service is the platform-agnostic interface for global shortcut handling.
// Platform-specific implementations are in service_windows.go / service_linux.go.
type Service interface {
	// Register activates the global hotkey listener.
	Register() error
	// Unregister deactivates the listener.
	Unregister()
	// Triggered returns a channel that receives an event each time the shortcut fires.
	Triggered() <-chan ShortcutEvent
}
