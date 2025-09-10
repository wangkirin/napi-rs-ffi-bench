use napi::bindgen_prelude::*;
use napi_derive::*;
use std::time::Instant;

// 场景 A: 简单计算 - 两个 i64 相加
// napi-rs 会处理 JS number -> i64 的转换
#[napi]
pub fn sum_as_i64(a: i64, b: i64) -> i64 {
  a + b
}

// 场景 B: 复杂数据处理 - 计算 Vec<f64> 的总和
// napi-rs 会处理 JS Array<number> -> Vec<f64> 的转换
#[napi]
pub fn sum_list_of_floats(data: Vec<f64>) -> f64 {
  data.iter().sum()
}

// 为了在场景 C 中返回一个结构化的对象 { result, nanos } 给 JS,
// 我们需要定义一个结构体，并用 #[napi(object)] 宏标记它。
#[napi(object)]
pub struct TimingResult {
  pub result: f64,
  pub nanos: String,
}

// 场景 C: 返回结果和内部执行时间
#[napi]
pub fn sum_list_of_floats_with_timing(data: Vec<f64>) -> TimingResult {
  let start = Instant::now();
  let sum = data.iter().sum();
  let duration = start.elapsed();

  TimingResult {
    result: sum,
    nanos: duration.as_nanos().to_string(), // 转为字符串
  }
}