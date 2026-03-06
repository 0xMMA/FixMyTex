//go:build !windows

package clipboard

import (
	"os/exec"
	"time"
)

// PasteToForeground sends a Ctrl+V keystroke to the currently focused window.
// Uses xdotool; intended to be called after writing fixed text to the clipboard
// so the result is pasted back into the source application.
// A 150 ms delay is applied first to let the clipboard write settle.
func (s *Service) PasteToForeground() error {
	time.Sleep(150 * time.Millisecond)
	return exec.Command("xdotool", "key", "--clearmodifiers", "ctrl+v").Run()
}
