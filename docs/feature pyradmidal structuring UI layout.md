app:
  title: "FixMyTex"
  
  system_tray:
    icon: "fixmytex_icon"
    tooltip: "FixMyTex - AI Writing Assistant"
    menu:
      - label: "Open"
        action: show_communication_assistant
      - label: "Settings"
        action: show_settings_window
      - separator: true
      - label: "Quit"
        action: exit_application
  
  pages:
    
    - name: "communication_assistant"
      title: "Communication Assistant"
      layout: split_horizontal
      
      left_side:
        name: "Settings"
        type: form_controls
        rows:
          - checkboxes: ["Fix Grammar", "Pyramidal Structure", "Simplify"]
          - dropdowns: 
              - translate: ["None", "English", "German", "Spanish"]
              - communication_style: 
                  options:
                    - "Conversational" # Chat, messages, casual emails
                    - "Broadcast" # Announcements, social posts, newsletters  
                    - "Reference" # Documentation, wikis, guides
                    - "Transactional" # Formal emails, reports, proposals
              - relationship_level:
                  options:
                    - "Close" # Friends, close colleagues - direct, assume context
                    - "Professional" # Business contacts - balanced formality
                    - "Authority" # Boss, officials - careful, respectful  
                    - "Public" # Unknown audience - inclusive, assume no context
        
      right_side:
        layout: stack_vertical
        sections:
          - name: "Text_and_History"
            type: tabbed_view_with_history
            tabs:
              - draft: current_text
              - original: source_text
              - history: 
                  type: tree_view
                  shows: version_branches
                  format: fork_visualization
          
          - name: "Actions" 
            type: button_grid
            buttons:
              row1: ["Concise", "Detail/Expand"]
              row2: ["Persuasive", "Neutral"] 
              row3: ["Diplomatic", "Direct"]
              row4: ["Casual", "Professional"]
    
    - name: "general_config"
      title: "General config"
      layout: single_column
      sections:
        
        - name: "System"
          type: form_controls
          items:
            - type: toggle
              label: "Autostart with windows"
              default: enabled
        
        - name: "Shortcuts"
          type: form_group
          items:
            
            - subsection: "Silent Fix"
              type: shortcut_input
              default_value: "STRG+G"
            
            - subsection: "UI Assistant"
              type: radio_group_with_input
              options:
                - type: radio
                  label: "double click"
                  selected: false
                - type: radio_with_input
                  label: "shortcut"
                  selected: true
                  input_value: "STRG+G"

    - name: "api_config"
      title: "API config"
      layout: single_column
      sections:
        
        - name: "AI Provider"
          type: dropdown_with_description
          selected: "Claude"
          options: ["Claude", "OpenAI", "Other"]
          description: "Select which AI provider to use for text correction"
        
        - name: "Model"
          type: dropdown_with_description
          selected: "gpt-4o"
          options: ["gpt-4o", "claude-3-sonnet", "claude-3-opus"]
          description: "Select which model to use for the selected provider"
        
        - name: "API Key"
          type: secure_input_with_button
          placeholder: "Enter API key"
          button_label: "Save Key"
          status_message: "No API key found in environment variable (OPENAI_API_KEY)"
        
        - name: "API Keys Help"
          type: info_panel
          content:
            - "To use OpenAI API: Set the OPENAI_API_KEY environment variable or enter it above"
            - "To use Claude API: Set the ANTHROPIC_API_KEY environment variable or enter it above"
            - "API keys are stored securely in your user environment variables"

data:
  current_text: working_version
  source_text: original_input
  history: branching_tree_of_changes
  user_settings: form_values
  config_settings: system_preferences
  api_settings: provider_configurations

behaviors:
  button_press: transform_text_and_save_to_history
  history_node_click: load_selected_version
  setting_change: update_ai_context
  config_change: update_system_settings
  api_change: update_provider_settings
  tray_action: handle_system_tray_interactions