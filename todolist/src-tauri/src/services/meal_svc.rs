use rusqlite::params;

use crate::db::Database;
use crate::models::meal::{DailyMeal, MealPaymentInput, SaveMealParams};

/// Get today's meal record, creating an empty one if it does not exist.
pub fn get_or_create(db: &Database, date: &str) -> Result<DailyMeal, String> {
    let result = db.conn().query_row(
        "SELECT date, breakfast, lunch, dinner, drinks,
                breakfast_cost, breakfast_account_id, breakfast_txn_id,
                lunch_cost, lunch_account_id, lunch_txn_id,
                dinner_cost, dinner_account_id, dinner_txn_id,
                drinks_cost, drinks_account_id, drinks_txn_id,
                created_at, updated_at
         FROM daily_meals WHERE date = ?1",
        params![date],
        |row| {
            Ok(DailyMeal {
                date: row.get(0)?,
                breakfast: row.get(1)?,
                lunch: row.get(2)?,
                dinner: row.get(3)?,
                drinks: row.get(4)?,
                breakfast_cost: row.get(5)?,
                breakfast_account_id: row.get(6)?,
                breakfast_txn_id: row.get(7)?,
                lunch_cost: row.get(8)?,
                lunch_account_id: row.get(9)?,
                lunch_txn_id: row.get(10)?,
                dinner_cost: row.get(11)?,
                dinner_account_id: row.get(12)?,
                dinner_txn_id: row.get(13)?,
                drinks_cost: row.get(14)?,
                drinks_account_id: row.get(15)?,
                drinks_txn_id: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        },
    );

    match result {
        Ok(meal) => Ok(meal),
        Err(_) => {
            db.conn()
                .execute(
                    "INSERT INTO daily_meals (date, breakfast, lunch, dinner, drinks, created_at, updated_at)
                     VALUES (?1, '', '', '', '', datetime('now','localtime'), datetime('now','localtime'))",
                    params![date],
                )
                .map_err(|e| e.to_string())?;

            Ok(DailyMeal {
                date: date.to_string(),
                breakfast: String::new(),
                lunch: String::new(),
                dinner: String::new(),
                drinks: String::new(),
                breakfast_cost: 0.0,
                breakfast_account_id: String::new(),
                breakfast_txn_id: String::new(),
                lunch_cost: 0.0,
                lunch_account_id: String::new(),
                lunch_txn_id: String::new(),
                dinner_cost: 0.0,
                dinner_account_id: String::new(),
                dinner_txn_id: String::new(),
                drinks_cost: 0.0,
                drinks_account_id: String::new(),
                drinks_txn_id: String::new(),
                created_at: String::new(),
                updated_at: String::new(),
            })
        }
    }
}

/// Delete an existing meal-payment transaction and reverse its account balance impact.
fn delete_meal_txn(db: &Database, txn_id: &str) -> Result<(), String> {
    if txn_id.is_empty() {
        return Ok(());
    }

    // Read the old transaction to reverse its balance impact
    let old: Option<(String, f64, String, Option<String>)> = db
        .conn()
        .query_row(
            "SELECT type, amount, account_id, target_account_id FROM transactions WHERE id = ?1",
            params![txn_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .ok();

    if let Some((t, amount, account_id, target_id)) = old {
        let abs_amount = amount.abs();
        // Reverse the balance change
        match t.as_str() {
            "expense" => {
                db.conn()
                    .execute(
                        "UPDATE accounts SET balance = balance + ?1, updated_at = datetime('now','localtime') WHERE id = ?2",
                        params![abs_amount, account_id],
                    )
                    .map_err(|e| e.to_string())?;
            }
            "income" => {
                db.conn()
                    .execute(
                        "UPDATE accounts SET balance = balance - ?1, updated_at = datetime('now','localtime') WHERE id = ?2",
                        params![abs_amount, account_id],
                    )
                    .map_err(|e| e.to_string())?;
            }
            _ => {}
        }
        // For transfers, also reverse target account
        if t == "transfer_out" {
            if let Some(ref tid) = target_id {
                db.conn()
                    .execute(
                        "UPDATE accounts SET balance = balance - ?1, updated_at = datetime('now','localtime') WHERE id = ?2",
                        params![abs_amount, tid],
                    )
                    .map_err(|e| e.to_string())?;
            }
        }
    }

    // Delete the old transaction (and its paired transfer record)
    db.conn()
        .execute("DELETE FROM transactions WHERE id = ?1 OR transfer_id = ?1", params![txn_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Create an expense transaction for a meal and return its transaction ID.
fn create_meal_txn(
    db: &Database,
    date: &str,
    cost: f64,
    account_id: &str,
    note: &str,
) -> Result<String, String> {
    if cost <= 0.0 || account_id.is_empty() {
        return Ok(String::new());
    }

    let txn_id = crate::utils::id::generate_id();

    // Deduct from account balance
    db.conn()
        .execute(
            "UPDATE accounts SET balance = balance - ?1, updated_at = datetime('now','localtime') WHERE id = ?2",
            params![cost, account_id],
        )
        .map_err(|e| e.to_string())?;

    // Food/dining category is id=2
    db.conn()
        .execute(
            "INSERT INTO transactions (id, type, amount, category_id, account_id, date, note)
             VALUES (?1, 'expense', ?2, 2, ?3, ?4, ?5)",
            params![txn_id, cost, account_id, date, note],
        )
        .map_err(|e| e.to_string())?;

    Ok(txn_id)
}

/// Save (upsert) meals for a date, including payment info.
pub fn save(db: &Database, params: &SaveMealParams) -> Result<DailyMeal, String> {
    // First get existing record to know old txn IDs
    let existing = get_or_create(db, &params.date)?;

    // Delete old meal transactions for meals that are being updated, then create new ones
    let meal_ops = [
        ("breakfast", &params.breakfast, &params.breakfast_payment, &existing.breakfast_txn_id),
        ("lunch", &params.lunch, &params.lunch_payment, &existing.lunch_txn_id),
        ("dinner", &params.dinner, &params.dinner_payment, &existing.dinner_txn_id),
        ("drinks", &params.drinks, &params.drinks_payment, &existing.drinks_txn_id),
    ];

    let meal_cn: [(&str, &str); 4] = [
        ("breakfast", "早餐"),
        ("lunch", "午餐"),
        ("dinner", "晚餐"),
        ("drinks", "饮料"),
    ];

    let mut new_txn_ids: Vec<(String, String)> = Vec::new(); // (column_prefix, txn_id)
    for (meal_type, _content, payment_opt, old_txn_id) in &meal_ops {
        // Delete old transaction if it exists
        delete_meal_txn(db, old_txn_id)?;

        // Create new transaction if payment info provided
        if let Some(ref payment) = payment_opt {
            if payment.cost > 0.0 && !payment.account_id.is_empty() {
                let cn_name = meal_cn.iter().find(|(k, _)| k == meal_type).map(|(_, v)| *v).unwrap_or(meal_type);
                let note = format!("{} · {}", cn_name, params.date);
                let new_id = create_meal_txn(db, &params.date, payment.cost, &payment.account_id, &note)?;
                new_txn_ids.push((format!("{}_txn_id", meal_type), new_id));
            }
        }
    }

    // Build payment column values and execute UPSERT
    let (bf_cost, bf_acct, bf_txn) = get_payment_values(&params.breakfast_payment, &new_txn_ids, "breakfast");
    let (lu_cost, lu_acct, lu_txn) = get_payment_values(&params.lunch_payment, &new_txn_ids, "lunch");
    let (di_cost, di_acct, di_txn) = get_payment_values(&params.dinner_payment, &new_txn_ids, "dinner");
    let (dr_cost, dr_acct, dr_txn) = get_payment_values(&params.drinks_payment, &new_txn_ids, "drinks");

    db.conn()
        .execute(
            "INSERT INTO daily_meals (
                date, breakfast, lunch, dinner, drinks,
                breakfast_cost, breakfast_account_id, breakfast_txn_id,
                lunch_cost, lunch_account_id, lunch_txn_id,
                dinner_cost, dinner_account_id, dinner_txn_id,
                drinks_cost, drinks_account_id, drinks_txn_id,
                created_at, updated_at
             ) VALUES (
                ?1, ?2, ?3, ?4, ?5,
                ?6, ?7, ?8,
                ?9, ?10, ?11,
                ?12, ?13, ?14,
                ?15, ?16, ?17,
                datetime('now','localtime'), datetime('now','localtime')
             )
             ON CONFLICT(date) DO UPDATE SET
               breakfast = excluded.breakfast,
               lunch = excluded.lunch,
               dinner = excluded.dinner,
               drinks = excluded.drinks,
               breakfast_cost = excluded.breakfast_cost,
               breakfast_account_id = excluded.breakfast_account_id,
               breakfast_txn_id = excluded.breakfast_txn_id,
               lunch_cost = excluded.lunch_cost,
               lunch_account_id = excluded.lunch_account_id,
               lunch_txn_id = excluded.lunch_txn_id,
               dinner_cost = excluded.dinner_cost,
               dinner_account_id = excluded.dinner_account_id,
               dinner_txn_id = excluded.dinner_txn_id,
               drinks_cost = excluded.drinks_cost,
               drinks_account_id = excluded.drinks_account_id,
               drinks_txn_id = excluded.drinks_txn_id,
               updated_at = datetime('now','localtime')",
            params![
                params.date, params.breakfast, params.lunch, params.dinner, params.drinks,
                bf_cost, bf_acct, bf_txn,
                lu_cost, lu_acct, lu_txn,
                di_cost, di_acct, di_txn,
                dr_cost, dr_acct, dr_txn,
            ],
        )
        .map_err(|e| e.to_string())?;

    get_or_create(db, &params.date)
}

fn get_payment_values(
    payment: &Option<MealPaymentInput>,
    new_txn_ids: &[(String, String)],
    meal_type: &str,
) -> (f64, String, String) {
    if let Some(ref p) = payment {
        let txn_key = format!("{}_txn_id", meal_type);
        let txn_id = new_txn_ids.iter().find(|(k, _)| k == &txn_key).map(|(_, v)| v.clone()).unwrap_or_default();
        (p.cost, p.account_id.clone(), txn_id)
    } else {
        (0.0, String::new(), String::new())
    }
}

/// Delete a daily meal record and any linked expense transactions.
pub fn delete(db: &Database, date: &str) -> Result<(), String> {
    // First, clean up any linked transactions
    let meal = get_or_create(db, date)?;
    for txn_id in [&meal.breakfast_txn_id, &meal.lunch_txn_id, &meal.dinner_txn_id, &meal.drinks_txn_id] {
        delete_meal_txn(db, txn_id)?;
    }
    db.conn()
        .execute("DELETE FROM daily_meals WHERE date = ?1", params![date])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// List all dates that have meal records (with optional non-empty content).
/// Returns dates in descending order (newest first).
pub fn list_dates(db: &Database) -> Result<Vec<String>, String> {
    let mut stmt = db
        .conn()
        .prepare("SELECT date FROM daily_meals WHERE breakfast != '' OR lunch != '' OR dinner != '' OR drinks != '' ORDER BY date DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
