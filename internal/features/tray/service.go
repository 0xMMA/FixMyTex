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
func (s *Service) Setup() {
	tray := s.app.SystemTray.New()
	tray.SetLabel("FixMyTex")

	menu := s.app.NewMenu()
	menu.Add("Open FixMyTex").OnClick(func(ctx *application.Context) {
		tray.ShowWindow()
	})
	menu.AddSeparator()
	menu.Add("Exit").OnClick(func(ctx *application.Context) {
		s.app.Quit()
	})
	tray.SetMenu(menu)
}
