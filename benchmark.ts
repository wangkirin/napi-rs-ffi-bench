// 导入我们编译的 Rust 模块和 Node.js 的性能计时器
import {
  sumAsI64,
  sumListOfFloats,
  sumListOfFloatsWithTiming,
} from './index.js'
import { performance } from 'perf_hooks'

// --- 定义纯 JS 的对比函数 ---

function jsSumAsI64(a: number, b: number): number {
  return a + b
}

function jsSumListOfFloats(data: number[]): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  // 或者使用 reduce, 但 for 循环通常更快
  // return data.reduce((acc, val) => acc + val, 0);
  return sum
}

async function main() {
  // --- 准备测试数据 ---
  const NUMBER_OF_CALLS_SIMPLE = 1_000_000
  const NUMBER_OF_CALLS_COMPLEX = 1_000
  const LIST_SIZE = 100_000

  // 在 JS 中创建数组
  const floatList = new Array(LIST_SIZE)
  for (let i = 0; i < LIST_SIZE; i++) {
    floatList[i] = i
  }

  console.log('--- FFI 性能损耗测量 (Node.js -> Rust) ---')
  console.log(`简单函数调用次数: ${NUMBER_OF_CALLS_SIMPLE.toLocaleString()}`)
  console.log(`复杂函数调用次数: ${NUMBER_OF_CALLS_COMPLEX.toLocaleString()}`)
  console.log(`数组大小: ${LIST_SIZE.toLocaleString()}\n`)

  // --- 场景 A: 简单整数相加 ---
  console.log('--- 场景 A: 简单整数相加 (a + b) ---')
  
  let start = performance.now()
  for (let i = 0; i < NUMBER_OF_CALLS_SIMPLE; i++) {
    jsSumAsI64(10, 20)
  }
  let end = performance.now()
  const tJsSimple = end - start
  console.log(`纯 JS:         ${tJsSimple.toFixed(3)} 毫秒`)

  start = performance.now()
  for (let i = 0; i < NUMBER_OF_CALLS_SIMPLE; i++) {
    sumAsI64(10, 20)
  }
  end = performance.now()
  const tRustSimple = end - start
  console.log(`napi-rs -> Rust: ${tRustSimple.toFixed(3)} 毫秒`)

  const ffiFactorSimple = tRustSimple / tJsSimple
  console.log(`性能比较: FFI 调用比纯 JS 慢 ${ffiFactorSimple.toFixed(2)} 倍\n`)
  
  // --- 场景 B: 浮点数数组求和 ---
  console.log(`--- 场景 B: 计算 ${LIST_SIZE.toLocaleString()} 个浮点数的总和 ---`)
  
  start = performance.now()
  for(let i = 0; i < NUMBER_OF_CALLS_COMPLEX; i++) {
    jsSumListOfFloats(floatList)
  }
  end = performance.now()
  const tJsComplex = end - start
  console.log(`纯 JS:         ${tJsComplex.toFixed(3)} 毫秒`)
  
  start = performance.now()
  for(let i = 0; i < NUMBER_OF_CALLS_COMPLEX; i++) {
    sumListOfFloats(floatList)
  }
  end = performance.now()
  const tRustComplex = end - start
  console.log(`napi-rs -> Rust: ${tRustComplex.toFixed(3)} 毫秒`)
  
  if (tRustComplex < tJsComplex) {
    const speedup = tJsComplex / tRustComplex
    console.log(`性能比较: FFI 调用比纯 JS 快 ${speedup.toFixed(2)} 倍\n`)
  } else {
    const slowdown = tRustComplex / tJsComplex
    console.log(`性能比较: FFI 调用比纯 JS 慢 ${slowdown.toFixed(2)} 倍\n`)
  }

  // --- 场景 C: 精确分离 FFI 开销 ---
  console.log(`--- 场景 C: 精确测量 ${NUMBER_OF_CALLS_COMPLEX.toLocaleString()} 次调用的时间分布 ---`)

  let totalRustInternalDurationNs = 0n // 使用 BigInt
  
  const startTotalTime = performance.now()
  for (let i = 0; i < NUMBER_OF_CALLS_COMPLEX; i++) {
    const { result, nanos } = sumListOfFloatsWithTiming(floatList)
    totalRustInternalDurationNs += BigInt(nanos)
  }
  const endTotalTime = performance.now()

  // --- 计算三个核心时间 ---
  const totalJsTimeMs = endTotalTime - startTotalTime
  // BigInt to number conversion. Note: Direct conversion to seconds.
  const totalRustInternalTimeMs = Number(totalRustInternalDurationNs / 1_000_000n)
  const totalFfiOverheadMs = totalJsTimeMs - totalRustInternalTimeMs

  console.log('\n--- 性能分析 (总计) ---')
  console.log(`JS 测量的总时间 (T_total): ${totalJsTimeMs.toFixed(3)} 毫秒`)
  console.log(`Rust 内部执行时间 (T_rust): ${totalRustInternalTimeMs.toFixed(3)} 毫秒`)
  console.log(`FFI 开销时间     (T_ffi) : ${totalFfiOverheadMs.toFixed(3)} 毫秒`)

  console.log('\n--- 性能分析 (单次调用平均) ---')
  const avgTotalMs = totalJsTimeMs / NUMBER_OF_CALLS_COMPLEX
  const avgRustMs = totalRustInternalTimeMs / NUMBER_OF_CALLS_COMPLEX
  const avgFfiMs = totalFfiOverheadMs / NUMBER_OF_CALLS_COMPLEX
  console.log(`平均总耗时:   ${avgTotalMs.toFixed(6)} 毫秒`)
  console.log(`平均Rust耗时: ${avgRustMs.toFixed(6)} 毫秒`)
  console.log(`平均FFI开销:  ${avgFfiMs.toFixed(6)} 毫秒`)

  if (totalJsTimeMs > 0) {
    const rustPercentage = (totalRustInternalTimeMs / totalJsTimeMs) * 100
    const ffiPercentage = (totalFfiOverheadMs / totalJsTimeMs) * 100
    console.log(`\n在总时间中，Rust 核心计算占 ${rustPercentage.toFixed(2)}%, FFI 开销占 ${ffiPercentage.toFixed(2)}%`)
  }
}

main().catch(console.error)