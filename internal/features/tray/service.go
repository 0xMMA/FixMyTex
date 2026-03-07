package tray

import "github.com/wailsapp/wails/v3/pkg/application"

// Service manages the system tray icon and menu.
type Service struct {
	app *application.App
}

// NewService creates a new TrayService.
func NewService(app *application.App) *Service {
	return &Service{app: app}
}

// Setup initialises the system tray with menu items.
// window is used to show/focus the main window from tray interactions.
func (s *Service) Setup(window application.Window) {
	tray := s.app.SystemTray.New()
	tray.SetLabel("KeyLint")

	menu := s.app.NewMenu()
	menu.Add("Open KeyLint").OnClick(func(ctx *application.Context) {
		window.Show().Focus()
	})
	menu.AddSeparator()
	menu.Add("Exit").OnClick(func(ctx *application.Context) {
		s.app.Quit()
	})
	tray.SetMenu(menu)

	tray.OnClick(func() {
		tray.OpenMenu()
	})
	tray.OnDoubleClick(func() {
		window.Show().Focus()
	})
}
