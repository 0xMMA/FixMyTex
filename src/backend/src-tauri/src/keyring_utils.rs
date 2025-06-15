use keyring::Entry;
use tauri::command;

const SERVICE_NAME: &str = "FixMyTex";

/// Store an API key in the keyring
/// 
/// # Arguments
/// 
/// * `provider` - The provider name (e.g., "openai", "anthropic")
/// * `api_key` - The API key to store
/// 
/// # Returns
/// 
/// * `Result<(), String>` - Ok(()) if successful, Err with error message otherwise
#[command]
pub fn store_api_key(provider: &str, api_key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry.set_password(api_key)
        .map_err(|e| format!("Failed to store API key: {}", e))
}

/// Retrieve an API key from the keyring
/// 
/// # Arguments
/// 
/// * `provider` - The provider name (e.g., "openai", "anthropic")
/// 
/// # Returns
/// 
/// * `Result<String, String>` - Ok(api_key) if successful, Err with error message otherwise
#[command]
pub fn get_api_key(provider: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry.get_password()
        .map_err(|e| format!("Failed to retrieve API key: {}", e))
}

/// Delete an API key from the keyring
/// 
/// # Arguments
/// 
/// * `provider` - The provider name (e.g., "openai", "anthropic")
/// 
/// # Returns
/// 
/// * `Result<(), String>` - Ok(()) if successful, Err with error message otherwise
#[command]
pub fn delete_api_key(provider: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, provider)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry.delete_credential()
        .map_err(|e| format!("Failed to delete API key: {}", e))
}
