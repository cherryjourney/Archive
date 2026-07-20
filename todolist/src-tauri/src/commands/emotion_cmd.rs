use crate::models::emotion::{EmotionEntry, EmotionHeatmapCell, SaveEmotionParams};
use crate::services::emotion_svc;
use crate::AppState;

#[tauri::command]
pub fn get_daily_emotion(
    state: tauri::State<AppState>,
    date: String,
) -> Result<EmotionEntry, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    emotion_svc::get_or_create(&db, &date)
}

#[tauri::command]
pub fn save_daily_emotion(
    state: tauri::State<AppState>,
    params: SaveEmotionParams,
) -> Result<EmotionEntry, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    emotion_svc::save(&db, &params)
}

#[tauri::command]
pub fn get_emotion_heatmap(
    state: tauri::State<AppState>,
    year: i32,
) -> Result<Vec<EmotionHeatmapCell>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    emotion_svc::list_for_heatmap(&db, year)
}
