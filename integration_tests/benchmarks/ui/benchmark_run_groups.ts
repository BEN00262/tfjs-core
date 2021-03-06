/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {BatchNormalization3DCPUBenchmark, BatchNormalization3DGPUBenchmark} from '../batchnormalization3d_benchmark';
import {ConvGPUBenchmark, ConvParams, DepthwiseConvParams, RegularConvParams} from '../conv_benchmarks';
import {MatmulCPUBenchmark, MatmulGPUBenchmark} from '../matmul_benchmarks';
import {PoolBenchmarkParams, PoolCPUBenchmark, PoolGPUBenchmark} from '../pool_benchmarks';
import {ReductionOpsCPUBenchmark, ReductionOpsGPUBenchmark} from '../reduction_ops_benchmark';
import {BenchmarkTest} from '../types';
import {UnaryOpsCPUBenchmark, UnaryOpsGPUBenchmark} from '../unary_ops_benchmark';

export interface BenchmarkRunGroup {
  name: string;
  // Min and max steps to run the benchmark test over.
  min: number;
  max: number;
  // The size of the step to take between benchmark runs.
  stepSize: number;
  // A transformation of step to the size passed to the benchmark test.
  stepToSizeTransformation?: (step: number) => number;
  // Option parameters which is given to the benchmark test. (e.g. ops types)
  options?: string[];
  selectedOption?: string;
  benchmarkRuns: BenchmarkRun[];
  params: {[option: string]: {}};
}

export class BenchmarkRun {
  name: string;
  benchmarkTest: BenchmarkTest;

  chartData: ChartData[];
  constructor(name: string, benchmarkTest: BenchmarkTest) {
    this.name = name;
    this.benchmarkTest = benchmarkTest;
    this.chartData = [];
  }

  clearChartData() {
    this.chartData = [];
  }
}

export function getRunGroups(): BenchmarkRunGroup[] {
  const groups: BenchmarkRunGroup[] = [];

  groups.push({
    name: 'Batch Normalization 3D: input [size, size, 8]',
    min: 0,
    max: 512,
    stepSize: 64,
    stepToSizeTransformation: (step: number) => Math.max(1, step),
    benchmarkRuns: [
      new BenchmarkRun(
          'batchnorm3d_gpu', new BatchNormalization3DGPUBenchmark()),
      new BenchmarkRun(
          'batchnorm3d_cpu', new BatchNormalization3DCPUBenchmark())
    ],
    params: {}
  });

  groups.push({
    name: 'Matrix Multiplication: ' +
        'matmul([size, size], [size, size])',
    min: 0,
    max: 1024,
    stepSize: 64,
    stepToSizeTransformation: (step: number) => Math.max(1, step),
    benchmarkRuns: [
      new BenchmarkRun('mulmat_gpu', new MatmulGPUBenchmark()),
      new BenchmarkRun('mulmat_cpu', new MatmulCPUBenchmark())
    ],
    params: {}
  });

  const convParams:
      ConvParams = {inDepth: 8, filterSize: 7, stride: 1, pad: 'same'};
  const regParams: RegularConvParams =
      Object.assign({}, convParams, {outDepth: 3});
  const depthwiseParams: DepthwiseConvParams =
      Object.assign({}, convParams, {channelMul: 1});
  groups.push({
    name: 'Convolution ops [size, size, depth]',
    min: 0,
    max: 1024,
    stepSize: 64,
    stepToSizeTransformation: (step: number) => Math.max(1, step),
    benchmarkRuns: [new BenchmarkRun('conv_gpu', new ConvGPUBenchmark())],
    options: ['regular', 'transposed', 'depthwise'],
    selectedOption: 'regular',
    params: {
      'regular': regParams,
      'transposed': regParams,
      'depthwise': depthwiseParams
    }
  });

  const poolParams: PoolBenchmarkParams = {depth: 8, fieldSize: 4, stride: 4};
  groups.push({
    name: 'Pool Ops: input [size, size]',
    min: 0,
    max: 1024,
    stepSize: 64,
    stepToSizeTransformation: (step: number) => Math.max(4, step),
    options: ['max', 'avg'],
    selectedOption: 'max',
    benchmarkRuns: [
      new BenchmarkRun('pool_gpu', new PoolGPUBenchmark()),
      new BenchmarkRun('pool_cpu', new PoolCPUBenchmark())
    ],
    params: {'max': poolParams, 'avg': poolParams}
  });

  groups.push({
    name: 'Unary Ops: input [size, size]',
    min: 0,
    max: 1024,
    stepToSizeTransformation: (step: number) => Math.max(1, step),
    options: [
      'abs',        'acos',  'acosh',   'asin',       'asinh', 'atan',
      'atanh',      'ceil',  'cos',     'cosh',       'elu',   'erf',
      'exp',        'expm1', 'floor',   'leakyRelu',  'log',   'log1p',
      'logSigmoid', 'neg',   'prelu',   'reciprocal', 'relu',  'round',
      'rsqrt',      'selu',  'sigmoid', 'sign',       'sin',   'sinh',
      'softplus',   'sqrt',  'square',  'step',       'tan',   'tanh'
    ],
    selectedOption: 'log',
    stepSize: 64,
    benchmarkRuns: [
      new BenchmarkRun('unary ops CPU', new UnaryOpsCPUBenchmark()),
      new BenchmarkRun('unary ops GPU', new UnaryOpsGPUBenchmark())
    ],
    params: {}
  });

  groups.push({
    name: 'Reduction Ops: input [size * size]',
    min: 0,
    max: 1024,
    stepToSizeTransformation: (step: number) => Math.max(1, step),
    options: ['max', 'min', 'argMax', 'argMin', 'sum', 'logSumExp'],
    selectedOption: 'max',
    stepSize: 64,
    benchmarkRuns: [
      new BenchmarkRun('reduction ops CPU', new ReductionOpsCPUBenchmark()),
      new BenchmarkRun('reduction ops GPU', new ReductionOpsGPUBenchmark())
    ],
    params: {}
  });

  return groups;
}
