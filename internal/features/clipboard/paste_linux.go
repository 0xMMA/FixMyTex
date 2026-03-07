//go:build !windows

package clipboard

import (
	"os/exec"
	"time"
)

// CopyFromForeground sends Ctrl+C to the currently focused window via xdotool,
// then waits 150 ms for the clipboard to be populated.
func (s *Service) CopyFromForeground() error {
	err := exec.Command("xdotool", "key", "--clearmodifiers", "ctrl+c").Run()
	time.Sleep(150 * time.Millisecond)
	return err
}

// PasteToForeground sends a Ctrl+V keystroke to the currently focused window.
// Uses xdotool; intended to be called after writing fixed text to the clipboard
// so the result is pasted back into the source application.
// A 150 ms delay is applied first to let the clipboard write settle.
func (s *Service) PasteToForeground() error {
	time.Sleep(150 * time.Millisecond)
	return exec.Command("xdotool", "key", "--clearmodifiers", "ctrl+v").Run()
}
