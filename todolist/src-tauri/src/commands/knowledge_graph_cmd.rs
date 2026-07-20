use crate::models::knowledge_graph::{KnowledgeContext, KnowledgeGraphData};
use crate::services::knowledge_graph_svc;
use crate::AppState;

/// Build a full knowledge graph from all vault wikilinks
#[tauri::command]
pub fn build_knowledge_graph(
    state: tauri::State<AppState>,
) -> Result<KnowledgeGraphData, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    knowledge_graph_svc::build_knowledge_graph(&db, &vault_path)
}

/// Get combined knowledge context for a task (tag-matched notes + graph neighbors)
#[tauri::command]
pub fn get_task_knowledge_context(
    state: tauri::State<AppState>,
    task_id: String,
) -> Result<KnowledgeContext, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_path: String = db
        .conn()
        .query_row(
            "SELECT value FROM app_config WHERE key='vault_path'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_default();

    if vault_path.is_empty() {
        return Err("Vault 路径未配置".into());
    }

    knowledge_graph_svc::get_task_knowledge_context(&db, &vault_path, &task_id)
}
