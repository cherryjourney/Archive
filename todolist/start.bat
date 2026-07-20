@echo off
chcp 65001 >nul
echo 🚀 TodoList+ 启动中...
echo.

set RUSTUP_HOME=D:\rust\.rustup
set CARGO_HOME=D:\rust\.cargo
set MINGW_BIN=D:\tools\mingw64\bin
set MINGW_GIT_BIN=D:\Git\mingw64\bin
set RUST_SELF=D:\rust\.rustup\toolchains\stable-x86_64-pc-windows-gnu\lib\rustlib\x86_64-pc-windows-gnu\bin\self-contained
set PATH=D:\rust\.cargo\bin;D:\nodejs;%MINGW_BIN%;%MINGW_GIT_BIN%;%RUST_SELF%;%PATH%

cd /d D:\TODO\todolist
cargo tauri dev
