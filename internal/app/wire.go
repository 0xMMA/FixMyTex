//go:build wireinject

package app

import (
	"keylint/internal/features/clipboard"
	"keylint/internal/features/settings"
	"keylint/internal/features/shortcut"
	"keylint/internal/features/tray"
	"keylint/internal/features/welcome"

	"github.com/google/wire"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// App bundles all top-level services needed to run KeyLint.
type App struct {
	Settings  *settings.Service
	Welcome   *welcome.Service
	Shortcut  shortcut.Service
	Clipboard *clipboard.Service
	Tray      *tray.Service
}

// provideShortcutService wraps the platform constructor for Wire.
func provideShortcutService() shortcut.Service {
	return shortcut.NewPlatformService()
}

var serviceSet = wire.NewSet(
	settings.NewService,
	welcome.NewService,
	clipboard.NewService,
	provideShortcutService,
)

// InitializeApp is the Wire-generated constructor. Run `wire gen ./internal/app/`
// to produce wire_gen.go. The *application.App is provided externally.
func InitializeApp(wailsApp *application.App) (*App, error) {
	wire.Build(
		serviceSet,
		tray.NewService,
		wire.Struct(new(App), "*"),
	)
	return nil, nil
}
