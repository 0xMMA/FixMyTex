package main

import (
	"embed"
	"flag"
	"log"

	"fixmytex/internal/app"
	"fixmytex/internal/features/enhance"
	"fixmytex/internal/features/shortcut"
	"fixmytex/internal/features/updater"
	"fixmytex/internal/logger"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// AppVersion is injected at build time via -ldflags "-X main.AppVersion=x.y.z".
var AppVersion = "dev"

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	application.RegisterEvent[string]("shortcut:triggered")
	application.RegisterEvent[string]("settings:changed")
}

func main() {
	simulateShortcut := flag.Bool("simulate-shortcut", false, "Fire a synthetic shortcut event on startup (Linux dev mode)")
	flag.Parse()

	wailsApp := application.New(application.Options{
		Name:        "FixMyTex",
		Description: "AI-powered text enhancement",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	services, err := app.InitializeApp(wailsApp)
	if err != nil {
		log.Fatalf("failed to initialise app: %v", err)
	}

	// Initialize structured logger based on the saved setting.
	logger.Init(services.Settings.Get().DebugLogging)

	// Register backend services so the frontend can call their methods.
	wailsApp.RegisterService(application.NewService(services.Settings))
	wailsApp.RegisterService(application.NewService(services.Welcome))
	wailsApp.RegisterService(application.NewService(services.Clipboard))
	wailsApp.RegisterService(application.NewService(enhance.NewService(services.Settings)))

	// Updater service — AppVersion injected at build time via ldflags.
	wailsApp.RegisterService(application.NewService(updater.NewService(AppVersion)))

	// Dev-tools shortcut simulation service.
	sim := &simulateService{shortcut: services.Shortcut}
	wailsApp.RegisterService(application.NewService(sim))

	// Start the system tray.
	services.Tray.Setup()

	// Register the global shortcut (no-op on Linux).
	// Unregister on shutdown so dev-mode restarts don't leave a stale registration.
	if err := services.Shortcut.Register(); err != nil {
		log.Printf("warn: shortcut registration failed: %v", err)
	}
	wailsApp.OnShutdown(func() { services.Shortcut.Unregister() })

	// Forward shortcut events to the frontend.
	// First send Ctrl+C to copy selected text from the source app, then notify
	// the frontend so it can read the clipboard and enhance the text.
	go func() {
		ch := services.Shortcut.Triggered()
		for event := range ch {
			if err := services.Clipboard.CopyFromForeground(); err != nil {
				logger.Warn("shortcut: CopyFromForeground failed", "err", err)
			}
			wailsApp.Event.Emit("shortcut:triggered", event.Source)
		}
	}()

	// Simulate shortcut on startup when --simulate-shortcut flag is set.
	if *simulateShortcut {
		if s, ok := services.Shortcut.(interface{ Simulate() }); ok {
			go s.Simulate()
		}
	}

	wailsApp.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "FixMyTex",
		Width:            1280,
		Height:           800,
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	if err := wailsApp.Run(); err != nil {
		log.Fatal(err)
	}
}

// simulateService exposes SimulateShortcut to the frontend (used by dev-tools button).
type simulateService struct {
	shortcut shortcut.Service
}

func (s *simulateService) SimulateShortcut() {
	if sim, ok := s.shortcut.(interface{ Simulate() }); ok {
		sim.Simulate()
	}
}
