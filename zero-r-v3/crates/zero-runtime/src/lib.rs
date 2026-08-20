#![no_std]

#[no_mangle]
pub extern "C" fn score_future(population_prior: f64, personal_prior: f64, cost: f64) -> f64 {
    let prior = population_prior.clamp(0.0, 1.0) * 0.35 + personal_prior.clamp(0.0, 1.0) * 0.65;
    let c = if cost <= 0.000001 { 0.000001 } else { cost };
    prior / c
}

#[no_mangle]
pub extern "C" fn select_depth(probability: f64, utility: f64) -> u32 {
    if probability >= 0.70 && utility > 1.0 { 5 }
    else if probability >= 0.45 && utility > 0.5 { 4 }
    else if probability >= 0.20 && utility > 0.1 { 3 }
    else if probability >= 0.05 { 2 }
    else { 1 }
}
