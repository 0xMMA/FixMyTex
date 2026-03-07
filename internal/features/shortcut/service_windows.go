//go:build windows

package shortcut

import (
	"fmt"
	"runtime"
	"syscall"
	"time"
	"unsafe"

	"keylint/internal/logger"
)

const (
	modifierCtrl = 0x0002
	vkG          = 0x47
	wmHotkey     = 0x0312
	hotkeyID     = 1
)

var (
	user32              = syscall.NewLazyDLL("user32.dll")
	registerHotKey      = user32.NewProc("RegisterHotKey")
	unregisterHotKey    = user32.NewProc("UnregisterHotKey")
	getMessage          = user32.NewProc("GetMessageW")
	getForegroundWindow = user32.NewProc("GetForegroundWindow")
)

type windowsService struct {
	ch chan ShortcutEvent
}

// NewPlatformService returns the Windows Win32 RegisterHotKey implementation.
func NewPlatformService() Service {
	return &windowsService{ch: make(chan ShortcutEvent, 1)}
}

func (s *windowsService) Register() error {
	// RegisterHotKey is thread-affine: WM_HOTKEY is only delivered to the thread
	// that called RegisterHotKey. Lock both registration and the message loop to
	// the same OS thread so GetMessageW sees the hotkey messages.
	ready := make(chan error, 1)
	go func() {
		runtime.LockOSThread()
		// Retry once on failure (dev-mode restart race: previous process may not
		// have fully exited and released the hotkey yet).
		ret, _, err := registerHotKey.Call(0, hotkeyID, modifierCtrl, vkG)
		if ret == 0 {
			logger.Warn("shortcut: RegisterHotKey first attempt failed, retrying in 500ms", "err", err)
			time.Sleep(500 * time.Millisecond)
			ret, _, err = registerHotKey.Call(0, hotkeyID, modifierCtrl, vkG)
			if ret == 0 {
				logger.Error("shortcut: RegisterHotKey failed", "err", err)
				ready <- fmt.Errorf("RegisterHotKey failed: %w", err)
				return
			}
		}
		logger.Info("shortcut: RegisterHotKey ok", "hotkey", "ctrl+g")
		ready <- nil
		s.messageLoop()
	}()
	return <-ready
}

func (s *windowsService) Unregister() {
	unregisterHotKey.Call(0, hotkeyID)
	logger.Info("shortcut: UnregisterHotKey called")
}

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
	logger.Info("shortcut: message loop started")
	var m msg
	for {
		ret, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if ret == 0 {
			break
		}
		if m.Message == wmHotkey && m.WParam == hotkeyID {
			hwnd, _, _ := getForegroundWindow.Call()
			logger.Info("shortcut: hotkey fired", "foreground_hwnd", hwnd)
			s.ch <- ShortcutEvent{Source: "hotkey"}
		}
	}
}
