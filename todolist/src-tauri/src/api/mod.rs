//! Archive·存迹 HTTP API — 供 Hermes Agent 等外部工具通过 HTTP 调用
//!
//! 监听 127.0.0.1:9721（仅本地，可通过 ARCHIVE_API_PORT 环境变量覆盖）
//!
//! 采用直接 SQL 查询方式，避免与服务层类型耦合。
//! 所有写操作通过 POST /api/query 执行 INSERT/UPDATE/DELETE。

use std::sync::{Arc, Mutex};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

use crate::db::Database;

// ── 共享状态 ──

#[derive(Clone)]
pub struct ApiState {
    pub db: Arc<Mutex<Database>>,
    pub data_dir: String,
}

// ── 通用响应 ──

#[derive(Serialize)]
pub struct ApiResponse {
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

impl ApiResponse {
    fn ok(data: serde_json::Value) -> Json<Self> {
        Json(Self { success: true, data, error: None })
    }
    fn err(msg: impl ToString) -> (StatusCode, Json<Self>) {
        (
            StatusCode::BAD_REQUEST,
            Json(Self { success: false, data: serde_json::Value::Null, error: Some(msg.to_string()) }),
        )
    }
}

// ── 启动 HTTP 服务器 ──

pub fn start(api_state: ApiState) {
    let port: u16 = std::env::var("ARCHIVE_API_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(9721);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([axum::http::Method::GET, axum::http::Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/query", axum::routing::post(raw_query_handler))
        .route("/api/tags", get(list_tags_handler))
        .route("/api/profile", get(get_profile_handler))
        .layer(cors)
        .with_state(api_state);

    let addr = format!("127.0.0.1:{}", port);
    println!("[API] HTTP server starting on {}", addr);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("Failed to build tokio runtime for API");
        rt.block_on(async {
            let listener = tokio::net::TcpListener::bind(&addr).await
                .unwrap_or_else(|_| panic!("Failed to bind on {}", addr));
            println!("[API] Listening on http://{}", addr);
            axum::serve(listener, app).await.expect("API server error");
        });
    });
}

async fn health() -> &'static str {
    "OK"
}

// ── 通用 SQL 查询/执行 ──

#[derive(Deserialize)]
pub struct SqlQuery {
    pub sql: String,
    pub params: Option<Vec<serde_json::Value>>,
}

#[derive(Serialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: usize,
    pub changes: usize,
}

async fn raw_query_handler(
    State(state): State<ApiState>,
    Json(body): Json<SqlQuery>,
) -> Result<Json<ApiResponse>, (StatusCode, Json<ApiResponse>)> {
    let sql_trimmed = body.sql.trim().to_string();
    let sql_lower = sql_trimmed.to_lowercase();

    let db = state.db.lock().map_err(|e| ApiResponse::err(e.to_string()))?;
    let conn = db.conn();

    // 根据 SQL 类型选择执行路径
    if sql_lower.starts_with("select") || sql_lower.starts_with("pragma") || sql_lower.starts_with("with") {
        // 只读查询
        let mut stmt = conn.prepare(&sql_trimmed).map_err(|e| ApiResponse::err(e.to_string()))?;
        let columns: Vec<String> = stmt.column_names().iter().map(|c| c.to_string()).collect();

        let params: Vec<Box<dyn rusqlite::types::ToSql>> = body.params.unwrap_or_default()
            .into_iter()
            .map(sql_value_to_param)
            .collect();
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        let rows_result = stmt.query_map(param_refs.as_slice(), |row| {
            let mut values = Vec::new();
            for i in 0..columns.len() {
                let val = match row.get_ref(i) {
                    Ok(rusqlite::types::ValueRef::Null) => serde_json::Value::Null,
                    Ok(rusqlite::types::ValueRef::Integer(i)) => serde_json::json!(i),
                    Ok(rusqlite::types::ValueRef::Real(f)) => serde_json::json!(f),
                    Ok(rusqlite::types::ValueRef::Text(t)) => {
                        serde_json::Value::String(std::str::from_utf8(t).unwrap_or("").to_string())
                    }
                    Ok(rusqlite::types::ValueRef::Blob(_)) => serde_json::Value::String("[blob]".into()),
                    Err(e) => serde_json::Value::String(format!("<err:{}>", e)),
                };
                values.push(val);
            }
            Ok(values)
        }).map_err(|e| ApiResponse::err(e.to_string()))?;

        let rows: Vec<Vec<serde_json::Value>> = rows_result.filter_map(|r| r.ok()).collect();
        let row_count = rows.len();
        Ok(ApiResponse::ok(serde_json::json!(QueryResult { columns, rows, row_count, changes: 0 })))
    } else if sql_lower.starts_with("insert") || sql_lower.starts_with("update") || sql_lower.starts_with("delete") {
        // 写操作
        let params: Vec<Box<dyn rusqlite::types::ToSql>> = body.params.unwrap_or_default()
            .into_iter()
            .map(sql_value_to_param)
            .collect();
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        conn.execute(&sql_trimmed, param_refs.as_slice())
            .map_err(|e| ApiResponse::err(e.to_string()))?;
        let changes = conn.changes();
        Ok(ApiResponse::ok(serde_json::json!({"changes": changes})))
    } else {
        Err(ApiResponse::err("Unsupported SQL statement type. Use SELECT/PRAGMA/WITH/INSERT/UPDATE/DELETE."))
    }
}

fn sql_value_to_param(v: serde_json::Value) -> Box<dyn rusqlite::types::ToSql> {
    match v {
        serde_json::Value::String(s) => Box::new(s),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Box::new(i)
            } else {
                Box::new(n.as_f64().unwrap_or(0.0))
            }
        }
        serde_json::Value::Null => Box::new(rusqlite::types::Null),
        serde_json::Value::Bool(b) => Box::new(if b { 1i32 } else { 0i32 }),
        _ => Box::new(v.to_string()),
    }
}

// ── 标签列表（简单快速） ──

async fn list_tags_handler(
    State(state): State<ApiState>,
) -> Result<Json<ApiResponse>, (StatusCode, Json<ApiResponse>)> {
    let db = state.db.lock().map_err(|e| ApiResponse::err(e.to_string()))?;
    let mut stmt = db.conn().prepare("SELECT id, name, color, source, vault_path, created_at FROM tags ORDER BY name")
        .map_err(|e| ApiResponse::err(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, String>(1)?,
            "color": row.get::<_, String>(2)?,
            "source": row.get::<_, String>(3)?,
            "vault_path": row.get::<_, String>(4)?,
            "created_at": row.get::<_, String>(5)?,
        }))
    }).map_err(|e| ApiResponse::err(e.to_string()))?;
    let tags: Vec<serde_json::Value> = rows.filter_map(|r| r.ok()).collect();
    Ok(ApiResponse::ok(serde_json::json!(tags)))
}

// ── 用户资料 ──

async fn get_profile_handler(
    State(state): State<ApiState>,
) -> Result<Json<ApiResponse>, (StatusCode, Json<ApiResponse>)> {
    let db = state.db.lock().map_err(|e| ApiResponse::err(e.to_string()))?;
    let mut stmt = db.conn().prepare("SELECT key, value FROM user_profile")
        .map_err(|e| ApiResponse::err(e.to_string()))?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| ApiResponse::err(e.to_string()))?;
    let profile: std::collections::HashMap<String, String> = rows.filter_map(|r| r.ok()).collect();
    Ok(ApiResponse::ok(serde_json::json!(profile)))
}
