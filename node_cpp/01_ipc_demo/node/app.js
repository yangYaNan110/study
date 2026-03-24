const { spawn } = require('child_process');
const path = require('path');

/**
 * 方案一：stdin/stdout + JSON
 * Node.js 作为主进程，启动 C++ 子进程
 * 通过 stdin/stdout 进行 JSON 数据交互
 */

class CppWorkerPool {
    constructor(workerPath) {
        this.workerPath = workerPath;
        this.child = null;
        this.requestId = 0;
        this.callbacks = new Map();
        this.isReady = false;
        this.buffer = '';  // 缓冲区用于处理不完整的行
    }

    /**
     * 启动 C++ 子进程
     */
    start() {
        return new Promise((resolve, reject) => {
            try {
                // 启动 C++ 程序
                this.child = spawn(this.workerPath);

                // 处理 stdout（结果数据）
                this.child.stdout.on('data', (data) => {
                    // 添加数据到缓冲区
                    this.buffer += data.toString();

                    // 分割完整的行
                    const lines = this.buffer.split('\n');
                    // 保留不完整的最后一行
                    this.buffer = lines.pop() || '';

                    lines.forEach(line => {
                        if (!line.trim()) return;
                        try {
                            const result = JSON.parse(line);
                            // 查找对应的回调函数
                            const callback = this.callbacks.get(result.requestId);
                            if (callback) {
                                this.callbacks.delete(result.requestId);
                                if (result.status === 'error') {
                                    callback(new Error(result.error || 'Unknown error'));
                                } else {
                                    callback(null, result);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to parse JSON:', line, e.message);
                        }
                    });
                });

                // 处理 stderr（错误信息）
                this.child.stderr.on('data', (data) => {
                    console.error(`[C++ stderr]: ${data}`);
                });

                // 处理子进程退出
                this.child.on('close', (code) => {
                    console.log(`[C++ process exited with code ${code}]`);
                    this.isReady = false;
                    // 拒绝所有待处理请求
                    this.callbacks.forEach((callback, id) => {
                        callback(new Error(`Worker process exited with code ${code}`));
                        this.callbacks.delete(id);
                    });
                });

                // 处理子进程错误
                this.child.on('error', (err) => {
                    console.error('[C++ process error]:', err);
                    reject(err);
                });

                this.isReady = true;
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 发送请求到 C++ 子进程
     */
    request(operation, data) {
        return new Promise((resolve, reject) => {
            if (!this.isReady) {
                return reject(new Error('Worker is not ready'));
            }

            const requestId = ++this.requestId;
            const request = {
                requestId,
                operation,
                data
            };

            // 保存回调，等待响应
            this.callbacks.set(requestId, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });

            try {
                // 发送 JSON 到 C++ 子进程的 stdin
                this.child.stdin.write(JSON.stringify(request) + '\n');
            } catch (error) {
                this.callbacks.delete(requestId);
                reject(error);
            }
        });
    }

    /**
     * 关闭子进程
     */
    close() {
        return new Promise((resolve) => {
            if (this.child) {
                this.isReady = false;
                this.child.stdin.end();
                this.child.on('close', resolve);
                // 设置超时强制杀死
                setTimeout(() => {
                    if (this.child && !this.child.killed) {
                        this.child.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);
            } else {
                resolve();
            }
        });
    }
}

/**
 * 主程序
 */
async function main() {
    const workerPath = path.join(__dirname, '../cpp/worker');
    const worker = new CppWorkerPool(workerPath);

    try {
        console.log('🚀 启动 C++ 子进程...');
        await worker.start();
        console.log('✅ C++ 子进程已启动\n');

        // 示例 1: 计算和
        console.log('--- 测试1: 计算数组的和 ---');
        let result = await worker.request('sum', [1, 2, 3, 4, 5]);
        console.log('请求: sum([1, 2, 3, 4, 5])');
        console.log('结果:', result.result);
        console.log();

        // 示例 2: 计算平均值
        console.log('--- 测试2: 计算平均值 ---');
        result = await worker.request('average', [10, 20, 30, 40]);
        console.log('请求: average([10, 20, 30, 40])');
        console.log('结果:', result.result);
        console.log();

        // 示例 3: 计算标准差
        console.log('--- 测试3: 计算标准差 ---');
        result = await worker.request('stddev', [1, 2, 3, 4, 5]);
        console.log('请求: stddev([1, 2, 3, 4, 5])');
        console.log('结果:', result.result);
        console.log();

        // 示例 4: 获取统计信息
        console.log('--- 测试4: 获取统计信息 ---');
        result = await worker.request('stats', [2, 4, 6, 8, 10]);
        console.log('请求: stats([2, 4, 6, 8, 10])');
        console.log('结果:', JSON.stringify(result, null, 2));
        console.log();

        // 示例 5: 测试错误处理
        console.log('--- 测试5: 错误处理 ---');
        try {
            result = await worker.request('invalid_op', [1, 2, 3]);
        } catch (e) {
            console.log('捕获到错误:', e.message || e);
        }

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        console.log('\n🛑 关闭子进程...');
        await worker.close();
        console.log('✅ 子进程已关闭');
    }
}

// 运行主程序
main().catch(error => console.error('Fatal error:', error));
