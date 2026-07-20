use std::fs;
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};
use sha2::Digest;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupManifest {
    pub version: String,
    pub app_version: String,
    pub created_at: String,
    pub db_size_bytes: u64,
    pub task_count: i32,
    pub document_count: i32,
    pub checksum: String,
}

pub fn export_backup(db_path: &str, target_path: &str, data_dir: &str) -> Result<String, String> {
    let db_file = Path::new(db_path);
    if !db_file.exists() {
        return Err("数据库文件不存在".to_string());
    }

    // 创建临时目录（使用应用数据目录而非硬编码路径）
    let temp_dir = Path::new(data_dir).join("export").join("temp");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    // 复制数据库文件
    let temp_db = temp_dir.join("todolist.db");
    fs::copy(db_file, &temp_db).map_err(|e| e.to_string())?;

    // 计算文件大小和哈希
    let metadata = fs::metadata(&temp_db).map_err(|e| e.to_string())?;
    let db_bytes = fs::read(&temp_db).map_err(|e| e.to_string())?;
    let checksum = format!("{:x}", sha2::Sha256::digest(&db_bytes));

    // 生成 manifest
    let manifest = BackupManifest {
        version: "1.0.0".to_string(),
        app_version: "1.0.0".to_string(),
        created_at: crate::utils::date::now_str(),
        db_size_bytes: metadata.len(),
        task_count: 0, // 后续从数据库查询
        document_count: 0,
        checksum,
    };

    let manifest_json =
        serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(temp_dir.join("backup_manifest.json"), manifest_json).map_err(|e| e.to_string())?;

    // 创建 zip 文件
    let target = Path::new(target_path);
    let zip_file = fs::File::create(target).map_err(|e| e.to_string())?;
    let mut zip_writer = zip::ZipWriter::new(zip_file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // 添加文件到 zip
    let files = vec!["todolist.db", "backup_manifest.json"];
    for file_name in files {
        let file_path = temp_dir.join(file_name);
        if file_path.exists() {
            zip_writer
                .start_file(file_name, options)
                .map_err(|e| e.to_string())?;
            let content = fs::read(&file_path).map_err(|e| e.to_string())?;
            zip_writer.write_all(&content).map_err(|e| e.to_string())?;
        }
    }

    zip_writer.finish().map_err(|e| e.to_string())?;

    // 清理临时文件
    fs::remove_dir_all(temp_dir).ok();

    Ok(target_path.to_string())
}

pub fn import_backup(source_path: &str, db_path: &str, data_dir: &str) -> Result<(), String> {
    let source = Path::new(source_path);
    if !source.exists() {
        return Err("备份文件不存在".to_string());
    }

    // 解压到临时目录（使用应用数据目录而非硬编码路径）
    let temp_dir = Path::new(data_dir).join("export").join("import_temp");
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let zip_file = fs::File::open(source).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = temp_dir.join(file.name());
        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            let mut out_file = fs::File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut out_file).map_err(|e| e.to_string())?;
        }
    }

    // 验证数据库
    let temp_db = temp_dir.join("todolist.db");
    if !temp_db.exists() {
        return Err("备份包中未找到数据库文件".to_string());
    }

    // 替换当前数据库
    let target_db = Path::new(db_path);
    if target_db.exists() {
        fs::copy(target_db, temp_dir.join("old_todolist.db")).map_err(|e| e.to_string())?;
    }
    fs::copy(&temp_db, target_db).map_err(|e| e.to_string())?;

    // 清理
    fs::remove_dir_all(temp_dir).ok();

    Ok(())
}
