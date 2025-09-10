# Node.js/Rust FFI 性能基准测试 (使用 N-API-RS)

测量和分析通过 `napi-rs` 在 Node.js (TypeScript/JavaScript) 中调用 Rust 函数的外部函数接口（FFI）性能开销。



## 安装与设置

1.  **进入代码目录**
    ```bash
    cd napi-ffi-bench
    ```

2.  **安装 Node.js 依赖**
    ```bash
    npm install
    ```

3.  **编译 Rust 模块**
    ```bash
    # 以 release 模式构建（最高性能）
    npm run build
    ```
    > **注意**: 每次修改 `src/lib.rs` 中的 Rust 代码后，需要重新运行`npm run benchmark`

## 运行基准测试

使用 `package.json` 中定义的脚本来运行测试。该脚本会先确保 Rust 模块已编译，然后再执行测试文件。
```bash
npm run benchmark
```
