use tauri::command;

// Enum for keyboard shortcuts
enum KeyboardShortcut {
    Copy,
    Paste,
}

/// Get the name of the currently focused application
#[command]
pub fn get_focused_app_name() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        match internal::get_focused_app_name_windows() {
            Ok(name) => Ok(name),
            Err(e) => Err(format!("Failed to get focused app name: {}", e)),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Not implemented for this platform".to_string())
    }
}

/// Send a copy command (Ctrl+C) to the currently focused application
#[command]
pub fn send_copy_command() -> Result<(), String> {
    send_keyboard_shortcut(KeyboardShortcut::Copy)
}

/// Send a paste command (Ctrl+V) to the currently focused application
#[command]
pub fn send_paste_command() -> Result<(), String> {
    send_keyboard_shortcut(KeyboardShortcut::Paste)
}

// Send a keyboard shortcut
fn send_keyboard_shortcut(shortcut: KeyboardShortcut) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        match internal::send_keyboard_shortcut_windows(shortcut) {
            Ok(()) => Ok(()),
            Err(e) => Err(format!("Failed to send keyboard shortcut: {}", e)),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Not implemented for this platform".to_string())
    }
}

// Internal implementation details
mod internal {
    use super::KeyboardShortcut;
    use std::io;

    #[cfg(target_os = "windows")]
    pub fn get_focused_app_name_windows() -> Result<String, io::Error> {
        //use ::windows::Win32::Foundation::HWND;
        use ::windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};

        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0 == std::ptr::null_mut() {
                return Err(io::Error::new(
                    io::ErrorKind::Other,
                    "No foreground window found",
                ));
            }

            let mut text: [u16; 512] = [0; 512];
            let len = GetWindowTextW(hwnd, &mut text);
            if len == 0 {
                return Err(io::Error::new(
                    io::ErrorKind::Other,
                    "Failed to get window title",
                ));
            }

            let window_title = String::from_utf16_lossy(&text[..len as usize]);
            Ok(window_title)
        }
    }

    #[cfg(target_os = "windows")]
    pub fn send_keyboard_shortcut_windows(shortcut: KeyboardShortcut) -> Result<(), io::Error> {
        use ::windows::Win32::UI::Input::KeyboardAndMouse::{
            SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
            KEYEVENTF_KEYUP, VK_C, VK_CONTROL, VK_V,
        };

        let key = match shortcut {
            KeyboardShortcut::Copy => VK_C,
            KeyboardShortcut::Paste => VK_V,
        };

        unsafe {
            // Press Ctrl+Key
            let mut inputs = [
                // Ctrl down
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_CONTROL,
                            wScan: 0,
                            dwFlags: KEYBD_EVENT_FLAGS(0),
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // Key down
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: key,
                            wScan: 0,
                            dwFlags: KEYBD_EVENT_FLAGS(0),
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // Key up
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: key,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
                // Ctrl up
                INPUT {
                    r#type: INPUT_KEYBOARD,
                    Anonymous: INPUT_0 {
                        ki: KEYBDINPUT {
                            wVk: VK_CONTROL,
                            wScan: 0,
                            dwFlags: KEYEVENTF_KEYUP,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                },
            ];

            let result = SendInput(&mut inputs, std::mem::size_of::<INPUT>() as i32);
            if result == 0 {
                return Err(io::Error::new(
                    io::ErrorKind::Other,
                    "Failed to send keyboard input",
                ));
            }

            Ok(())
        }
    }
}
