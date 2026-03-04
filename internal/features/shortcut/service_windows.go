//go:build windows

package shortcut

import (
	"fmt"
	"syscall"
	"unsafe"
)

const (
	modifierCtrl = 0x0002
	vkG          = 0x47
	wmHotkey     = 0x0312
	hotkeyID     = 1
)

var (
	user32         = syscall.NewLazyDLL("user32.dll")
	registerHotKey = user32.NewProc("RegisterHotKey")
	getMessage     = user32.NewProc("GetMessageW")
)

type windowsService struct {
	ch chan ShortcutEvent
}

// NewPlatformService returns the Windows Win32 RegisterHotKey implementation.
func NewPlatformService() Service {
	return &windowsService{ch: make(chan ShortcutEvent, 1)}
}

func (s *windowsService) Register() error {
	ret, _, err := registerHotKey.Call(0, hotkeyID, modifierCtrl, vkG)
	if ret == 0 {
		return fmt.Errorf("RegisterHotKey failed: %w", err)
	}
	go s.messageLoop()
	return nil
}

func (s *windowsService) Unregister() {}

func (s *windowsService) Triggered() <-chan ShortcutEvent { return s.ch }

type msg struct {
	HWnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      [2]int32
}

func (s *windowsService) messageLoop() {
	var m msg
	for {
		ret, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if ret == 0 {
			break
		}
		if m.Message == wmHotkey && m.WParam == hotkeyID {
			s.ch <- ShortcutEvent{Source: "hotkey"}
		}
	}
}
