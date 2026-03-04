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

/// Send a paste command (Ctrl+V) to the application with the given name
/// If source_app_name is provided, it will try to find and focus that window before sending the paste command
#[command]
pub fn send_paste_command(source_app_name: Option<String>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Some(app_name) = source_app_name {
            // Try to find and focus the window by name
            if let Err(e) = internal::find_and_focus_window_by_name_windows(&app_name) {
                // Log the error but continue - we'll try to paste to the currently focused window
                eprintln!("Failed to find and focus window '{}': {}", app_name, e);
            }
        }
    }

    // Send the paste command to the currently focused window
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
            if hwnd.is_invalid() {
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
    pub fn find_and_focus_window_by_name_windows(window_name: &str) -> Result<(), io::Error> {
        use ::windows::Win32::Foundation::{HWND, LPARAM};
        use ::windows::Win32::UI::WindowsAndMessaging::{
            EnumWindows, GetWindowTextW, SetForegroundWindow, ShowWindow, SW_RESTORE,
        };

        // Log the window name we're searching for
        eprintln!("Searching for window with name: '{}'", window_name);

        // Structure to hold the window handle and name we're looking for
        struct EnumWindowsData {
            target_name: String,
            hwnd: Option<HWND>,
            windows_checked: u32,
        }

        // Callback function for EnumWindows
        extern "system" fn enum_windows_callback(
            hwnd: HWND,
            lparam: LPARAM,
        ) -> ::windows::core::BOOL {
            unsafe {
                let data = &mut *(lparam.0 as *mut EnumWindowsData);
                data.windows_checked += 1;

                // Get the window title
                let mut text: [u16; 512] = [0; 512];
                let len = GetWindowTextW(hwnd, &mut text);

                if len > 0 {
                    let window_title = String::from_utf16_lossy(&text[..len as usize]);

                    // Log the window title we're checking
                    eprintln!(
                        "Checking window #{}: '{}'",
                        data.windows_checked, window_title
                    );

                    // Check if this window title contains our target name
                    if window_title.contains(&data.target_name) {
                        eprintln!("Found matching window: '{}'", window_title);
                        data.hwnd = Some(hwnd);
                        return false.into(); // Stop enumeration
                    }
                }

                true.into() // Continue enumeration
            }
        }

        // Initialize the data structure
        let mut data = EnumWindowsData {
            target_name: window_name.to_string(),
            hwnd: None,
            windows_checked: 0,
        };

        // Enumerate all windows
        unsafe {
            EnumWindows(
                Some(enum_windows_callback),
                LPARAM(&mut data as *mut _ as isize),
            );
        }

        // If we found the window, set focus to it
        if let Some(hwnd) = data.hwnd {
            unsafe {
                // Restore the window if it's minimized
                ShowWindow(hwnd, SW_RESTORE);

                // Set focus to the window
                if !SetForegroundWindow(hwnd).as_bool() {
                    eprintln!("Failed to set foreground window for '{}'", window_name);
                    return Err(io::Error::new(
                        io::ErrorKind::Other,
                        "Failed to set foreground window",
                    ));
                }

                // Give a small delay to allow the window to gain focus
                std::thread::sleep(std::time::Duration::from_millis(100));

                eprintln!(
                    "Successfully set focus to window with name '{}'",
                    window_name
                );
                return Ok(());
            }
        }

        eprintln!(
            "No matching window found for '{}' after checking {} windows",
            window_name, data.windows_checked
        );

        Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Window with name '{}' not found", window_name),
        ))
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
