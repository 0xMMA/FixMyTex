//go:build !windows

package pyramidize

import (
	"os/exec"
	"strings"
)

// captureSourceApp returns the name and xdotool window ID of the currently
// focused window. Returns empty strings if xdotool is not available or fails.
func captureSourceApp() (name string, windowID string) {
	// Get the active window ID
	idOut, err := exec.Command("xdotool", "getactivewindow").Output()
	if err != nil {
		return "", ""
	}
	id := strings.TrimSpace(string(idOut))
	if id == "" {
		return "", ""
	}

	// Get the window name/title
	nameOut, err := exec.Command("xdotool", "getwindowname", id).Output()
	if err != nil {
		return "", ""
	}
	return strings.TrimSpace(string(nameOut)), id
}

// sendBackToWindow focuses the given xdotool window and sends Ctrl+V to paste.
// This is best-effort on Linux; returns nil if windowID is empty.
func sendBackToWindow(windowID string) error {
	if windowID == "" {
		return nil
	}
	if err := exec.Command("xdotool", "windowfocus", windowID).Run(); err != nil {
		return err
	}
	return exec.Command("xdotool", "key", "--window", windowID, "ctrl+v").Run()
}
