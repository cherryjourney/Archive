use crate::models::finance::*;
use rusqlite::params;

// ─── 分类 ───

pub fn list_categories(db: &crate::db::Database) -> Result<Vec<TransactionCategory>, String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT id, name, icon, color, created_at FROM transaction_categories ORDER BY id")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(TransactionCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── 账户 ───

pub fn create_account(db: &crate::db::Database, id: &str, params: &CreateAccountParams) -> Result<(), String> {
    db.conn()
        .execute(
            "INSERT INTO accounts (id, name, balance, is_savings, color) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, params.name, params.balance, params.is_savings as i32, params.color],
        )
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_account(db: &crate::db::Database, id: &str, params: &UpdateAccountParams) -> Result<(), String> {
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.name { sets.push("name = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.balance { sets.push("balance = ?".into()); values.push(Box::new(v)); }
    if let Some(v) = params.is_savings { sets.push("is_savings = ?".into()); values.push(Box::new(v as i32)); }
    if let Some(ref v) = params.color { sets.push("color = ?".into()); values.push(Box::new(v.clone())); }

    if sets.len() == 1 { return Ok(()); }

    let sql = format!("UPDATE accounts SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_account(db: &crate::db::Database, id: &str) -> Result<(), String> {
    let count: i64 = db
        .conn()
        .query_row("SELECT COUNT(*) FROM transactions WHERE account_id = ?1 OR target_account_id = ?1", params![id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if count > 0 {
        return Err("该账户有关联交易记录，请先删除相关记录".to_string());
    }
    db.conn().execute("DELETE FROM accounts WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_accounts(db: &crate::db::Database) -> Result<Vec<Account>, String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT id, name, balance, is_savings, color, created_at, updated_at FROM accounts ORDER BY is_savings DESC, created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Account {
                id: row.get(0)?,
                name: row.get(1)?,
                balance: row.get(2)?,
                is_savings: row.get::<_, i32>(3)? != 0,
                color: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── 交易记录 ───

pub fn create_transaction(db: &crate::db::Database, id: &str, params: &CreateTransactionParams) -> Result<(), String> {
    // 更新账户余额
    let amount_abs = params.amount.abs();
    match params.type_.as_str() {
        "expense" | "transfer_out" => {
            db.conn()
                .execute("UPDATE accounts SET balance = balance - ?1, updated_at = datetime('now','localtime') WHERE id = ?2", params![amount_abs, params.account_id])
                .map_err(|e| e.to_string())?;
        }
        "income" | "transfer_in" => {
            db.conn()
                .execute("UPDATE accounts SET balance = balance + ?1, updated_at = datetime('now','localtime') WHERE id = ?2", params![amount_abs, params.account_id])
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("无效的交易类型".to_string()),
    }

    // 转账：更新目标账户余额
    if params.type_ == "transfer_out" {
        if let Some(ref target_id) = params.target_account_id {
            db.conn()
                .execute("UPDATE accounts SET balance = balance + ?1, updated_at = datetime('now','localtime') WHERE id = ?2", params![amount_abs, target_id])
                .map_err(|e| e.to_string())?;
        }
    }

    db.conn()
        .execute(
            "INSERT INTO transactions (id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, params.type_, params.amount, params.category_id, params.account_id, params.target_account_id, params.target_account_id.as_ref().map(|_| id), params.date, params.note],
        )
        .map_err(|e| e.to_string())?;

    // 转账：创建目标账户的配对记录
    if params.type_ == "transfer_out" {
        if let Some(ref target_id) = params.target_account_id {
            let pair_id = format!("{}-pair", id);
            db.conn()
                .execute(
                    "INSERT INTO transactions (id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note)
                     VALUES (?1, 'transfer_in', ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![pair_id, params.amount, params.category_id, target_id, params.account_id, id, params.date, params.note],
                )
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

pub fn update_transaction(db: &crate::db::Database, id: &str, params: &UpdateTransactionParams) -> Result<(), String> {
    // 先获取原记录，回滚余额
    let old: Transaction = db.conn()
        .query_row("SELECT id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note, created_at, updated_at FROM transactions WHERE id = ?1", params![id], |row| {
            Ok(Transaction {
                id: row.get(0)?, type_: row.get(1)?, amount: row.get(2)?, category_id: row.get(3)?,
                account_id: row.get(4)?, target_account_id: row.get(5)?, transfer_id: row.get(6)?,
                date: row.get(7)?, note: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    // 回滚原余额变更
    match old.type_.as_str() {
        "expense" | "transfer_out" => {
            db.conn().execute("UPDATE accounts SET balance = balance + ?1 WHERE id = ?2", params![old.amount, old.account_id]).map_err(|e| e.to_string())?;
        }
        "income" | "transfer_in" => {
            db.conn().execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![old.amount, old.account_id]).map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    // 应用新余额变更
    let new_type = params.type_.as_deref().unwrap_or(&old.type_);
    let new_amount = params.amount.unwrap_or(old.amount).abs();
    let new_account = params.account_id.as_deref().unwrap_or(&old.account_id);

    match new_type {
        "expense" | "transfer_out" => {
            db.conn().execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![new_amount, new_account]).map_err(|e| e.to_string())?;
        }
        "income" | "transfer_in" => {
            db.conn().execute("UPDATE accounts SET balance = balance + ?1 WHERE id = ?2", params![new_amount, new_account]).map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    // 更新记录字段
    let mut sets: Vec<String> = vec!["updated_at = datetime('now','localtime')".to_string()];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref v) = params.type_ { sets.push("type = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(v) = params.amount { sets.push("amount = ?".into()); values.push(Box::new(v)); }
    if let Some(v) = params.category_id { sets.push("category_id = ?".into()); values.push(Box::new(v)); }
    if let Some(ref v) = params.account_id { sets.push("account_id = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.date { sets.push("date = ?".into()); values.push(Box::new(v.clone())); }
    if let Some(ref v) = params.note { sets.push("note = ?".into()); values.push(Box::new(v.clone())); }

    let sql = format!("UPDATE transactions SET {} WHERE id = ?", sets.join(", "));
    values.push(Box::new(id.to_string()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    db.conn().execute(&sql, params_refs.as_slice()).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn delete_transaction(db: &crate::db::Database, id: &str) -> Result<(), String> {
    let old: Transaction = db.conn()
        .query_row("SELECT id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note, created_at, updated_at FROM transactions WHERE id = ?1", params![id], |row| {
            Ok(Transaction {
                id: row.get(0)?, type_: row.get(1)?, amount: row.get(2)?, category_id: row.get(3)?,
                account_id: row.get(4)?, target_account_id: row.get(5)?, transfer_id: row.get(6)?,
                date: row.get(7)?, note: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    // 回滚余额
    match old.type_.as_str() {
        "expense" | "transfer_out" => {
            db.conn().execute("UPDATE accounts SET balance = balance + ?1 WHERE id = ?2", params![old.amount, old.account_id]).map_err(|e| e.to_string())?;
            if let Some(ref target_id) = old.target_account_id {
                db.conn().execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![old.amount, target_id]).map_err(|e| e.to_string())?;
            }
        }
        "income" | "transfer_in" => {
            db.conn().execute("UPDATE accounts SET balance = balance - ?1 WHERE id = ?2", params![old.amount, old.account_id]).map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    // 删除配对转账记录
    if let Some(ref transfer_id) = old.transfer_id {
        db.conn().execute("DELETE FROM transactions WHERE transfer_id = ?1 AND id != ?1", params![transfer_id, id]).map_err(|e| e.to_string())?;
    }

    db.conn().execute("DELETE FROM transactions WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_transactions(db: &crate::db::Database, filter: &TransactionFilter) -> Result<Vec<Transaction>, String> {
    let mut sql = String::from("SELECT id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note, created_at, updated_at FROM transactions WHERE 1=1");
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(y) = filter.year {
        sql.push_str(&format!(" AND strftime('%Y', date) = '{}'", y));
    }
    if let Some(m) = filter.month {
        sql.push_str(&format!(" AND strftime('%m', date) = '{:02}'", m));
    }
    if let Some(ref t) = filter.type_ {
        sql.push_str(" AND type = ?");
        values.push(Box::new(t.clone()));
    }
    if let Some(c) = filter.category_id {
        sql.push_str(" AND category_id = ?");
        values.push(Box::new(c));
    }
    if let Some(ref a) = filter.account_id {
        sql.push_str(" AND account_id = ?");
        values.push(Box::new(a.clone()));
    }
    if let Some(ref kw) = filter.keyword {
        sql.push_str(" AND note LIKE ?");
        values.push(Box::new(format!("%{}%", kw)));
    }

    sql.push_str(" ORDER BY date DESC, created_at DESC");

    let mut stmt = db.conn().prepare(&sql).map_err(|e| e.to_string())?;
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|v| v.as_ref()).collect();
    let rows = stmt
        .query_map(params_refs.as_slice(), |row| {
            Ok(Transaction {
                id: row.get(0)?, type_: row.get(1)?, amount: row.get(2)?, category_id: row.get(3)?,
                account_id: row.get(4)?, target_account_id: row.get(5)?, transfer_id: row.get(6)?,
                date: row.get(7)?, note: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ─── 统计 ───

pub fn get_finance_stats(db: &crate::db::Database, year: i32, month: i32) -> Result<FinanceStats, String> {
    let month_str = format!("{}-{:02}", year, month);

    let expense: (f64, i64) = db.conn().query_row(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?1",
        params![month_str],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    let income: (f64, i64) = db.conn().query_row(
        "SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM transactions WHERE type = 'income' AND strftime('%Y-%m', date) = ?1",
        params![month_str],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    let savings: (f64, i64) = db.conn().query_row(
        "SELECT COALESCE(SUM(balance), 0), COUNT(*) FROM accounts WHERE is_savings = 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    let all_balance: f64 = db.conn().query_row(
        "SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE is_savings = 0",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(FinanceStats {
        monthly_expense: expense.0,
        monthly_income: income.0,
        savings_total: savings.0,
        net_worth: savings.0 + all_balance,
        expense_count: expense.1,
        income_count: income.1,
        savings_count: savings.1,
    })
}

pub fn get_monthly_chart(db: &crate::db::Database, year: i32) -> Result<Vec<MonthlyChartData>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT strftime('%Y-%m', date) as month, type, COALESCE(SUM(amount), 0)
         FROM transactions WHERE strftime('%Y', date) = ?1 AND type IN ('expense', 'income')
         GROUP BY month, type ORDER BY month"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![year.to_string()], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, f64>(2)?))
    }).map_err(|e| e.to_string())?;

    let mut data: Vec<MonthlyChartData> = Vec::new();
    for row in rows {
        let (month, t, amount) = row.map_err(|e| e.to_string())?;
        match data.iter_mut().find(|d| d.month == month) {
            Some(entry) => {
                if t == "expense" { entry.expense = amount; } else { entry.income = amount; }
            }
            None => {
                let (exp, inc) = if t == "expense" { (amount, 0.0) } else { (0.0, amount) };
                data.push(MonthlyChartData { month, expense: exp, income: inc });
            }
        }
    }
    Ok(data)
}

pub fn get_category_stats(db: &crate::db::Database, year: i32, month: i32) -> Result<Vec<CategoryStat>, String> {
    let month_str = format!("{}-{:02}", year, month);
    let mut stmt = db.conn().prepare(
        "SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0), COUNT(t.id)
         FROM transaction_categories c
         LEFT JOIN transactions t ON c.id = t.category_id AND t.type = 'expense' AND strftime('%Y-%m', t.date) = ?1
         GROUP BY c.id ORDER BY SUM(t.amount) DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![month_str], |row| {
        Ok(CategoryStat {
            category_id: row.get(0)?, category_name: row.get(1)?, category_color: row.get(2)?,
            total: row.get(3)?, count: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_daily_heatmap(db: &crate::db::Database, year: i32, month: i32) -> Result<Vec<DailyHeatmapCell>, String> {
    let month_str = format!("{}-{:02}", year, month);
    let mut stmt = db.conn().prepare(
        "SELECT date, COALESCE(SUM(amount), 0)
         FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = ?1
         GROUP BY date ORDER BY date"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![month_str], |row| {
        Ok(DailyHeatmapCell { date: row.get(0)?, expense: row.get(1)? })
    }).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_net_worth_trend(db: &crate::db::Database) -> Result<Vec<NetWorthPoint>, String> {
    let mut stmt = db.conn().prepare(
        "SELECT strftime('%Y-%m', date) as month,
         (SELECT COALESCE(SUM(balance), 0) FROM accounts)
         FROM transactions GROUP BY month ORDER BY month LIMIT 12"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(NetWorthPoint { month: row.get(0)?, net_worth: row.get(1)? })
    }).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn get_transaction_by_id(db: &crate::db::Database, id: &str) -> Result<Transaction, String> {
    db.conn().query_row(
        "SELECT id, type, amount, category_id, account_id, target_account_id, transfer_id, date, note, created_at, updated_at FROM transactions WHERE id = ?1",
        params![id],
        |row| Ok(Transaction {
            id: row.get(0)?, type_: row.get(1)?, amount: row.get(2)?, category_id: row.get(3)?,
            account_id: row.get(4)?, target_account_id: row.get(5)?, transfer_id: row.get(6)?,
            date: row.get(7)?, note: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
        }),
    ).map_err(|e| e.to_string())
}
