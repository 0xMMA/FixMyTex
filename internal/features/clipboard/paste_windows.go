//go:build windows

package clipboard

import (
	"fmt"
	"syscall"
	"time"
	"unsafe"
)

var (
	clipUser32    = syscall.NewLazyDLL("user32.dll")
	clipSendInput = clipUser32.NewProc("SendInput")
)

const (
	inputKeyboard   = 1
	keyEventKeyUp   = 0x0002
	vkControl       = 0x11
	vkV             = 0x56
)

// input mirrors the Win32 INPUT struct (keyboard variant, 40 bytes on 64-bit).
// Layout: type(4) + pad(4) + wVk(2) + wScan(2) + dwFlags(4) + time(4) +
//         dwExtraInfo(8) + pad(12) = 40 bytes.
type pasteInput struct {
	inputType   uint32
	_           uint32
	wVk         uint16
	wScan       uint16
	dwFlags     uint32
	time        uint32
	dwExtraInfo uintptr
	_           [12]byte
}

// PasteToForeground sends Ctrl+V to the foreground window via Win32 SendInput.
// A 150 ms delay is applied first to let the clipboard write settle.
func (s *Service) PasteToForeground() error {
	time.Sleep(150 * time.Millisecond)
	inputs := [4]pasteInput{
		{inputType: inputKeyboard, wVk: vkControl},
		{inputType: inputKeyboard, wVk: vkV},
		{inputType: inputKeyboard, wVk: vkV, dwFlags: keyEventKeyUp},
		{inputType: inputKeyboard, wVk: vkControl, dwFlags: keyEventKeyUp},
	}
	ret, _, err := clipSendInput.Call(
		uintptr(len(inputs)),
		uintptr(unsafe.Pointer(&inputs[0])),
		unsafe.Sizeof(inputs[0]),
	)
	if ret == 0 {
		return fmt.Errorf("SendInput failed: %w", err)
	}
	return nil
}
